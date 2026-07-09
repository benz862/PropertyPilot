import { COMPLETENESS_WEIGHTS, REQUIRED_PROPERTY_FIELDS } from "@/lib/property-twin/constants";
import type { PropertyTwinRepository } from "@/lib/property-twin/repository";
import type {
  CompletenessBreakdown,
  PropertyCompletenessScore,
  PropertyProfile,
} from "@/lib/property-twin/types";

interface CompletenessInput {
  profile: PropertyProfile;
  systemsCount: number;
  appliancesCount: number;
  photosCount: number;
  primaryPhotosCount: number;
  documentsCount: number;
  poisCount: number;
  hasNeighborhood: boolean;
  maintenanceEventsCount: number;
  verifiedFactsCount: number;
  totalFactsCount: number;
}

export class CompletenessService {
  constructor(private readonly repository: PropertyTwinRepository) {}

  async calculate(propertyId: string): Promise<PropertyCompletenessScore> {
    const profile = await this.repository.getProperty(propertyId);
    if (!profile) {
      throw new Error("Property not found");
    }

    const [systems, appliances, photos, documents, pois, timeline, facts, hasNeighborhood] =
      await Promise.all([
        this.repository.listSystems(propertyId),
        this.repository.listAppliances(propertyId),
        this.repository.listPhotos(propertyId),
        this.repository.listDocuments(propertyId),
        this.repository.listPois(propertyId),
        this.repository.listTimeline(propertyId),
        this.repository.listCurrentFacts(propertyId),
        this.repository.hasNeighborhoodIntelligence(propertyId),
      ]);

    const breakdown = computeBreakdown({
      profile,
      systemsCount: systems.length,
      appliancesCount: appliances.length,
      photosCount: photos.length,
      primaryPhotosCount: photos.filter((photo) => photo.is_primary).length,
      documentsCount: documents.length,
      poisCount: pois.length,
      hasNeighborhood,
      maintenanceEventsCount: timeline.filter((event) =>
        [
          "hvac_installation",
          "roof_replacement",
          "water_heater_replaced",
          "painting",
          "flooring_replacement",
        ].includes(event.eventType),
      ).length,
      verifiedFactsCount: facts.filter((fact) => fact.verificationLevel === "verified").length,
      totalFactsCount: facts.length,
    });

    const overall = Math.round(
      Object.entries(breakdown).reduce((total, [key, value]) => {
        const weight = COMPLETENESS_WEIGHTS[key as keyof CompletenessBreakdown];
        return total + (value / 100) * weight;
      }, 0),
    );

    return {
      overall,
      breakdown,
      missingItems: detectMissingItems({
        profile,
        systems,
        appliances,
        photos,
        documents,
        pois,
        hasNeighborhood,
        facts,
      }),
    };
  }
}

function computeBreakdown(input: CompletenessInput): CompletenessBreakdown {
  const coreFilled = REQUIRED_PROPERTY_FIELDS.filter((field) => {
    const value = input.profile[fieldToProfileKey(field)];
    return value !== null && value !== undefined && value !== "";
  }).length;

  const corePropertyData = Math.round(
    (coreFilled / REQUIRED_PROPERTY_FIELDS.length) * 100,
  );

  const systems = scoreCount(input.systemsCount, 4);
  const appliances = scoreCount(input.appliancesCount, 4);
  const photos = scorePhotos(input.photosCount, input.primaryPhotosCount);
  const documents = scoreCount(input.documentsCount, 2);
  const pois = scoreCount(input.poisCount, 3);
  const neighborhood = input.hasNeighborhood ? 100 : 0;
  const maintenance = scoreCount(input.maintenanceEventsCount, 2);
  const verificationCoverage =
    input.totalFactsCount === 0
      ? 0
      : Math.round((input.verifiedFactsCount / input.totalFactsCount) * 100);

  return {
    corePropertyData,
    systems,
    appliances,
    photos,
    documents,
    pois,
    neighborhood,
    maintenance,
    verificationCoverage,
  };
}

function scoreCount(actual: number, target: number): number {
  if (target <= 0) {
    return 100;
  }
  return Math.min(100, Math.round((actual / target) * 100));
}

function scorePhotos(total: number, primary: number): number {
  if (total === 0) {
    return 0;
  }
  const totalScore = Math.min(100, Math.round((total / 8) * 70));
  const primaryScore = primary > 0 ? 30 : 0;
  return Math.min(100, totalScore + primaryScore);
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

function detectMissingItems(input: {
  profile: PropertyProfile;
  systems: Array<{ name: string; age_years: number | null }>;
  appliances: Array<{ name: string; model: string | null }>;
  photos: Array<{ detected_room: string | null; tags: string[] }>;
  documents: Array<{ document_type: string }>;
  pois: Array<{ title: string }>;
  hasNeighborhood: boolean;
  facts: Array<{ factKey: string; verificationLevel: string }>;
}): string[] {
  const missing: string[] = [];

  for (const field of REQUIRED_PROPERTY_FIELDS) {
    const value = input.profile[fieldToProfileKey(field)];
    if (value === null || value === undefined || value === "") {
      missing.push(`Missing required field: ${field.replace(/_/g, " ")}`);
    }
  }

  const hvac = input.systems.find((system) => system.name.toLowerCase().includes("hvac"));
  if (!hvac || hvac.age_years === null) {
    missing.push("HVAC age missing");
  }

  const roof = input.systems.find((system) => system.name.toLowerCase().includes("roof"));
  if (!roof) {
    missing.push("Roof system missing");
  } else {
    const roofWarranty = input.facts.find(
      (fact) => fact.factKey === "warranty" && fact.verificationLevel !== "retired",
    );
    if (!roofWarranty) {
      missing.push("Roof warranty missing");
    }
  }

  const dishwasher = input.appliances.find((appliance) =>
    appliance.name.toLowerCase().includes("dishwasher"),
  );
  if (dishwasher && !dishwasher.model) {
    missing.push("Dishwasher model missing");
  }

  const flooringFact = input.facts.find((fact) => fact.factKey === "flooring");
  if (!flooringFact || flooringFact.verificationLevel === "unknown") {
    missing.push("Unknown flooring");
  }

  const backyardPhoto = input.photos.some(
    (photo) =>
      photo.detected_room?.toLowerCase().includes("backyard") ||
      photo.tags.some((tag) => tag.toLowerCase().includes("backyard")),
  );
  if (!backyardPhoto) {
    missing.push("No backyard photos");
  }

  const electrical = input.systems.find((system) =>
    system.name.toLowerCase().includes("electrical"),
  );
  if (!electrical) {
    missing.push("Missing electrical information");
  }

  if (input.pois.length === 0) {
    missing.push("No points of interest configured");
  }

  if (input.documents.length === 0) {
    missing.push("No documents uploaded");
  }

  if (!input.hasNeighborhood) {
    missing.push("Neighborhood intelligence missing");
  }

  return missing;
}

export { detectMissingItems };
