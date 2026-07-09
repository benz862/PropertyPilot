import { createPropertyAccessService } from "@/lib/property-access";
import { createPropertyTwinService } from "@/lib/property-twin/service";

import { buildAssetHtml, generateCopywriting } from "./copywriting";
import { buildBrochureVersionManifest } from "./brochure";
import { DEFAULT_V1_ASSETS, getTemplate, THEME_COLORS } from "./templates";
import type {
  AssetGenerationJob,
  AssetQualityReview,
  AssetTheme,
  AssetType,
  MarketingAsset,
} from "./types";
import { ASSET_DEPENDENCIES } from "./types";

const assetStore = new Map<string, MarketingAsset>();
const jobStore = new Map<string, AssetGenerationJob>();

function knowledgeVersion(snapshot: { facts: unknown[]; knowledgeObjects: unknown[] }): number {
  return snapshot.facts.length + snapshot.knowledgeObjects.length;
}

/**
 * Marketing Asset Engine (PRD-013) — generates branded assets from verified twin data.
 */
export class MarketingAssetService {
  async listAssets(propertyId: string): Promise<MarketingAsset[]> {
    return [...assetStore.values()].filter((a) => a.propertyId === propertyId);
  }

  async generateAssets(input: {
    propertyId: string;
    assetTypes?: AssetType[];
    theme?: AssetTheme;
    actorId?: string | null;
  }): Promise<AssetGenerationJob> {
    const twin = await createPropertyTwinService();
    const snapshot = await twin.getTwinSnapshot(input.propertyId);
    if (!snapshot) {
      throw new Error("Property not found");
    }

    const access = await createPropertyAccessService();
    const token = await access.getOrCreatePermanentToken(input.propertyId);
    const slug = `${snapshot.profile.street}-${snapshot.profile.city}`
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-");
    const qrUrl = access.getAccessUrlForProperty(input.propertyId, slug);

    const copy = generateCopywriting({
      profile: snapshot.profile,
      features: snapshot.systems.map((s) => s.name),
      pois: snapshot.pois.map((p) => ({ title: p.title, subtitle: null })),
      publicRemarks: snapshot.profile.publicRemarks,
    });

    const theme = input.theme ?? "modern";
    const colors = THEME_COLORS[theme];
    const types = input.assetTypes ?? DEFAULT_V1_ASSETS;
    const kVersion = knowledgeVersion(snapshot);

    const job: AssetGenerationJob = {
      id: crypto.randomUUID(),
      propertyId: input.propertyId,
      assetTypes: types,
      theme,
      status: "processing",
      createdAt: new Date().toISOString(),
      completedAt: null,
      error: null,
    };
    jobStore.set(job.id, job);

    for (const assetType of types) {
      const template = getTemplate(assetType, theme);
      const html = buildAssetHtml({
        title: `${assetType.replace(/_/g, " ")} — ${snapshot.profile.street}`,
        address: `${snapshot.profile.street}, ${snapshot.profile.city}`,
        agentName: snapshot.profile.agentName ?? "Listing Agent",
        brokerage: snapshot.profile.brokerage,
        summary: copy.professionalDescription,
        features: copy.propertyHighlights,
        qrUrl,
        theme: colors,
      });

      const asset: MarketingAsset = {
        id: crypto.randomUUID(),
        propertyId: input.propertyId,
        assetType,
        title: `${assetType.replace(/_/g, " ")} — ${snapshot.profile.street}`,
        theme,
        format: assetType === "brochure" ? "html" : "pdf",
        status: "current",
        version: 1,
        sourceKnowledgeVersion: kVersion,
        templateVersion: "1.0.0",
        storagePath: `assets/${input.propertyId}/${assetType}-v1.html`,
        publicUrl: null,
        generatedAt: new Date().toISOString(),
        generatedBy: input.actorId ?? null,
        regenerationReason: null,
        metadata: {
          htmlLength: html.length,
          qrToken: token.token,
          brochureVersion:
            assetType === "brochure"
              ? buildBrochureVersionManifest({
                  template,
                  knowledgeVersion: kVersion,
                  assetSelection: snapshot.knowledgeObjects.map((object) => object.id),
                  photoSelection: snapshot.photos.map((photo) => photo.id).slice(0, 8),
                })
              : null,
        },
      };
      assetStore.set(asset.id, asset);
    }

    job.status = "completed";
    job.completedAt = new Date().toISOString();
    jobStore.set(job.id, job);

    return job;
  }

  markOutdatedByKnowledgeChange(
    propertyId: string,
    changedKeys: string[],
  ): MarketingAsset[] {
    const outdated: MarketingAsset[] = [];
    const affectedTypes = new Set<AssetType>();

    for (const key of changedKeys) {
      const deps = ASSET_DEPENDENCIES[key];
      if (deps) deps.forEach((t) => affectedTypes.add(t));
    }

    if (affectedTypes.size === 0) {
      for (const asset of assetStore.values()) {
        if (asset.propertyId === propertyId && asset.status === "current") {
          asset.status = "outdated";
          asset.regenerationReason = "Knowledge updated";
          assetStore.set(asset.id, asset);
          outdated.push(asset);
        }
      }
      return outdated;
    }

    for (const asset of assetStore.values()) {
      if (
        asset.propertyId === propertyId &&
        asset.status === "current" &&
        affectedTypes.has(asset.assetType)
      ) {
        asset.status = "outdated";
        asset.regenerationReason = `Knowledge changed: ${changedKeys.join(", ")}`;
        assetStore.set(asset.id, asset);
        outdated.push(asset);
      }
    }
    return outdated;
  }

  async reviewQuality(propertyId: string): Promise<AssetQualityReview> {
    const twin = await createPropertyTwinService();
    const snapshot = await twin.getTwinSnapshot(propertyId);
    const issues: string[] = [];
    const warnings: string[] = [];

    if (!snapshot) {
      return { passed: false, issues: ["Property not found"], warnings: [] };
    }

    if (snapshot.photos.length < 3) {
      issues.push("Missing photos for brochure layout");
    }
    if (!snapshot.profile.agentName) {
      warnings.push("Agent name not set");
    }
    if (snapshot.knowledgeObjects.length < 3) {
      warnings.push("Knowledge gaps may affect copy quality");
    }

    return { passed: issues.length === 0, issues, warnings };
  }

  getJob(jobId: string): AssetGenerationJob | null {
    return jobStore.get(jobId) ?? null;
  }
}

export async function createMarketingAssetService(): Promise<MarketingAssetService> {
  return new MarketingAssetService();
}
