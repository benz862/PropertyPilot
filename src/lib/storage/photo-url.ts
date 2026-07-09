import type { Photo } from "@/types/database";
import { env } from "@/lib/env";

export function getPhotoPublicUrl(photo: Photo): string | null {
  if (!env.supabase.url || !photo.storage_path) {
    return null;
  }
  return `${env.supabase.url}/storage/v1/object/public/${photo.storage_bucket}/${photo.storage_path}`;
}
