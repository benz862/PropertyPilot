import { NextResponse } from "next/server";

import { requireAuthenticatedUser } from "@/lib/api/auth";
import { createClient } from "@/lib/supabase/server";
import {
  ALLOWED_DOCUMENT_TYPES,
  MAX_DOCUMENT_FILES,
  PROPERTY_DOCUMENT_BUCKET,
  normalizeDocumentType,
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
    const documentType = normalizeDocumentType(formData.get("documentType"));
    const files = formData.getAll("files").filter((value): value is File => value instanceof File);

    if (files.length === 0) {
      return NextResponse.json(
        { data: null, error: "At least one document is required." },
        { status: 400 },
      );
    }

    if (files.length > MAX_DOCUMENT_FILES) {
      return NextResponse.json(
        { data: null, error: `Upload ${MAX_DOCUMENT_FILES} documents or fewer at a time.` },
        { status: 400 },
      );
    }

    const uploaded = [];

    for (const file of files) {
      if (!ALLOWED_DOCUMENT_TYPES.has(file.type)) {
        throw new Error(`${file.name} is not a supported document type.`);
      }

      const storagePath = propertyUploadPath(propertyId, file.name);
      const { error: uploadError } = await client.storage
        .from(PROPERTY_DOCUMENT_BUCKET)
        .upload(storagePath, file, {
          contentType: file.type,
          upsert: false,
        });

      if (uploadError) {
        throw new Error(uploadError.message);
      }

      const { data: document, error: insertError } = await client
        .from("documents")
        .insert({
          property_id: propertyId,
          document_type: documentType,
          title: titleFromFileName(file.name),
          storage_bucket: PROPERTY_DOCUMENT_BUCKET,
          storage_path: storagePath,
          file_size_bytes: file.size,
          mime_type: file.type,
        })
        .select("*")
        .single();

      if (insertError || !document) {
        await client.storage.from(PROPERTY_DOCUMENT_BUCKET).remove([storagePath]);
        throw new Error(insertError?.message ?? "Failed to save document metadata.");
      }

      uploaded.push(document);
    }

    return NextResponse.json({ data: { documents: uploaded }, error: null }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Document upload failed.";
    return NextResponse.json(
      { data: null, error: message },
      { status: message === "Unauthorized" ? 401 : 500 },
    );
  }
}
