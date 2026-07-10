import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database, PropertyAssetRow } from "@/types/database";

import { generateAllAssets, generateAsset, type GeneratedAsset } from "./asset-generation";
import type { GeneratedAssetType, PropertyDNA } from "./types";

type Client = SupabaseClient<Database>;

/**
 * AssetGenerationService — every asset is generated from Property DNA and
 * persisted so it can be previewed, downloaded, and regenerated.
 */
export class AssetGenerationService {
  constructor(private readonly client: Client) {}

  async list(propertyId: string): Promise<PropertyAssetRow[]> {
    const { data } = await this.client.from("property_assets").select("*").eq("property_id", propertyId);
    return data ?? [];
  }

  async generateAll(dna: PropertyDNA): Promise<PropertyAssetRow[]> {
    const assets = generateAllAssets(dna);
    return this.persist(dna, assets);
  }

  async regenerate(dna: PropertyDNA, type: GeneratedAssetType): Promise<PropertyAssetRow | null> {
    const asset = generateAsset(dna, type);
    const rows = await this.persist(dna, [asset]);
    return rows[0] ?? null;
  }

  private async persist(dna: PropertyDNA, assets: GeneratedAsset[]): Promise<PropertyAssetRow[]> {
    const payload = assets.map((asset) => ({
      property_id: dna.propertyId,
      asset_type: asset.type,
      section: asset.section,
      title: asset.title,
      content: asset.content,
      status: "generated",
      source_dna_version: dna.meta.dnaVersion,
      last_generated_at: asset.generatedAt,
    }));

    const { data, error } = await this.client
      .from("property_assets")
      .upsert(payload, { onConflict: "property_id,asset_type" })
      .select("*");

    if (error) throw new Error(error.message);
    return data ?? [];
  }
}

export function createAssetGenerationService(client: Client): AssetGenerationService {
  return new AssetGenerationService(client);
}
