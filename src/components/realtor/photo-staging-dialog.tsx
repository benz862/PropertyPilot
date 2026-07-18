"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useEffectEvent, useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { STAGING_STYLES, type StagingStyleId } from "@/lib/staging/styles";
import { getPhotoPublicUrl } from "@/lib/storage/photo-url";
import type { Photo } from "@/types/database";
import { cn } from "@/lib/utils";

interface StagingJobView {
  id: string;
  status: "pending" | "processing" | "succeeded" | "failed";
  style: string;
  result_url: string | null;
  error_message: string | null;
  result_photo_id: string | null;
}

interface PhotoStagingDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  propertyId: string;
  photo: Photo;
}

export function PhotoStagingDialog({
  open,
  onOpenChange,
  propertyId,
  photo,
}: PhotoStagingDialogProps) {
  const router = useRouter();
  const sourceUrl = getPhotoPublicUrl(photo);
  const [style, setStyle] = useState<StagingStyleId>("modern");
  const [job, setJob] = useState<StagingJobView | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isStarting, setIsStarting] = useState(false);
  const [isPromoting, setIsPromoting] = useState(false);

  const pollJob = useEffectEvent(async (jobId: string) => {
    const response = await fetch(
      `/api/properties/${propertyId}/photos/${photo.id}/stage/${jobId}`,
    );
    const payload = (await response.json()) as {
      data: { job: StagingJobView } | null;
      error: string | null;
    };

    if (!response.ok || !payload.data?.job) {
      setError(payload.error ?? "Failed to check staging status.");
      return;
    }

    setJob(payload.data.job);
    if (payload.data.job.status === "failed") {
      setError(payload.data.job.error_message ?? "Staging failed.");
    }
  });

  useEffect(() => {
    if (!open) {
      setJob(null);
      setError(null);
      setIsStarting(false);
      setIsPromoting(false);
      return;
    }
  }, [open]);

  useEffect(() => {
    if (!job || job.status === "succeeded" || job.status === "failed") {
      return;
    }

    const interval = window.setInterval(() => {
      void pollJob(job.id);
    }, 2000);

    return () => window.clearInterval(interval);
  }, [job, pollJob]);

  async function startStaging() {
    setIsStarting(true);
    setError(null);
    setJob(null);

    try {
      const response = await fetch(`/api/properties/${propertyId}/photos/${photo.id}/stage`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ style }),
      });
      const payload = (await response.json()) as {
        data: { job: StagingJobView } | null;
        error: string | null;
      };

      if (!response.ok || !payload.data?.job) {
        throw new Error(payload.error ?? "Failed to start staging.");
      }

      setJob(payload.data.job);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to start staging.");
    } finally {
      setIsStarting(false);
    }
  }

  async function promoteToListing() {
    if (!job) return;
    setIsPromoting(true);
    setError(null);

    try {
      const response = await fetch(
        `/api/properties/${propertyId}/photos/${photo.id}/stage/${job.id}/promote`,
        { method: "POST" },
      );
      const payload = (await response.json()) as {
        data: { job: StagingJobView } | null;
        error: string | null;
      };

      if (!response.ok || !payload.data?.job) {
        throw new Error(payload.error ?? "Failed to add staged photo.");
      }

      setJob(payload.data.job);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to add staged photo.");
    } finally {
      setIsPromoting(false);
    }
  }

  const isBusy =
    isStarting || job?.status === "pending" || job?.status === "processing";
  const succeeded = job?.status === "succeeded" && job.result_url;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-3xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Virtual staging</DialogTitle>
          <DialogDescription>
            Pick a style and AI will furnish this room. Best results: straight-on, well-lit photos.
            Virtually staged — disclose per your MLS board rules.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {!succeeded ? (
            <div className="grid gap-2 sm:grid-cols-2">
              {STAGING_STYLES.map((entry) => (
                <button
                  key={entry.id}
                  type="button"
                  disabled={isBusy}
                  onClick={() => setStyle(entry.id)}
                  className={cn(
                    "rounded-lg border px-3 py-2 text-left text-sm transition-colors",
                    style === entry.id
                      ? "border-primary bg-primary/5 font-medium"
                      : "border-border hover:bg-muted",
                    isBusy && "opacity-60",
                  )}
                >
                  {entry.label}
                </button>
              ))}
            </div>
          ) : null}

          <div className={cn("grid gap-3", succeeded ? "sm:grid-cols-2" : "grid-cols-1")}>
            <figure className="space-y-2">
              <figcaption className="text-xs font-medium text-muted-foreground">Before</figcaption>
              <div className="relative aspect-[4/3] overflow-hidden rounded-lg bg-secondary">
                {sourceUrl ? (
                  <Image
                    src={sourceUrl}
                    alt={photo.caption ?? "Original photo"}
                    fill
                    className="object-cover"
                  />
                ) : (
                  <div className="flex h-full items-center justify-center text-xs text-muted-foreground">
                    No preview
                  </div>
                )}
              </div>
            </figure>

            {succeeded ? (
              <figure className="space-y-2">
                <figcaption className="text-xs font-medium text-muted-foreground">After</figcaption>
                <div className="relative aspect-[4/3] overflow-hidden rounded-lg bg-secondary">
                  <Image
                    src={job.result_url!}
                    alt={`Staged ${job.style}`}
                    fill
                    className="object-cover"
                  />
                </div>
              </figure>
            ) : null}
          </div>

          {isBusy ? (
            <p className="text-sm text-muted-foreground">
              Staging in progress… usually 30–120 seconds. Keep this window open.
            </p>
          ) : null}

          {error ? <p className="text-sm text-destructive">{error}</p> : null}
        </div>

        <DialogFooter className="flex-col gap-2 sm:flex-row sm:justify-between">
          <div className="flex flex-wrap gap-2">
            {!succeeded ? (
              <Button type="button" onClick={() => void startStaging()} disabled={isBusy || !sourceUrl}>
                {isBusy ? "Staging…" : "Stage photo"}
              </Button>
            ) : (
              <>
                <Button
                  type="button"
                  onClick={() => void promoteToListing()}
                  disabled={isPromoting || Boolean(job.result_photo_id)}
                >
                  {job.result_photo_id
                    ? "Added to listing"
                    : isPromoting
                      ? "Adding…"
                      : "Use as listing photo"}
                </Button>
                <Button type="button" variant="outline" asChild>
                  <a href={job.result_url!} download={`staged-${job.style}.jpg`}>
                    Download
                  </a>
                </Button>
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => {
                    setJob(null);
                    setError(null);
                  }}
                >
                  Try another style
                </Button>
              </>
            )}
          </div>
          <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
