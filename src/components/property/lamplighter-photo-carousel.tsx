"use client";

import { useEffect, useState } from "react";
import Image from "next/image";

const PHOTO_COUNT = 50;
const INTERVAL_MS = 2_500;

export function LamplighterPhotoCarousel() {
  const [activeIndex, setActiveIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  useEffect(() => {
    if (isPaused) return;

    const interval = window.setInterval(() => {
      setActiveIndex((current) => (current + 1) % PHOTO_COUNT);
    }, INTERVAL_MS);

    return () => window.clearInterval(interval);
  }, [isPaused]);

  const photoNumber = String(activeIndex + 1).padStart(2, "0");

  return (
    <section
      aria-label="Property photo gallery"
      className="overflow-hidden rounded-2xl border border-white/20 bg-slate-950 shadow-2xl"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      onFocus={() => setIsPaused(true)}
      onBlur={() => setIsPaused(false)}
    >
      <div className="relative aspect-[3/2] overflow-hidden bg-slate-900">
        <Image
          key={photoNumber}
          src={`/api/5698/photos/${photoNumber}.jpg`}
          alt={`5698 Lamplighter Drive listing photo ${activeIndex + 1} of ${PHOTO_COUNT}`}
          fill
          unoptimized
          sizes="(max-width: 896px) 100vw, 896px"
          className="object-cover motion-safe:animate-in motion-safe:fade-in"
        />
        <div className="absolute inset-x-0 bottom-0 flex items-center justify-between bg-gradient-to-t from-black/70 to-transparent px-5 pb-4 pt-12 text-sm text-white">
          <span>5698 Lamplighter Drive</span>
          <span>{activeIndex + 1} / {PHOTO_COUNT}</span>
        </div>
      </div>
      <div className="flex gap-1.5 px-4 py-3" aria-hidden="true">
        {Array.from({ length: PHOTO_COUNT }, (_, index) => (
          <span
            key={index}
            className={`h-1 flex-1 rounded-full ${index === activeIndex ? "bg-amber-400" : "bg-white/25"}`}
          />
        ))}
      </div>
    </section>
  );
}
