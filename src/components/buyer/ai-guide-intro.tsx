"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

interface AiGuideIntroProps {
  intro: string;
  triggerLabel?: string;
}

export function AiGuideIntro({ intro, triggerLabel = "Meet Your AI Guide" }: AiGuideIntroProps) {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm" className="min-h-10 text-muted-foreground">
          {triggerLabel}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Your PropertyPilot Guide</DialogTitle>
          <DialogDescription>
            A knowledgeable private guide — available whenever you need one.
          </DialogDescription>
        </DialogHeader>
        <p className="text-base leading-relaxed text-foreground">{intro}</p>
        <p className="text-sm text-muted-foreground">
          Tap the microphone anytime to ask a question. I&apos;ll wait for you.
        </p>
      </DialogContent>
    </Dialog>
  );
}
