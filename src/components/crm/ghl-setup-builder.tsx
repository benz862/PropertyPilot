"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import QRCode from "qrcode";
import { Check, Copy, Download } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

type SetupDraft = {
  brokerageName: string;
  brokerName: string;
  agentName: string;
  agentPhone: string;
  agentEmail: string;
  notificationEmail: string;
  ghlSubAccount: string;
  calendarName: string;
  listingAddress: string;
  listingSlug: string;
  listingSourceUrl: string;
  propertyNotes: string;
  voiceWidgetId: string;
};

const initialDraft: SetupDraft = {
  brokerageName: "",
  brokerName: "",
  agentName: "",
  agentPhone: "",
  agentEmail: "",
  notificationEmail: "",
  ghlSubAccount: "",
  calendarName: "Property Showings",
  listingAddress: "",
  listingSlug: "",
  listingSourceUrl: "",
  propertyNotes: "",
  voiceWidgetId: "",
};

function slugify(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/\b(drive|dr|street|st|avenue|ave|road|rd|lane|ln|court|ct|boulevard|blvd)\b/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function buildSetupDocument(draft: SetupDraft, propertyUrl: string) {
  const agent = draft.agentName || "the listing agent";
  const recipient = draft.notificationEmail || draft.agentEmail || "[notification email]";
  const source = draft.listingSourceUrl || "[listing URL or uploaded listing details]";
  const widget = draft.voiceWidgetId || "[GoHighLevel voice-agent widget ID]";

  return `# PropertyPilot + GoHighLevel Voice Agent Setup

## Account and property
- GoHighLevel sub-account: ${draft.ghlSubAccount || "[sub-account name]"}
- Brokerage: ${draft.brokerageName || "[brokerage name]"}
- Broker: ${draft.brokerName || "[broker name]"}
- Listing agent: ${agent}
- Agent phone: ${draft.agentPhone || "[agent phone]"}
- Agent email: ${draft.agentEmail || "[agent email]"}
- Listing: ${draft.listingAddress || "[property address]"}
- PropertyPilot page: ${propertyUrl}
- Property source to turn into property knowledge: ${source}
- GoHighLevel voice widget: ${widget}

## Voice agent role
You are the friendly property concierge for ${draft.listingAddress || "this listing"}, representing ${agent} at ${draft.brokerageName || "the brokerage"}. Answer only from the approved property knowledge supplied from the listing source and PropertyPilot page. Do not guess, invent details, give legal/financial advice, or imply agency representation. If an answer is unavailable, say that you will send the question to ${agent}.

## Lead capture
When a visitor shows interest, asks a question, wants a showing, or is ready to continue, naturally collect and confirm:
1. First name
2. Last name
3. Mobile phone number
4. Email address
5. Whether they are already represented by a real estate agent (Yes / No / Unsure)
6. Their question or request, captured in their own words
7. Whether they would like a property walkthrough or showing

Never require a visitor to provide contact information just to browse basic property information. Confirm phone numbers and email addresses back to the visitor before ending the conversation.

## CRM action — every qualified conversation
Create or update one contact in this GoHighLevel sub-account. Deduplicate by email first, then phone. Map these fields:
- First Name → first_name
- Last Name → last_name
- Phone → phone
- Email → email
- Already represented → custom field: already_represented_by_agent
- Property address → custom field: interested_property
- PropertyPilot URL → custom field: propertypilot_url
- Full question/request → custom field: buyer_question_or_request
- Conversation summary → custom field: voice_conversation_summary
- Showing requested → custom field: showing_requested
- Listing source → custom field: listing_source_url

Apply tags: propertypilot, voice-agent, listing-${draft.listingSlug || "[listing-slug]"}. Also apply represented-buyer if the visitor says Yes, or unrepresented-buyer if they say No. Create an opportunity in the property inquiry pipeline with the stage New Voice Lead; use Showing Requested when a walkthrough is requested.

## Agent notification — every qualified conversation
Immediately email ${recipient} with:
Subject: New PropertyPilot voice lead — ${draft.listingAddress || "[property address]"} — {{contact.first_name}} {{contact.last_name}}

Body:
New voice-agent lead for ${draft.listingAddress || "[property address]"}.
Name: {{contact.first_name}} {{contact.last_name}}
Phone: {{contact.phone}}
Email: {{contact.email}}
Already represented: {{contact.already_represented_by_agent}}
Request / question: {{contact.buyer_question_or_request}}
Showing requested: {{contact.showing_requested}}
PropertyPilot page: ${propertyUrl}

## Showing scheduling
If the visitor requests a walkthrough or showing, offer available times from the ${draft.calendarName || "Property Showings"} calendar. Do not promise a time until the appointment is successfully booked. Once booked, create the appointment, attach it to the contact and opportunity, add the tag showing-booked, and email ${recipient} with the visitor name, contact details, property, and appointment date/time.

## Property knowledge preparation
Use ${source} as the source to prepare the property knowledge base. Extract only listing facts that can be verified: address, price, beds, baths, square footage, features, amenities, inclusions, exclusions, disclosures, showing notes, neighborhood details, and open-house details. Mark unknown or conflicting facts for agent review. Do not use protected-class or steering content.

## PropertyPilot page and QR code
The public voice-agent destination is ${propertyUrl}. Create or display a QR code that links exactly to this URL. Place the GoHighLevel voice widget (${widget}) on that page after the widget has been published in this sub-account.

## Brokerage notes
${draft.propertyNotes || "No additional notes supplied."}
`;
}

export function GhlSetupBuilder() {
  const [draft, setDraft] = useState<SetupDraft>(initialDraft);
  const [copied, setCopied] = useState(false);
  const [qrCode, setQrCode] = useState<string | null>(null);

  const propertyUrl = useMemo(() => {
    const slug = draft.listingSlug || slugify(draft.listingAddress) || "listing-slug";
    return `https://propertypilot.app/${slug}`;
  }, [draft.listingAddress, draft.listingSlug]);
  const document = useMemo(() => buildSetupDocument(draft, propertyUrl), [draft, propertyUrl]);

  useEffect(() => {
    void QRCode.toDataURL(propertyUrl, { margin: 1, width: 240, errorCorrectionLevel: "M" }).then(setQrCode);
  }, [propertyUrl]);

  function update<K extends keyof SetupDraft>(key: K, value: SetupDraft[K]) {
    setDraft((current) => ({ ...current, [key]: value }));
  }

  async function copyDocument() {
    await navigator.clipboard.writeText(document);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 2000);
  }

  function downloadDocument() {
    const file = new Blob([document], { type: "text/markdown;charset=utf-8" });
    const href = URL.createObjectURL(file);
    const link = window.document.createElement("a");
    link.href = href;
    link.download = `${draft.listingSlug || "propertypilot"}-gohighlevel-setup.md`;
    link.click();
    URL.revokeObjectURL(href);
  }

  return (
    <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(360px,0.9fr)]">
      <div className="space-y-5">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Brokerage name"><Input value={draft.brokerageName} onChange={(e) => update("brokerageName", e.target.value)} placeholder="Oak & Key Realty" /></Field>
          <Field label="Broker name"><Input value={draft.brokerName} onChange={(e) => update("brokerName", e.target.value)} placeholder="Jordan Smith" /></Field>
          <Field label="Listing agent"><Input value={draft.agentName} onChange={(e) => update("agentName", e.target.value)} placeholder="Alex Morgan" /></Field>
          <Field label="Agent phone"><Input type="tel" value={draft.agentPhone} onChange={(e) => update("agentPhone", e.target.value)} placeholder="(555) 555-5555" /></Field>
          <Field label="Agent email"><Input type="email" value={draft.agentEmail} onChange={(e) => update("agentEmail", e.target.value)} placeholder="alex@brokerage.com" /></Field>
          <Field label="Notification email"><Input type="email" value={draft.notificationEmail} onChange={(e) => update("notificationEmail", e.target.value)} placeholder="leads@brokerage.com" /></Field>
          <Field label="GoHighLevel sub-account"><Input value={draft.ghlSubAccount} onChange={(e) => update("ghlSubAccount", e.target.value)} placeholder="Oak & Key — Main" /></Field>
          <Field label="Showing calendar"><Input value={draft.calendarName} onChange={(e) => update("calendarName", e.target.value)} placeholder="Property Showings" /></Field>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Listing address"><Input value={draft.listingAddress} onChange={(e) => update("listingAddress", e.target.value)} placeholder="5698 Lamplighter Drive" /></Field>
          <Field label="PropertyPilot URL identifier"><Input value={draft.listingSlug} onChange={(e) => update("listingSlug", e.target.value)} placeholder="5698-lamplighter" /></Field>
        </div>
        <Field label="Listing source URL"><Input type="url" value={draft.listingSourceUrl} onChange={(e) => update("listingSourceUrl", e.target.value)} placeholder="https://www.zillow.com/..." /></Field>
        <Field label="GoHighLevel voice widget ID"><Input value={draft.voiceWidgetId} onChange={(e) => update("voiceWidgetId", e.target.value)} placeholder="Paste after the voice agent is published" /></Field>
        <Field label="Brokerage or property notes"><Textarea value={draft.propertyNotes} onChange={(e) => update("propertyNotes", e.target.value)} placeholder="Showing rules, intake preferences, compliance notes, or details to emphasize." /></Field>
      </div>

      <aside className="space-y-4 rounded-xl border bg-muted/20 p-5">
        <div>
          <p className="text-sm font-medium">PropertyPilot destination</p>
          <p className="mt-1 break-all text-sm text-muted-foreground">{propertyUrl}</p>
        </div>
        {qrCode && <Image src={qrCode} alt={`QR code for ${propertyUrl}`} width={192} height={192} unoptimized className="size-48 rounded-lg bg-white p-2" />}
        <p className="text-xs text-muted-foreground">The QR code updates as you edit the listing identifier. Keep the identifier short: for “5698 Lamplighter Drive,” use “5698-lamplighter.”</p>
        <div className="flex flex-wrap gap-2">
          <Button size="sm" onClick={copyDocument}>{copied ? <Check /> : <Copy />}{copied ? "Copied" : "Copy setup"}</Button>
          <Button size="sm" variant="outline" onClick={downloadDocument}><Download />Download setup</Button>
        </div>
        <Textarea aria-label="Generated GoHighLevel setup instructions" readOnly value={document} className="min-h-96 font-mono text-xs" />
      </aside>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <div className="space-y-1.5"><Label>{label}</Label>{children}</div>;
}
