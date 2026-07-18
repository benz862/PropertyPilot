"use client";

import { type ChangeEvent, useState } from "react";
import Link from "next/link";
import { CheckCircle2, FileText, ImagePlus, Link2, Loader2, Mic, Sparkles, Speaker, ScanLine, Megaphone, Home } from "lucide-react";

import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";

type Status = "idle" | "building" | "published" | "error";

interface PropertyDraft {
  street: string;
  city: string;
  provinceState: string;
  postalCode: string;
  bedrooms: string;
  bathrooms: string;
  squareFeet: string;
  listingPrice: string;
  knowledge: string;
}

const emptyDraft: PropertyDraft = {
  street: "",
  city: "",
  provinceState: "",
  postalCode: "",
  bedrooms: "",
  bathrooms: "",
  squareFeet: "",
  listingPrice: "",
  knowledge: "",
};

export function PropertyPilotV2Studio() {
  const [draft, setDraft] = useState<PropertyDraft>(emptyDraft);
  const [photos, setPhotos] = useState<File[]>([]);
  const [documents, setDocuments] = useState<File[]>([]);
  const [status, setStatus] = useState<Status>("idle");
  const [message, setMessage] = useState<string | null>(null);
  const [tourUrl, setTourUrl] = useState<string | null>(null);

  function update<K extends keyof PropertyDraft>(key: K, value: PropertyDraft[K]) {
    setDraft((current) => ({ ...current, [key]: value }));
  }

  function setFiles(event: ChangeEvent<HTMLInputElement>, kind: "photos" | "documents") {
    const selected = Array.from(event.target.files ?? []);
    if (kind === "photos") setPhotos(selected);
    else setDocuments(selected);
  }

  async function createAndPublish() {
    const requiredFields: Array<[string, string]> = [
      ["Street address", draft.street],
      ["City", draft.city],
      ["State / province", draft.provinceState],
      ["Postal code", draft.postalCode],
      ["Property knowledge", draft.knowledge],
    ];
    const missing = requiredFields
      .filter(([, value]) => !value.trim())
      .map(([label]) => label);

    if (missing.length > 0) {
      setStatus("error");
      setMessage(`Add ${missing.join(", ")} before publishing.`);
      return;
    }

    setStatus("building");
    setMessage("Creating the property knowledge base...");

    try {
      const property = await postJson<{ id: string; slug: string }>("/api/properties", {
        street: draft.street,
        city: draft.city,
        provinceState: draft.provinceState,
        postalCode: draft.postalCode,
        bedrooms: optionalNumber(draft.bedrooms),
        bathrooms: optionalNumber(draft.bathrooms),
        finishedSquareFeet: optionalNumber(draft.squareFeet),
        listingPrice: optionalNumber(draft.listingPrice),
        publicRemarks: draft.knowledge,
      });

      setMessage("Saving the information your voice guide can use...");
      await postJson(`/api/properties/${property.id}/rooms`, {
        name: "Whole Property",
        description: draft.knowledge,
        talkingPoints: splitLines(draft.knowledge),
      });

      if (photos.length > 0) {
        setMessage("Uploading property photos...");
        await uploadFiles(`/api/properties/${property.id}/photos`, photos);
      }

      if (documents.length > 0) {
        setMessage("Uploading property documents...");
        await uploadFiles(`/api/properties/${property.id}/documents`, documents, true);
      }

      setMessage("Building the knowledge base...");
      await postJson("/api/properties/build", {
        propertyId: property.id,
        mls: { rawText: draft.knowledge },
        voiceTranscripts: [draft.knowledge],
      });

      setMessage("Publishing your buyer voice guide...");
      await postJson(`/api/properties/${property.id}/publish`, {});

      setTourUrl(`/p/${property.slug}`);
      setStatus("published");
      setMessage("Your voice guide is live. Buyers can ask by voice or text, and feature-sheet requests go to GoHighLevel.");
    } catch (error) {
      setStatus("error");
      setMessage(error instanceof Error ? error.message : "PropertyPilot V2 could not publish this property.");
    }
  }

  return (
    <div className="mx-auto max-w-6xl space-y-8">
      <section className="relative overflow-hidden rounded-3xl border border-border bg-[radial-gradient(circle_at_top_left,_rgba(255,255,255,0.12),_transparent_34%),linear-gradient(135deg,_rgba(15,23,42,0.96),_rgba(30,41,59,0.92))] px-6 py-8 text-white shadow-2xl sm:px-8 sm:py-10">
        <div className="absolute inset-0 bg-[linear-gradient(120deg,transparent_0%,rgba(255,255,255,0.05)_50%,transparent_100%)]" />
        <div className="relative grid gap-6 lg:grid-cols-[1.25fr_0.75fr] lg:items-end">
          <div className="space-y-4">
            <p className="inline-flex items-center rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs font-medium uppercase tracking-[0.2em] text-white/80">
              PropertyPilot V2 Studio
            </p>
            <h1 className="max-w-2xl text-4xl font-semibold tracking-tight sm:text-5xl">
              Build a property experience buyers can hear, scan, and trust.
            </h1>
            <p className="max-w-2xl text-sm leading-7 text-white/75 sm:text-base">
              Give the studio the facts once. It turns them into an OpenAI voice guide, a QR-driven buyer flow, and distinct print and digital assets.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <StatTile label="Voice" value="OpenAI" icon={Speaker} />
            <StatTile label="Assets" value="QR + print" icon={ScanLine} />
            <StatTile label="Leads" value="CRM-ready" icon={Megaphone} />
            <StatTile label="Mode" value="Live tour" icon={Home} />
          </div>
        </div>
      </section>

      <div className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr]">
        <section className="space-y-5">
          <div className="rounded-3xl border border-border bg-card p-6 shadow-sm">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-medium text-primary">Step 1</p>
                <h2 className="text-2xl font-semibold tracking-tight">Enter the listing</h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  Start with the address and core facts. Everything else flows from this.
                </p>
              </div>
              <BadgePill text={status === "building" ? "Building" : status === "published" ? "Published" : "Draft"} />
            </div>

            <div className="mt-6 grid gap-5 md:grid-cols-2">
              <div className="space-y-3">
                <Label htmlFor="v2-street">Property address</Label>
                <Input id="v2-street" value={draft.street} onChange={(event) => update("street", event.target.value)} placeholder="123 Main Street" />
                <div className="grid grid-cols-2 gap-3">
                  <Input value={draft.city} onChange={(event) => update("city", event.target.value)} placeholder="City" aria-label="City" />
                  <Input value={draft.provinceState} onChange={(event) => update("provinceState", event.target.value)} placeholder="State / Province" aria-label="State or province" />
                </div>
                <Input value={draft.postalCode} onChange={(event) => update("postalCode", event.target.value)} placeholder="Postal code" aria-label="Postal code" />
              </div>

              <div className="grid grid-cols-2 content-end gap-3">
                <div className="space-y-2"><Label htmlFor="v2-price">Price</Label><Input id="v2-price" inputMode="numeric" value={draft.listingPrice} onChange={(event) => update("listingPrice", event.target.value)} placeholder="650000" /></div>
                <div className="space-y-2"><Label htmlFor="v2-sqft">Square feet</Label><Input id="v2-sqft" inputMode="numeric" value={draft.squareFeet} onChange={(event) => update("squareFeet", event.target.value)} placeholder="2400" /></div>
                <div className="space-y-2"><Label htmlFor="v2-beds">Beds</Label><Input id="v2-beds" inputMode="decimal" value={draft.bedrooms} onChange={(event) => update("bedrooms", event.target.value)} placeholder="4" /></div>
                <div className="space-y-2"><Label htmlFor="v2-baths">Baths</Label><Input id="v2-baths" inputMode="decimal" value={draft.bathrooms} onChange={(event) => update("bathrooms", event.target.value)} placeholder="2.5" /></div>
              </div>
            </div>
          </div>

          <div className="rounded-3xl border border-border bg-card p-6 shadow-sm">
            <p className="text-sm font-medium text-primary">Step 2</p>
            <h2 className="mt-1 text-2xl font-semibold tracking-tight">Feed the guide the truth</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Paste the facts, caveats, and anything the guide should refuse to guess about.
            </p>

            <section className="mt-4 space-y-2">
              <Label htmlFor="v2-knowledge">What should the guide know?</Label>
              <Textarea
                id="v2-knowledge"
                value={draft.knowledge}
                onChange={(event) => update("knowledge", event.target.value)}
                rows={10}
                placeholder="Paste the MLS remarks, upgrades, appliances included, utility notes, neighborhood details, and anything you want the guide to answer. Include uncertainty or cautions so it knows when to send buyers to you."
              />
            </section>

            <section className="mt-5 grid gap-4 md:grid-cols-2">
              <UploadField icon={ImagePlus} title="Photos" detail={photos.length ? `${photos.length} selected` : "Optional. JPG, PNG, or WebP."} accept="image/jpeg,image/png,image/webp" multiple onChange={(event) => setFiles(event, "photos")} />
              <UploadField icon={FileText} title="Documents" detail={documents.length ? `${documents.length} selected` : "Optional. PDF or text files."} accept="application/pdf,text/plain,application/vnd.openxmlformats-officedocument.wordprocessingml.document" multiple onChange={(event) => setFiles(event, "documents")} />
            </section>
          </div>

          {message && <Alert variant={status === "error" ? "error" : status === "published" ? "success" : "info"} title={status === "published" ? "Published" : status === "error" ? "Could not publish" : "Working"}>{message}</Alert>}

          <section className="flex flex-wrap items-center gap-3 rounded-3xl border border-border bg-card px-6 py-5 shadow-sm">
            <Button type="button" size="lg" onClick={createAndPublish} disabled={status === "building"}>
              {status === "building" ? <Loader2 className="size-4 animate-spin" aria-hidden /> : <Sparkles className="size-4" aria-hidden />}
              {status === "building" ? "Building" : "Build and publish voice guide"}
            </Button>
            {tourUrl && (
              <Button type="button" variant="outline" size="lg" asChild>
                <Link href={tourUrl} target="_blank"><Mic className="size-4" aria-hidden />Open buyer guide</Link>
              </Button>
            )}
            {tourUrl && (
              <Button type="button" variant="ghost" size="sm" onClick={() => void navigator.clipboard.writeText(`${window.location.origin}${tourUrl}`)}>
                <Link2 className="size-4" aria-hidden />Copy buyer link
              </Button>
            )}
            {status === "published" && <CheckCircle2 className="size-5 text-success" aria-label="Published" />}
          </section>
        </section>

        <aside className="space-y-5">
          <div className="rounded-3xl border border-border bg-card p-6 shadow-sm">
            <p className="text-sm font-medium text-primary">Launch Status</p>
            <h2 className="mt-1 text-2xl font-semibold tracking-tight">What happens when you publish</h2>
            <div className="mt-4 space-y-3">
              <LaunchStep done={true} title="Build the Property DNA" description="MLS, photos, docs, and voice notes become one source of truth." />
              <LaunchStep done={true} title="Generate the buyer assets" description="QR signs, flyers, brochures, and AI voice content are rendered from the same listing facts." />
              <LaunchStep done={true} title="Publish the buyer link" description="The tour goes live at a shareable /p/ link buyers can scan or open directly." />
            </div>
          </div>

          <div className="rounded-3xl border border-border bg-card p-6 shadow-sm">
            <p className="text-sm font-medium text-primary">Step 3</p>
            <h2 className="mt-1 text-2xl font-semibold tracking-tight">Preview the experience</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              This is what the buyer sees and hears once the property is live.
            </p>

            <Tabs defaultValue="voice" className="mt-5">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="voice">Voice</TabsTrigger>
                <TabsTrigger value="qr">QR Sign</TabsTrigger>
                <TabsTrigger value="flyer">Flyer</TabsTrigger>
                <TabsTrigger value="brochure">Brochure</TabsTrigger>
              </TabsList>
              <TabsContent value="voice" className="mt-4">
                <PreviewPanel
                  title="AI voice guide"
                  icon={Speaker}
                  body={voicePreview(draft)}
                  footer="OpenAI transcribes the buyer, reasons over the Property DNA, and speaks the reply back."
                />
              </TabsContent>
              <TabsContent value="qr" className="mt-4">
                <PreviewPanel
                  title="QR sign"
                  icon={ScanLine}
                  body={qrPreview(draft)}
                  footer="This is the printable entry point that gets buyers into the tour."
                />
              </TabsContent>
              <TabsContent value="flyer" className="mt-4">
                <PreviewPanel
                  title="Open house flyer"
                  icon={Megaphone}
                  body={flyerPreview(draft)}
                  footer="Event-first copy with a clear call to action."
                />
              </TabsContent>
              <TabsContent value="brochure" className="mt-4">
                <PreviewPanel
                  title="Buyer brochure"
                  icon={FileText}
                  body={brochurePreview(draft)}
                  footer="Long-form narrative with facts, highlights, and room context."
                />
              </TabsContent>
            </Tabs>
          </div>

          {tourUrl && (
            <div className="rounded-3xl border border-emerald-500/20 bg-emerald-500/5 p-6 shadow-sm">
              <p className="text-sm font-medium text-emerald-700">Live buyer link</p>
              <h3 className="mt-1 text-xl font-semibold tracking-tight text-foreground">Published and ready</h3>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                Buyers can open the tour, ask questions by voice or text, and hear the response spoken back by OpenAI.
              </p>
              <div className="mt-4 flex flex-wrap gap-3">
                <Button type="button" size="lg" asChild>
                  <Link href={tourUrl} target="_blank">
                    <Mic className="size-4" aria-hidden />
                    Open buyer guide
                  </Link>
                </Button>
                <Button type="button" variant="outline" size="lg" onClick={() => void navigator.clipboard.writeText(`${window.location.origin}${tourUrl}`)}>
                  <Link2 className="size-4" aria-hidden />
                  Copy buyer link
                </Button>
              </div>
              <div className="mt-5 rounded-2xl border border-emerald-500/20 bg-background p-4">
                <p className="text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">Preview URL</p>
                <p className="mt-1 break-all text-sm font-medium text-foreground">{tourUrl}</p>
              </div>
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}

function voicePreview(draft: PropertyDraft) {
  const address = draft.street || "this property";
  const knowledge = draft.knowledge.trim();
  return [
    `Welcome to ${address}.`,
    knowledge ? knowledge.slice(0, 180) : "Ask me about the rooms, systems, nearby amenities, or anything you want to verify.",
  ].join(" ");
}

function qrPreview(draft: PropertyDraft) {
  const address = draft.street || "this home";
  return `Scan to explore ${address}. Ask questions by voice, view room details, and request the complete buyer guide.`;
}

function flyerPreview(draft: PropertyDraft) {
  const address = draft.street || "this listing";
  const price = draft.listingPrice ? `$${draft.listingPrice}` : "priced to invite a closer look";
  return `Open House at ${address}. ${price}. Scan the QR code to see the guided tour, review highlights, and contact the listing team.`;
}

function brochurePreview(draft: PropertyDraft) {
  const address = draft.street || "the property";
  const knowledge = draft.knowledge.trim();
  return [
    `A closer look at ${address}.`,
    knowledge ? knowledge.slice(0, 220) : "The brochure expands on layout, features, and the story of the home.",
  ].join(" ");
}

function PreviewPanel({
  title,
  icon: Icon,
  body,
  footer,
}: {
  title: string;
  icon: React.ComponentType<{ className?: string; "aria-hidden"?: boolean }>;
  body: string;
  footer: string;
}) {
  return (
    <div className="rounded-2xl border border-border bg-secondary/30 p-5">
      <div className="flex items-center gap-2">
        <div className="flex size-9 items-center justify-center rounded-full bg-background text-primary shadow-sm">
          <Icon className="size-4" aria-hidden />
        </div>
        <p className="font-medium">{title}</p>
      </div>
      <p className="mt-4 text-sm leading-6 text-foreground">{body}</p>
      <p className="mt-4 text-xs leading-5 text-muted-foreground">{footer}</p>
    </div>
  );
}

function BadgePill({ text }: { text: string }) {
  return <span className="inline-flex rounded-full border border-border bg-background px-3 py-1 text-xs font-medium text-foreground shadow-sm">{text}</span>;
}

function LaunchStep({
  done,
  title,
  description,
}: {
  done: boolean;
  title: string;
  description: string;
}) {
  return (
    <div className="flex gap-3 rounded-2xl border border-border bg-secondary/20 p-4">
      <div className={`mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full ${done ? "bg-emerald-500 text-white" : "bg-muted text-muted-foreground"}`}>
        {done ? "✓" : "•"}
      </div>
      <div>
        <p className="font-medium text-foreground">{title}</p>
        <p className="mt-1 text-sm leading-6 text-muted-foreground">{description}</p>
      </div>
    </div>
  );
}

function StatTile({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value: string;
  icon: React.ComponentType<{ className?: string; "aria-hidden"?: boolean }>;
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/10 p-4 backdrop-blur-sm">
      <Icon className="size-4 text-white/70" aria-hidden />
      <p className="mt-3 text-xs uppercase tracking-[0.18em] text-white/60">{label}</p>
      <p className="mt-1 text-lg font-semibold text-white">{value}</p>
    </div>
  );
}

function UploadField({ icon: Icon, title, detail, ...input }: React.ComponentProps<"input"> & { icon: typeof ImagePlus; title: string; detail: string }) {
  return (
    <label className="flex cursor-pointer items-center gap-3 rounded-lg border border-dashed border-border p-4 transition-colors hover:bg-muted/50">
      <Icon className="size-5 text-muted-foreground" aria-hidden />
      <span className="min-w-0 flex-1"><span className="block text-sm font-medium">{title}</span><span className="block text-xs text-muted-foreground">{detail}</span></span>
      <input className="sr-only" type="file" {...input} />
    </label>
  );
}

async function postJson<T = unknown>(url: string, body: unknown): Promise<T> {
  const response = await fetch(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
  const payload = (await response.json()) as { data?: T; error?: string | null };
  if (!response.ok || payload.error || !payload.data) throw new Error(payload.error ?? "Request failed.");
  return payload.data;
}

async function uploadFiles(url: string, files: File[], document = false) {
  const formData = new FormData();
  for (const file of files) formData.append("files", file);
  if (document) formData.append("documentType", "other");
  const response = await fetch(url, { method: "POST", body: formData });
  const payload = (await response.json()) as { error?: string | null };
  if (!response.ok || payload.error) throw new Error(payload.error ?? "Upload failed.");
}

function optionalNumber(value: string): number | null {
  const number = Number(value);
  return value.trim() && Number.isFinite(number) ? number : null;
}

function splitLines(value: string): string[] {
  return value.split(/[\n.]/).map((item) => item.trim()).filter((item) => item.length > 3).slice(0, 60);
}
