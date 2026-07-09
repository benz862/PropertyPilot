"use client";

import { useEffect, useState } from "react";
import { Type } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type TextSize = "default" | "large" | "xlarge";

interface AccessibilityControlsProps {
  className?: string;
}

export function AccessibilityControls({ className }: AccessibilityControlsProps) {
  const [textSize, setTextSize] = useState<TextSize>("default");
  const [highContrast, setHighContrast] = useState(false);

  useEffect(() => {
    document.documentElement.dataset.buyerTextSize = textSize;
    document.documentElement.dataset.buyerHighContrast = highContrast ? "true" : "false";
    return () => {
      delete document.documentElement.dataset.buyerTextSize;
      delete document.documentElement.dataset.buyerHighContrast;
    };
  }, [textSize, highContrast]);

  function cycleTextSize() {
    setTextSize((current) => {
      if (current === "default") return "large";
      if (current === "large") return "xlarge";
      return "default";
    });
  }

  return (
    <div className={cn("flex items-center gap-2", className)}>
      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={cycleTextSize}
        aria-label={`Text size: ${textSize}`}
        className="min-h-10 gap-1.5"
      >
        <Type className="size-4" aria-hidden />
        <span className="text-xs capitalize">{textSize === "default" ? "A" : textSize === "large" ? "A+" : "A++"}</span>
      </Button>
      <Button
        type="button"
        variant={highContrast ? "default" : "ghost"}
        size="sm"
        onClick={() => setHighContrast((v) => !v)}
        aria-pressed={highContrast}
        className="min-h-10 text-xs"
      >
        High contrast
      </Button>
    </div>
  );
}

export function buyerTextSizeClass(textSize: TextSize): string {
  switch (textSize) {
    case "large":
      return "text-lg";
    case "xlarge":
      return "text-xl";
    default:
      return "";
  }
}
