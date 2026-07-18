"use client";

import { useCallback, useEffect, useRef, useState } from "react";

export type CarouselPhoto = {
  name: string;
  src: string;
};

type PropertyCarouselProps = {
  photos: CarouselPhoto[];
  autoplay?: boolean;
  /** Rotation interval in milliseconds. */
  intervalMs?: number;
  /** Optional voice-agent embed rendered as an overlay inside the carousel. */
  voiceEmbed?: React.ReactNode;
  /** Position class for the voice-agent embed overlay. */
  voicePosition?: string;
};

export function PropertyCarousel({
  photos,
  autoplay = true,
  intervalMs = 3000,
  voiceEmbed,
  voicePosition = "bottom-center",
}: PropertyCarouselProps) {
  const [currentPhoto, setCurrentPhoto] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const touchStartX = useRef(0);
  const reduceMotion = useRef(false);

  const hasMultiple = photos.length > 1;

  const stopRotation = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const startRotation = useCallback(() => {
    if (!autoplay || reduceMotion.current || photos.length < 2) return;
    stopRotation();
    timerRef.current = setInterval(() => {
      setCurrentPhoto((index) => (index + 1) % photos.length);
    }, intervalMs);
  }, [autoplay, intervalMs, photos.length, stopRotation]);

  const restartRotation = useCallback(() => {
    stopRotation();
    startRotation();
  }, [startRotation, stopRotation]);

  const showPhoto = useCallback(
    (index: number) => {
      if (photos.length === 0) return;
      setCurrentPhoto((index + photos.length) % photos.length);
    },
    [photos.length],
  );

  useEffect(() => {
    reduceMotion.current = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    startRotation();

    const onVisibility = () => {
      if (document.hidden) {
        stopRotation();
      } else {
        startRotation();
      }
    };
    document.addEventListener("visibilitychange", onVisibility);

    return () => {
      document.removeEventListener("visibilitychange", onVisibility);
      stopRotation();
    };
  }, [startRotation, stopRotation]);

  if (photos.length === 0) {
    return (
      <section className="carousel" aria-label="Property photo gallery" aria-roledescription="carousel">
        <div className="carousel-track">
          <div className="empty-gallery">
            <div>
              <strong>Add property photos</strong>
              The exported carousel will display them here.
            </div>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section
      className="carousel"
      aria-label="Property photo gallery"
      aria-roledescription="carousel"
      onMouseEnter={stopRotation}
      onMouseLeave={startRotation}
      onFocus={stopRotation}
      onBlur={startRotation}
      onTouchStart={(event) => {
        const touch = event.changedTouches[0];
        if (touch) touchStartX.current = touch.clientX;
      }}
      onTouchEnd={(event) => {
        const touch = event.changedTouches[0];
        if (!touch) return;
        const distance = touch.clientX - touchStartX.current;
        if (Math.abs(distance) < 45) return;
        showPhoto(currentPhoto + (distance < 0 ? 1 : -1));
        restartRotation();
      }}
    >
      <div className="carousel-track" aria-live="polite">
        {photos.map((photo, index) => {
          const active = index === currentPhoto;
          return (
            <figure
              key={photo.src}
              className={`carousel-slide${active ? " is-active" : ""}`}
              aria-hidden={!active}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={photo.src}
                alt={photo.name || `Property photo ${index + 1}`}
                loading={index === 0 ? "eager" : "lazy"}
                decoding="async"
              />
            </figure>
          );
        })}
      </div>

      {voiceEmbed ? (
        <div id="voice-agent-embed" className={voicePosition} aria-label="Property voice agent">
          {voiceEmbed}
        </div>
      ) : null}

      <button
        className="carousel-control prev"
        type="button"
        aria-label="Show previous property photo"
        hidden={!hasMultiple}
        onClick={() => {
          showPhoto(currentPhoto - 1);
          restartRotation();
        }}
      >
        &#8249;
      </button>
      <button
        className="carousel-control next"
        type="button"
        aria-label="Show next property photo"
        hidden={!hasMultiple}
        onClick={() => {
          showPhoto(currentPhoto + 1);
          restartRotation();
        }}
      >
        &#8250;
      </button>

      <div className="carousel-dots" aria-label="Choose a property photo" hidden={!hasMultiple}>
        {photos.map((photo, index) => {
          const active = index === currentPhoto;
          return (
            <button
              key={photo.src}
              type="button"
              className={`carousel-dot${active ? " is-active" : ""}`}
              aria-label={`Show property photo ${index + 1}`}
              aria-current={active}
              onClick={() => {
                showPhoto(index);
                restartRotation();
              }}
            />
          );
        })}
      </div>
    </section>
  );
}
