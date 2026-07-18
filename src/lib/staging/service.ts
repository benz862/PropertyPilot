import type { SupabaseClient } from "@supabase/supabase-js";

import { getPhotoPublicUrl } from "@/lib/storage/photo-url";
import { PROPERTY_PHOTO_BUCKET } from "@/lib/uploads/property-upload";
import type { Photo } from "@/types/database";

import {
  getStagingJobResult,
  getStagingJobStatus,
  submitStagingJob,
} from "./fal-client";
import { buildStagingPrompt, type StagingStyleId } from "./styles";

export type StagedPhotoStatus = "pending" | "processing" | "succeeded" | "failed";

export interface StagedPhoto {
  id: string;
  property_id: string;
  source_photo_id: string;
  style: string;
  status: StagedPhotoStatus;
  provider: string;
  provider_request_id: string | null;
  result_storage_bucket: string;
  result_storage_path: string | null;
  result_photo_id: string | null;
  error_message: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface StagedPhotoView extends StagedPhoto {
  result_url: string | null;
}

function toView(job: StagedPhoto): StagedPhotoView {
  const result_url =
    job.result_storage_path && job.status === "succeeded"
      ? getPhotoPublicUrl({
          id: job.id,
          property_id: job.property_id,
          caption: null,
          tags: [],
          ai_description: null,
          display_order: 0,
          storage_bucket: job.result_storage_bucket,
          storage_path: job.result_storage_path,
          created_at: job.created_at,
          updated_at: job.updated_at,
        })
      : null;

  return { ...job, result_url };
}

export async function createStagingJob(
  client: SupabaseClient,
  input: {
    propertyId: string;
    sourcePhoto: Photo;
    style: StagingStyleId;
    userId: string;
    customNote?: string;
  },
): Promise<StagedPhotoView> {
  const imageUrl = getPhotoPublicUrl(input.sourcePhoto);
  if (!imageUrl) {
    throw new Error("Source photo URL is unavailable. Check Supabase storage configuration.");
  }

  const prompt = buildStagingPrompt(input.style, input.customNote);

  const { data: job, error: insertError } = await client
    .from("staged_photos")
    .insert({
      property_id: input.propertyId,
      source_photo_id: input.sourcePhoto.id,
      style: input.style,
      status: "pending",
      provider: "fal",
      created_by: input.userId,
      updated_by: input.userId,
    })
    .select("*")
    .single();

  if (insertError || !job) {
    throw new Error(insertError?.message ?? "Failed to create staging job.");
  }

  try {
    const { requestId } = await submitStagingJob({ imageUrl, prompt });

    const { data: updated, error: updateError } = await client
      .from("staged_photos")
      .update({
        status: "processing",
        provider_request_id: requestId,
        updated_by: input.userId,
      })
      .eq("id", job.id)
      .select("*")
      .single();

    if (updateError || !updated) {
      throw new Error(updateError?.message ?? "Failed to update staging job.");
    }

    return toView(updated as StagedPhoto);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to submit staging job.";
    await client
      .from("staged_photos")
      .update({
        status: "failed",
        error_message: message,
        updated_by: input.userId,
      })
      .eq("id", job.id);

    throw new Error(message);
  }
}

async function persistResultImage(
  client: SupabaseClient,
  job: StagedPhoto,
  imageUrl: string,
): Promise<string> {
  const response = await fetch(imageUrl);
  if (!response.ok) {
    throw new Error(`Failed to download staged image (${response.status}).`);
  }

  const contentType = response.headers.get("content-type") ?? "image/jpeg";
  const extension = contentType.includes("png") ? "png" : contentType.includes("webp") ? "webp" : "jpg";
  const storagePath = `${job.property_id}/staged/${job.source_photo_id}/${job.id}.${extension}`;
  const bytes = Buffer.from(await response.arrayBuffer());

  const { error: uploadError } = await client.storage.from(PROPERTY_PHOTO_BUCKET).upload(storagePath, bytes, {
    contentType,
    upsert: true,
  });

  if (uploadError) {
    throw new Error(uploadError.message);
  }

  return storagePath;
}

export async function refreshStagingJob(
  client: SupabaseClient,
  job: StagedPhoto,
  userId: string,
): Promise<StagedPhotoView> {
  if (job.status === "succeeded" || job.status === "failed") {
    return toView(job);
  }

  if (!job.provider_request_id) {
    return toView(job);
  }

  const status = await getStagingJobStatus(job.provider_request_id);

  if (status.status === "IN_QUEUE" || status.status === "IN_PROGRESS") {
    if (job.status !== "processing") {
      const { data: updated } = await client
        .from("staged_photos")
        .update({ status: "processing", updated_by: userId })
        .eq("id", job.id)
        .select("*")
        .single();
      return toView((updated as StagedPhoto) ?? job);
    }
    return toView(job);
  }

  if (status.status === "FAILED") {
    const { data: failed } = await client
      .from("staged_photos")
      .update({
        status: "failed",
        error_message: status.error ?? "Staging provider failed.",
        updated_by: userId,
      })
      .eq("id", job.id)
      .select("*")
      .single();
    return toView((failed as StagedPhoto) ?? { ...job, status: "failed" });
  }

  if (status.status !== "COMPLETED") {
    return toView(job);
  }

  try {
    const result = await getStagingJobResult(job.provider_request_id);
    const firstImage = result.images[0];
    if (!firstImage?.url) {
      throw new Error("Staging completed but no image was returned.");
    }
    const storagePath = await persistResultImage(client, job, firstImage.url);

    const { data: succeeded, error } = await client
      .from("staged_photos")
      .update({
        status: "succeeded",
        result_storage_bucket: PROPERTY_PHOTO_BUCKET,
        result_storage_path: storagePath,
        error_message: null,
        updated_by: userId,
      })
      .eq("id", job.id)
      .select("*")
      .single();

    if (error || !succeeded) {
      throw new Error(error?.message ?? "Failed to save staging result.");
    }

    return toView(succeeded as StagedPhoto);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to finalize staging result.";
    const { data: failed } = await client
      .from("staged_photos")
      .update({
        status: "failed",
        error_message: message,
        updated_by: userId,
      })
      .eq("id", job.id)
      .select("*")
      .single();
    return toView((failed as StagedPhoto) ?? { ...job, status: "failed", error_message: message });
  }
}

export async function promoteStagedPhoto(
  client: SupabaseClient,
  job: StagedPhoto,
  userId: string,
): Promise<{ photo: Photo; job: StagedPhotoView }> {
  if (job.status !== "succeeded" || !job.result_storage_path) {
    throw new Error("Only successful staging jobs can be added to the listing.");
  }

  if (job.result_photo_id) {
    const { data: existing } = await client.from("photos").select("*").eq("id", job.result_photo_id).maybeSingle();
    if (existing) {
      return { photo: existing as Photo, job: toView(job) };
    }
  }

  const { data: lastPhoto } = await client
    .from("photos")
    .select("display_order")
    .eq("property_id", job.property_id)
    .order("display_order", { ascending: false })
    .limit(1)
    .maybeSingle();

  const displayOrder = typeof lastPhoto?.display_order === "number" ? lastPhoto.display_order + 1 : 0;
  const styleLabel = job.style.replace(/_/g, " ");

  const { data: photo, error: insertError } = await client
    .from("photos")
    .insert({
      property_id: job.property_id,
      caption: `Virtually staged (${styleLabel})`,
      tags: ["virtually-staged", job.style],
      display_order: displayOrder,
      storage_bucket: job.result_storage_bucket,
      storage_path: job.result_storage_path,
      analysis_status: "pending",
      created_by: userId,
      updated_by: userId,
    })
    .select("*")
    .single();

  if (insertError || !photo) {
    throw new Error(insertError?.message ?? "Failed to add staged photo to listing.");
  }

  const { data: updatedJob, error: updateError } = await client
    .from("staged_photos")
    .update({
      result_photo_id: photo.id,
      updated_by: userId,
    })
    .eq("id", job.id)
    .select("*")
    .single();

  if (updateError || !updatedJob) {
    throw new Error(updateError?.message ?? "Failed to link staged photo.");
  }

  return { photo: photo as Photo, job: toView(updatedJob as StagedPhoto) };
}

export function getStagedPhotoPublicUrl(job: StagedPhoto): string | null {
  return toView(job).result_url;
}
