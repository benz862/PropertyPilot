import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "@/lib/property-twin/database.types";

export type TypedSupabaseClient = SupabaseClient<Database>;

export const STORAGE_BUCKETS = [
  "avatars",
  "logos",
  "property-photos",
  "documents",
  "generated-pdfs",
  "voice-assets",
  "qr-codes",
  "exports",
] as const;

export type StorageBucket = (typeof STORAGE_BUCKETS)[number];

/** Property-scoped storage paths use `{propertyId}/{filename}`. */
export function propertyStoragePath(propertyId: string, filename: string): string {
  return `${propertyId}/${filename}`;
}

/** Profile-scoped storage paths use `{userId}/{filename}`. */
export function profileStoragePath(userId: string, filename: string): string {
  return `${userId}/${filename}`;
}
