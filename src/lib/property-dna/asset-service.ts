import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database, PropertyAssetRow } from "@/types/database";

import { generateAllAssets, generateAsset, type GeneratedAsset } from "./asset-generation";
import { PDF_ASSET_TYPES, PNG_ASSET_TYPES, renderQrPng, renderTextPdf } from "./asset-render";
import { createPublishingService } from "./publishing";
import type { GeneratedAssetType, PropertyDNA } from "./types";

type Client = SupabaseClient<Database>;

const PDF_BUCKET = "generated-pdfs";
const QR_BUCKET = "qr-codes";

/**
 * AssetGenerationService — every asset is generated from Property DNA and
 * persisted so it can be previewed, downloaded, and regenerated.
 */
export class AssetGenerationService {
  constructor(
    private readonly client: Client,
    private readonly baseUrl: string | null = null,
  ) {}

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
    const rows: PropertyAssetRow[] = [];

    for (const asset of assets) {
      const fileUrl = await this.renderAndUpload(dna, asset);
      const payload = {
        property_id: dna.propertyId,
        asset_type: asset.type,
        section: asset.section,
        title: asset.title,
        content: asset.content,
        file_url: fileUrl,
        status: "generated",
        source_dna_version: dna.meta.dnaVersion,
        last_generated_at: asset.generatedAt,
      };

      const { data, error } = await this.client
        .from("property_assets")
        .upsert(payload, { onConflict: "property_id,asset_type" })
        .select("*")
        .single();

      if (error) throw new Error(error.message);
      if (data) rows.push(data);
    }

    return rows;
  }

  private async renderAndUpload(dna: PropertyDNA, asset: GeneratedAsset): Promise<string | null> {
    try {
      if (PNG_ASSET_TYPES.has(asset.type)) {
        const publishing = createPublishingService(this.client, this.baseUrl);
        const url = publishing.publicUrlForSlug(dna.basic.slug ?? "");
        if (!url) return null;

        const buffer = await renderQrPng(url);
        const path = `${dna.propertyId}/${asset.type}.png`;
        const { error } = await this.client.storage.from(QR_BUCKET).upload(path, buffer, {
          contentType: "image/png",
          upsert: true,
        });
        if (error) return null;
        return this.client.storage.from(QR_BUCKET).getPublicUrl(path).data.publicUrl;
      }

      if (PDF_ASSET_TYPES.has(asset.type)) {
        const buffer = await renderTextPdf(asset.title, asset.content);
        const path = `${dna.propertyId}/${asset.type}.pdf`;
        const { error } = await this.client.storage.from(PDF_BUCKET).upload(path, buffer, {
          contentType: "application/pdf",
          upsert: true,
        });
        if (error) return null;
        return this.client.storage.from(PDF_BUCKET).getPublicUrl(path).data.publicUrl;
      }

      return null;
    } catch {
      return null;
    }
  }
}

export function createAssetGenerationService(
  client: Client,
  baseUrl: string | null = null,
): AssetGenerationService {
  return new AssetGenerationService(client, baseUrl);
}
