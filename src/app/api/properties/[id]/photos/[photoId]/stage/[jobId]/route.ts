import { NextResponse } from "next/server";

import { requireAuthenticatedUser } from "@/lib/api/auth";
import { refreshStagingJob, type StagedPhoto } from "@/lib/staging/service";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const maxDuration = 60;

interface RouteParams {
  params: Promise<{ id: string; photoId: string; jobId: string }>;
}

export async function GET(_request: Request, { params }: RouteParams) {
  try {
    const user = await requireAuthenticatedUser();
    const { id: propertyId, photoId, jobId } = await params;
    const client = await createClient();

    const { data: job, error } = await client
      .from("staged_photos")
      .select("*")
      .eq("id", jobId)
      .eq("property_id", propertyId)
      .eq("source_photo_id", photoId)
      .maybeSingle();

    if (error) {
      throw new Error(error.message);
    }

    if (!job) {
      return NextResponse.json({ data: null, error: "Staging job not found." }, { status: 404 });
    }

    const refreshed = await refreshStagingJob(client, job as StagedPhoto, user.id);
    return NextResponse.json({ data: { job: refreshed }, error: null });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to load staging job.";
    return NextResponse.json(
      { data: null, error: message },
      { status: message === "Unauthorized" ? 401 : 500 },
    );
  }
}
