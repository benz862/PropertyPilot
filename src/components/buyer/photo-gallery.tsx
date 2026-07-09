"use client";

import Image from "next/image";
import { useState } from "react";
import { ChevronLeft, ChevronRight, X, ZoomIn } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

interface PhotoGalleryPhoto {
  id: string;
  url: string | null;
  caption: string | null;
}

interface PhotoGalleryProps {
  photos: PhotoGalleryPhoto[];
  className?: string;
}

export function PhotoGallery({ photos, className }: PhotoGalleryProps) {
  const [fullscreenIndex, setFullscreenIndex] = useState<number | null>(null);

  if (photos.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">Photos for this area will appear here.</p>
    );
  }

  return (
    <>
      <div className={cn("grid gap-3 sm:grid-cols-2", className)}>
        {photos.map((photo, index) => (
          <button
            key={photo.id}
            type="button"
            className="group relative aspect-[4/3] overflow-hidden rounded-xl bg-secondary text-left"
            onClick={() => setFullscreenIndex(index)}
            aria-label={photo.caption ?? `View photo ${index + 1}`}
          >
            {photo.url ? (
              <Image
                src={photo.url}
                alt={photo.caption ?? "Property photo"}
                fill
                className="object-cover transition-transform group-hover:scale-105"
                sizes="(max-width: 768px) 100vw, 50vw"
              />
            ) : (
              <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
                No preview
              </div>
            )}
            <div className="absolute inset-0 flex items-end bg-gradient-to-t from-black/50 to-transparent p-3 opacity-0 transition-opacity group-hover:opacity-100">
              <span className="flex items-center gap-1 text-xs text-white">
                <ZoomIn className="size-3.5" aria-hidden />
                {photo.caption ?? "View"}
              </span>
            </div>
          </button>
        ))}
      </div>

      {fullscreenIndex !== null && (
        <FullscreenGallery
          photos={photos}
          index={fullscreenIndex}
          onClose={() => setFullscreenIndex(null)}
          onChange={setFullscreenIndex}
        />
      )}
    </>
  );
}

function FullscreenGallery({
  photos,
  index,
  onClose,
  onChange,
}: {
  photos: PhotoGalleryPhoto[];
  index: number;
  onClose: () => void;
  onChange: (index: number) => void;
}) {
  const photo = photos[index];
  if (!photo) return null;

  function goPrev() {
    onChange(index === 0 ? photos.length - 1 : index - 1);
  }

  function goNext() {
    onChange(index === photos.length - 1 ? 0 : index + 1);
  }

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-h-[95vh] max-w-4xl border-none bg-black/95 p-0 text-white">
        <DialogTitle className="sr-only">
          {photo.caption ?? `Photo ${index + 1} of ${photos.length}`}
        </DialogTitle>
        <div className="relative flex min-h-[60vh] items-center justify-center">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="absolute right-2 top-2 z-10 text-white hover:bg-white/10"
            onClick={onClose}
            aria-label="Close gallery"
          >
            <X className="size-5" />
          </Button>
          {photo.url && (
            <Image
              src={photo.url}
              alt={photo.caption ?? "Property photo"}
              width={1200}
              height={800}
              className="max-h-[80vh] w-auto object-contain"
            />
          )}
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="absolute left-2 top-1/2 -translate-y-1/2 text-white hover:bg-white/10"
            onClick={goPrev}
            aria-label="Previous photo"
          >
            <ChevronLeft className="size-6" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="absolute right-2 top-1/2 -translate-y-1/2 text-white hover:bg-white/10"
            onClick={goNext}
            aria-label="Next photo"
          >
            <ChevronRight className="size-6" />
          </Button>
        </div>
        {photo.caption && (
          <p className="px-4 py-3 text-center text-sm text-white/80">{photo.caption}</p>
        )}
        <p className="pb-4 text-center text-xs text-white/50">
          {index + 1} of {photos.length}
        </p>
      </DialogContent>
    </Dialog>
  );
}
