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

export async function POST(request: Request, { params }: RouteParams) {
  try {
    await requireAuthenticatedUser();
    const { id: propertyId } = await params;
    const client = await createClient();
    const formData = await request.formData();
    const files = formData.getAll("files").filter((value): value is File => value instanceof File);

    if (files.length === 0) {
      return NextResponse.json({ data: null, error: "At least one photo is required." }, { status: 400 });
    }

    if (files.length > MAX_PHOTO_FILES) {
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

    for (const [index, file] of files.entries()) {
      if (!ALLOWED_PHOTO_TYPES.has(file.type)) {
        throw new Error(`${file.name} is not a supported photo type.`);
      }

      const storagePath = propertyUploadPath(propertyId, file.name);
      const detectedRoom = inferRoomFromFileName(file.name);
      const { error: uploadError } = await client.storage
        .from(PROPERTY_PHOTO_BUCKET)
        .upload(storagePath, file, {
          contentType: file.type,
          upsert: false,
        });

      if (uploadError) {
        throw new Error(uploadError.message);
      }

      const { data: photo, error: insertError } = await client
        .from("photos")
        .insert({
          property_id: propertyId,
          caption: titleFromFileName(file.name),
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
