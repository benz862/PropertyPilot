"use client";

import { cn } from "@/lib/utils";

interface VoiceWaveformProps {
  active: boolean;
  className?: string;
}

export function VoiceWaveform({ active, className }: VoiceWaveformProps) {
  return (
    <div
      className={cn("flex h-8 items-end justify-center gap-1", className)}
      aria-hidden={!active}
      role={active ? "img" : undefined}
      aria-label={active ? "Listening" : undefined}
    >
      {[0, 1, 2, 3, 4].map((bar) => (
        <span
          key={bar}
          className={cn(
            "w-1 rounded-full bg-primary transition-all",
            active ? "animate-pulse" : "h-2 opacity-30",
          )}
          style={
            active
              ? {
                  height: `${12 + (bar % 3) * 8}px`,
                  animationDelay: `${bar * 0.1}s`,
                  animationDuration: "0.6s",
                }
              : { height: "8px" }
          }
        />
      ))}
    </div>
  );
}
