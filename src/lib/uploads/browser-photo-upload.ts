import { createClient } from "@/lib/supabase/client";
import {
  ALLOWED_PHOTO_TYPES,
  PROPERTY_PHOTO_BUCKET,
  propertyUploadPath,
} from "@/lib/uploads/property-upload";

interface UploadedPhoto {
  storagePath: string;
  fileName: string;
  contentType: string;
}

/**
 * Send the image bytes directly to Supabase Storage. This keeps large camera
 * photos out of the Vercel request body, while the authenticated storage
 * policy still limits uploads to the agent's own property folder.
 */
export async function uploadPropertyPhotos(propertyId: string, files: File[]): Promise<number> {
  const client = createClient();
  const uploaded: UploadedPhoto[] = [];

  for (const file of files) {
    if (!ALLOWED_PHOTO_TYPES.has(file.type)) {
      throw new Error(`${file.name} is not a supported photo type.`);
    }

    const storagePath = propertyUploadPath(propertyId, file.name);
    const { error } = await client.storage.from(PROPERTY_PHOTO_BUCKET).upload(storagePath, file, {
      contentType: file.type,
      upsert: false,
    });

    if (error) throw new Error(error.message);
    uploaded.push({ storagePath, fileName: file.name, contentType: file.type });
  }

  const response = await fetch(`/api/properties/${propertyId}/photos`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ files: uploaded }),
  });
  const body = (await response.json()) as { data?: { photos?: unknown[] }; error?: string | null };

  if (!response.ok || body.error) {
    throw new Error(body.error ?? "Photo upload failed.");
  }

  return body.data?.photos?.length ?? uploaded.length;
}
