import { fal } from "@fal-ai/client";

import { requireFalEnv } from "@/lib/env";

export const FAL_STAGING_MODEL = "fal-ai/flux-2-lora-gallery/apartment-staging";

export interface FalStagingSubmitResult {
  requestId: string;
}

export interface FalStagingStatusResult {
  status: "IN_QUEUE" | "IN_PROGRESS" | "COMPLETED" | "FAILED" | string;
  error?: string;
}

export interface FalStagingImage {
  url: string;
  content_type?: string;
  file_name?: string;
}

export interface FalStagingOutput {
  images: FalStagingImage[];
  seed?: number;
  prompt?: string;
}

function configureFal() {
  const { apiKey } = requireFalEnv();
  fal.config({ credentials: apiKey });
}

export async function submitStagingJob(input: {
  imageUrl: string;
  prompt: string;
}): Promise<FalStagingSubmitResult> {
  configureFal();

  const { request_id } = await fal.queue.submit(FAL_STAGING_MODEL, {
    input: {
      image_urls: [input.imageUrl],
      prompt: input.prompt,
      num_images: 1,
      output_format: "jpeg",
      acceleration: "regular",
      enable_safety_checker: true,
      lora_scale: 1,
    },
  });

  return { requestId: request_id };
}

export async function getStagingJobStatus(requestId: string): Promise<FalStagingStatusResult> {
  configureFal();

  const status = await fal.queue.status(FAL_STAGING_MODEL, {
    requestId,
    logs: false,
  });

  return {
    status: status.status,
    error: "error" in status && typeof status.error === "string" ? status.error : undefined,
  };
}

export async function getStagingJobResult(requestId: string): Promise<FalStagingOutput> {
  configureFal();

  const result = await fal.queue.result(FAL_STAGING_MODEL, { requestId });
  const data = result.data as FalStagingOutput;

  if (!data?.images?.length || !data.images[0]?.url) {
    throw new Error("Staging completed but no image was returned.");
  }

  return data;
}
