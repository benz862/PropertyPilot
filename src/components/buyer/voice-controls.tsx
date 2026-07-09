"use client";

import Link from "next/link";
import {
  Calendar,
  FileText,
  MapPin,
  Mic,
  MicOff,
  Pause,
  RotateCcw,
} from "lucide-react";

import { VoiceWaveform } from "@/components/buyer/voice-waveform";
import { Button } from "@/components/ui/button";
import { buyerRoutes } from "@/lib/navigation/routes";
import { cn } from "@/lib/utils";

interface VoiceControlsProps {
  slug: string;
  isListening?: boolean;
  isMuted?: boolean;
  onToggleListen?: () => void;
  onToggleMute?: () => void;
  onReplay?: () => void;
  className?: string;
}

export function VoiceControls({
  slug,
  isListening = false,
  isMuted = false,
  onToggleListen,
  onToggleMute,
  onReplay,
  className,
}: VoiceControlsProps) {
  return (
    <div
      className={cn(
        "fixed inset-x-0 bottom-0 z-40 border-t border-border bg-background/95 px-4 py-4 backdrop-blur-md",
        className,
      )}
      role="toolbar"
      aria-label="Voice tour controls"
    >
      <div className="mx-auto flex max-w-lg flex-col items-center gap-3">
        <VoiceWaveform active={isListening} />
        <div className="flex items-center gap-3">
          <Button
            type="button"
            size="lg"
            variant={isListening ? "default" : "outline"}
            className="size-16 rounded-full p-0"
            onClick={onToggleListen}
            aria-label={isListening ? "Stop listening" : "Start listening"}
            aria-pressed={isListening}
          >
            <Mic className="size-7" aria-hidden />
          </Button>
          <Button
            type="button"
            size="icon"
            variant="ghost"
            className="size-12"
            onClick={onToggleMute}
            aria-label={isMuted ? "Unmute" : "Mute"}
            aria-pressed={isMuted}
          >
            <MicOff className="size-5" aria-hidden />
          </Button>
          <Button
            type="button"
            size="icon"
            variant="ghost"
            className="size-12"
            onClick={onReplay}
            aria-label="Replay last response"
          >
            <RotateCcw className="size-5" aria-hidden />
          </Button>
        </div>

        <div className="flex w-full flex-wrap justify-center gap-2">
          <Button variant="outline" size="sm" className="min-h-10" asChild>
            <Link href={buyerRoutes.start(slug)}>
              <MapPin className="size-4" aria-hidden />
              Change Area
            </Link>
          </Button>
          <Button variant="outline" size="sm" className="min-h-10" asChild>
            <Link href={`${buyerRoutes.experience(slug)}#photos`}>
              <Pause className="size-4" aria-hidden />
              View Photos
            </Link>
          </Button>
          <Button variant="outline" size="sm" className="min-h-10" asChild>
            <Link href={`${buyerRoutes.experience(slug)}#details`}>
              <FileText className="size-4" aria-hidden />
              Property Details
            </Link>
          </Button>
          <Button variant="outline" size="sm" className="min-h-10" asChild>
            <Link href={buyerRoutes.lead(slug)}>
              <Calendar className="size-4" aria-hidden />
              Schedule Showing
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
