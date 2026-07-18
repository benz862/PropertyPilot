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
  const profile = getContentProfile(input.contentType, input.copy);

  return input.channels.map((channel) => {
    const rules = CHANNEL_RULES[channel];
    const body = `${profile.baseText} ${profile.callToAction ?? rules.callToAction}`.trim().slice(0, rules.maxLength);
    return {
      id: crypto.randomUUID(),
      propertyId: input.propertyId,
      channel,
      contentType: input.contentType,
      status: "draft",
      title: profile.title,
      body,
      evidenceKeys: input.evidenceKeys,
      promptKey: PROPERTY_CONCIERGE_PROMPT.key,
      promptVersion: PROPERTY_CONCIERGE_PROMPT.version,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
  });
}

function getContentProfile(
  contentType: MarketingContentType,
  copy: CopywritingOutput,
): {
  baseText: string;
  callToAction: string | null;
  title: string;
} {
  switch (contentType) {
    case "luxury_description":
      return {
        baseText: copy.luxuryDescription,
        callToAction: "Luxury homes deserve private showings by appointment.",
        title: "Luxury Description",
      };
    case "neighborhood_highlight":
      return {
        baseText: copy.neighborhoodSummary,
        callToAction: "Ask for the neighborhood guide.",
        title: "Neighborhood Highlight",
      };
    case "open_house_announcement":
      return {
        baseText: copy.professionalDescription,
        callToAction: "Join us this weekend for the open house.",
        title: "Open House Announcement",
      };
    case "just_listed":
      return {
        baseText: copy.professionalDescription,
        callToAction: "Scan for the full property guide.",
        title: "Just Listed",
      };
    case "price_reduction":
      return {
        baseText: copy.professionalDescription,
        callToAction: "Contact the listing team for updated pricing.",
        title: "Price Reduction",
      };
    default:
      return {
        baseText: copy.professionalDescription,
        callToAction: "View the complete property guide.",
        title: contentType
          .split("_")
          .map((part) => part[0]?.toUpperCase() + part.slice(1))
          .join(" "),
      };
  }
}
