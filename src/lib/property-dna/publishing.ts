import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "@/types/database";

type Client = SupabaseClient<Database>;

export interface PublishStatus {
  published: boolean;
  publishedAt: string | null;
  slug: string;
  publicUrl: string | null;
}

/**
 * PublishingService — owns only public property pages, QR tours, room QR links,
 * and publish/unpublish. It does not touch marketing, CRM, or DNA assembly.
 */
export class PublishingService {
  constructor(
    private readonly client: Client,
    private readonly baseUrl: string | null = null,
  ) {}

  async publish(propertyId: string): Promise<PublishStatus> {
    const { data, error } = await this.client
      .from("properties")
      .update({ status: "published", published_at: new Date().toISOString() })
      .eq("id", propertyId)
      .is("deleted_at", null)
      .select("slug, status, published_at")
      .single();
    if (error) throw new Error(error.message);
    return this.toStatus(data.slug, data.status === "published" || Boolean(data.published_at), data.published_at ?? null);
  }

  async unpublish(propertyId: string): Promise<PublishStatus> {
    const { data, error } = await this.client
      .from("properties")
      .update({ status: "draft", published_at: null })
      .eq("id", propertyId)
      .is("deleted_at", null)
      .select("slug, status, published_at")
      .single();
    if (error) throw new Error(error.message);
    return this.toStatus(data.slug, false, null);
  }

  async getStatus(propertyId: string): Promise<PublishStatus | null> {
    const { data } = await this.client
      .from("properties")
      .select("slug, status, published_at")
      .eq("id", propertyId)
      .is("deleted_at", null)
      .maybeSingle();
    if (!data) return null;
    return this.toStatus(data.slug, data.status === "published" || Boolean(data.published_at), data.published_at ?? null);
  }

  publicUrlForSlug(slug: string): string | null {
    return this.baseUrl ? `${trimTrailingSlash(this.baseUrl)}/p/${slug}` : null;
  }

  roomLinkForSlug(slug: string, room: string): string | null {
    const base = this.publicUrlForSlug(slug);
    return base ? `${base}?room=${encodeURIComponent(room)}` : null;
  }

  private toStatus(slug: string, published: boolean, publishedAt: string | null): PublishStatus {
    return {
      published,
      publishedAt,
      slug,
      publicUrl: this.publicUrlForSlug(slug),
    };
  }
}

export function createPublishingService(client: Client, baseUrl: string | null = null): PublishingService {
  return new PublishingService(client, baseUrl);
}

function trimTrailingSlash(value: string): string {
  return value.replace(/\/+$/, "");
}
