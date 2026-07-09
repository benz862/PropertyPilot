"use client";

import Image from "next/image";
import Link from "next/link";
import { Accessibility, Clock } from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
import { buyerRoutes } from "@/lib/navigation/routes";
import { cn } from "@/lib/utils";

interface TourAreaCardProps {
  slug: string;
  id: string;
  title: string;
  description: string;
  estimatedMinutes: number;
  imageUrl?: string | null;
  accessible?: boolean;
  className?: string;
}

export function TourAreaCard({
  slug,
  id,
  title,
  description,
  estimatedMinutes,
  imageUrl,
  accessible = false,
  className,
}: TourAreaCardProps) {
  return (
    <Link href={buyerRoutes.experience(slug, id)} className={cn("block", className)}>
      <Card className="group overflow-hidden border-border/60 shadow-sm transition-all hover:border-primary/30 hover:shadow-md">
        <div className="relative aspect-[4/3] bg-secondary">
          {imageUrl ? (
            <Image
              src={imageUrl}
              alt={title}
              fill
              className="object-cover transition-transform duration-300 group-hover:scale-105"
              sizes="(max-width: 768px) 100vw, 50vw"
            />
          ) : (
            <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
              {title}
            </div>
          )}
          {accessible && (
            <div className="absolute right-2 top-2 rounded-full bg-background/90 p-1.5">
              <Accessibility className="size-4 text-primary" aria-label="Accessible area" />
            </div>
          )}
        </div>
        <CardContent className="space-y-2 p-4">
          <h3 className="text-lg font-semibold text-foreground">{title}</h3>
          <p className="text-sm leading-relaxed text-muted-foreground">{description}</p>
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Clock className="size-3.5" aria-hidden />
            <span>~{estimatedMinutes} min</span>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
