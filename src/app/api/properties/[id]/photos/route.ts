import { NextResponse } from "next/server";

import { requireAuthenticatedUser } from "@/lib/api/auth";
import { createClient } from "@/lib/supabase/server";
import {
  ALLOWED_PHOTO_TYPES,
  MAX_PHOTO_FILES,
  PROPERTY_PHOTO_BUCKET,
  inferRoomFromFileName,
  propertyUploadPath,
  titleFromFileName,
} from "@/lib/uploads/property-upload";

export const runtime = "nodejs";

interface RouteParams {
  params: Promise<{ id: string }>;
}

interface DirectPhotoUpload {
  storagePath?: unknown;
  fileName?: unknown;
  contentType?: unknown;
}

export async function POST(request: Request, { params }: RouteParams) {
  try {
    const user = await requireAuthenticatedUser();
    const { id: propertyId } = await params;
    const client = await createClient();
    const { data: property, error: propertyError } = await client
      .from("properties")
      .select("id")
      .eq("id", propertyId)
      .eq("owner_id", user.id)
      .is("deleted_at", null)
      .maybeSingle();

    if (propertyError) throw new Error(propertyError.message);
    if (!property) {
      return NextResponse.json({ data: null, error: "Property not found." }, { status: 404 });
    }

    const isJsonUpload = request.headers.get("content-type")?.includes("application/json");
    const directUploads: DirectPhotoUpload[] = isJsonUpload
      ? ((await request.json() as { files?: DirectPhotoUpload[] }).files ?? [])
      : [];
    const formData = isJsonUpload ? null : await request.formData();
    const files = formData?.getAll("files").filter((value): value is File => value instanceof File) ?? [];
    const uploadCount = isJsonUpload ? directUploads.length : files.length;

    if (uploadCount === 0) {
      return NextResponse.json({ data: null, error: "At least one photo is required." }, { status: 400 });
    }

    if (uploadCount > MAX_PHOTO_FILES) {
      return NextResponse.json(
        { data: null, error: `Upload ${MAX_PHOTO_FILES} photos or fewer at a time.` },
        { status: 400 },
      );
    }

    const { data: lastPhoto, error: orderError } = await client
      .from("photos")
      .select("display_order")
      .eq("property_id", propertyId)
      .order("display_order", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (orderError) {
      throw new Error(orderError.message);
    }

    const startingOrder = typeof lastPhoto?.display_order === "number" ? lastPhoto.display_order + 1 : 0;
    const uploaded = [];

    for (let index = 0; index < uploadCount; index += 1) {
      const file = files[index];
      const directUpload = directUploads[index];
      const fileName = file?.name ?? (typeof directUpload?.fileName === "string" ? directUpload.fileName : "");
      const contentType = file?.type ?? (typeof directUpload?.contentType === "string" ? directUpload.contentType : "");
      const storagePath = file
        ? propertyUploadPath(propertyId, fileName)
        : typeof directUpload?.storagePath === "string"
          ? directUpload.storagePath
          : "";

      if (!fileName || !ALLOWED_PHOTO_TYPES.has(contentType)) {
        throw new Error("Each photo must be a JPG, PNG, or WebP file.");
      }
      if (!storagePath.startsWith(`${propertyId}/`)) {
        throw new Error("Invalid property photo upload path.");
      }

      const detectedRoom = inferRoomFromFileName(fileName);
      if (file) {
        const { error: uploadError } = await client.storage
          .from(PROPERTY_PHOTO_BUCKET)
          .upload(storagePath, file, {
            contentType,
            upsert: false,
          });

        if (uploadError) throw new Error(uploadError.message);
      }

      const { data: photo, error: insertError } = await client
        .from("photos")
        .insert({
          property_id: propertyId,
          caption: titleFromFileName(fileName),
          tags: detectedRoom ? [detectedRoom] : [],
          display_order: startingOrder + index,
          storage_bucket: PROPERTY_PHOTO_BUCKET,
          storage_path: storagePath,
          detected_room: detectedRoom,
          analysis_status: "pending",
        })
        .select("*")
        .single();

      if (insertError || !photo) {
        await client.storage.from(PROPERTY_PHOTO_BUCKET).remove([storagePath]);
        throw new Error(insertError?.message ?? "Failed to save photo metadata.");
      }

      uploaded.push(photo);
    }

    return NextResponse.json({ data: { photos: uploaded }, error: null }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Photo upload failed.";
    return NextResponse.json(
      { data: null, error: message },
      { status: message === "Unauthorized" ? 401 : 500 },
    );
  }
}
