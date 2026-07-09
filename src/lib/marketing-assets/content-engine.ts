import { PROPERTY_CONCIERGE_PROMPT } from "@/lib/ai/reasoning/engine";

import type {
  CopywritingOutput,
  MarketingChannel,
  MarketingContentDraft,
  MarketingContentType,
} from "./types";

const CHANNEL_RULES: Record<MarketingChannel, { maxLength: number; callToAction: string }> = {
  facebook: { maxLength: 900, callToAction: "Message the listing team for details." },
  instagram: { maxLength: 280, callToAction: "Save this listing for your tour." },
  linkedin: { maxLength: 700, callToAction: "Contact the listing team for a private showing." },
  tiktok: { maxLength: 220, callToAction: "Watch the walkthrough and ask what you want to see next." },
  youtube: { maxLength: 1200, callToAction: "Subscribe for the full property walkthrough." },
  pinterest: { maxLength: 350, callToAction: "Pin this property inspiration." },
  x: { maxLength: 240, callToAction: "View the full property guide." },
  threads: { maxLength: 400, callToAction: "Ask for the property guide." },
  google_business_profile: { maxLength: 700, callToAction: "Call for showing availability." },
  email_campaign: { maxLength: 1200, callToAction: "Reply to request the brochure." },
  mls_remarks: { maxLength: 900, callToAction: "See attachments for supporting details." },
  open_house_invitation: { maxLength: 600, callToAction: "Join the open house." },
  flyer: { maxLength: 500, callToAction: "Scan the QR code for the AI property guide." },
};

export function generateMarketingContentDrafts(input: {
  propertyId: string;
  copy: CopywritingOutput;
  channels: MarketingChannel[];
  contentType: MarketingContentType;
  evidenceKeys: string[];
}): MarketingContentDraft[] {
  const baseText =
    input.contentType === "luxury_description"
      ? input.copy.luxuryDescription
      : input.contentType === "neighborhood_highlight"
        ? input.copy.neighborhoodSummary
        : input.copy.professionalDescription;

  return input.channels.map((channel) => {
    const rules = CHANNEL_RULES[channel];
    const body = `${baseText} ${rules.callToAction}`.slice(0, rules.maxLength);
    return {
      id: crypto.randomUUID(),
      propertyId: input.propertyId,
      channel,
      contentType: input.contentType,
      status: "draft",
      title: buildContentTitle(input.contentType),
      body,
      evidenceKeys: input.evidenceKeys,
      promptKey: PROPERTY_CONCIERGE_PROMPT.key,
      promptVersion: PROPERTY_CONCIERGE_PROMPT.version,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
  });
}

function buildContentTitle(contentType: MarketingContentType): string {
  return contentType
    .split("_")
    .map((part) => part[0]?.toUpperCase() + part.slice(1))
    .join(" ");
}
