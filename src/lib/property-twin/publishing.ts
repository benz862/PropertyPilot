import {
  PUBLISHING_MIN_VERIFICATION_PERCENT,
  REQUIRED_PROPERTY_FIELDS,
} from "@/lib/property-twin/constants";
import type { CompletenessService } from "@/lib/property-twin/completeness";
import type { PropertyTwinRepository } from "@/lib/property-twin/repository";
import type { PropertyProfile, PublishingValidation } from "@/lib/property-twin/types";

export class PublishingService {
  constructor(
    private readonly repository: PropertyTwinRepository,
    private readonly completenessService: CompletenessService,
  ) {}

  async validate(propertyId: string): Promise<PublishingValidation> {
    const profile = await this.repository.getProperty(propertyId);
    if (!profile) {
      return {
        canPublish: false,
        errors: ["Property not found"],
        warnings: [],
      };
    }

    const [pois, photos, facts, completeness, hasVoice, hasPolicy] = await Promise.all([
      this.repository.listPois(propertyId),
      this.repository.listPhotos(propertyId),
      this.repository.listCurrentFacts(propertyId),
      this.completenessService.calculate(propertyId),
      this.repository.hasVoicePersonality(propertyId),
      this.repository.hasAiPolicy(propertyId),
    ]);

    const errors: string[] = [];
    const warnings: string[] = [];

    for (const field of REQUIRED_PROPERTY_FIELDS) {
      const value = profile[fieldToProfileKey(field)];
      if (value === null || value === undefined || value === "") {
        errors.push(`Required field incomplete: ${field.replace(/_/g, " ")}`);
      }
    }

    if (pois.length === 0) {
      errors.push("At least one point of interest is required");
    }

    const primaryPhotos = photos.filter((photo) => photo.is_primary);
    if (primaryPhotos.length === 0) {
      errors.push("Primary photos must be uploaded");
    }

    if (!hasPolicy) {
      errors.push("AI policy must be configured");
    }

    if (!hasVoice) {
      errors.push("Voice personality must be selected");
    }

    const verifiedFacts = facts.filter((fact) => fact.verificationLevel === "verified");
    const verificationPercent =
      facts.length === 0 ? 0 : Math.round((verifiedFacts.length / facts.length) * 100);

    if (verificationPercent < PUBLISHING_MIN_VERIFICATION_PERCENT) {
      errors.push(
        `Knowledge verification below minimum threshold (${verificationPercent}% verified, minimum ${PUBLISHING_MIN_VERIFICATION_PERCENT}%)`,
      );
    }

    if (completeness.overall < 90) {
      warnings.push(
        `Property completeness is ${completeness.overall}%. Goal is 90%+ before publishing.`,
      );
    }

    return {
      canPublish: errors.length === 0,
      errors,
      warnings,
    };
  }
}

function fieldToProfileKey(
  field: (typeof REQUIRED_PROPERTY_FIELDS)[number],
): keyof PropertyProfile {
  const mapping: Record<(typeof REQUIRED_PROPERTY_FIELDS)[number], keyof PropertyProfile> = {
    street: "street",
    city: "city",
    province_state: "provinceState",
    postal_code: "postalCode",
    property_type: "propertyType",
    bedrooms: "bedrooms",
    bathrooms: "bathrooms",
    finished_square_feet: "finishedSquareFeet",
  };
  return mapping[field];
}
