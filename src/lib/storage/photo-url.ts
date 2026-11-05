import type { Photo } from "@/types/database";

// This module is used by browser-rendered photo cards. Next.js replaces public
// environment variables only when they are referenced by their literal name,
// so do not route this through the dynamic server env helper.
const publicSupabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;

export function getPhotoPublicUrl(photo: Photo): string | null {
  if (!publicSupabaseUrl || !photo.storage_path) {
    return null;
  }
  return `${publicSupabaseUrl}/storage/v1/object/public/${photo.storage_bucket}/${photo.storage_path}`;
}
