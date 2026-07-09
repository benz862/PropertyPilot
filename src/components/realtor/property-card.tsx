import Image from "next/image";
import Link from "next/link";
import {
  Archive,
  Copy,
  ExternalLink,
  Eye,
  MoreHorizontal,
  Play,
  Share2,
  Upload,
} from "lucide-react";

import { PropertyHealthBadge } from "@/components/property/property-health-badge";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { buyerRoutes, realtorRoutes } from "@/lib/navigation/routes";
import type { PropertySummary } from "@/lib/realtor-workspace/types";
import { cn } from "@/lib/utils";

interface PropertyCardProps {
  property: PropertySummary;
  compact?: boolean;
}

export function PropertyCard({ property, compact = false }: PropertyCardProps) {
  const statusLabel = property.status.charAt(0).toUpperCase() + property.status.slice(1);

  return (
    <article
      className={cn(
        "group overflow-hidden rounded-xl border border-border bg-card shadow-sm transition-shadow hover:shadow-md",
        compact && "flex flex-row",
      )}
    >
      <div
        className={cn(
          "relative bg-secondary",
          compact ? "h-auto w-32 shrink-0" : "aspect-[16/10] w-full",
        )}
      >
        {property.heroPhotoUrl ? (
          <Image
            src={property.heroPhotoUrl}
            alt={property.address}
            fill
            className="object-cover"
            sizes={compact ? "128px" : "(max-width: 768px) 100vw, 33vw"}
          />
        ) : (
          <div className="flex h-full min-h-24 items-center justify-center text-xs text-muted-foreground">
            No photo
          </div>
        )}
        <div className="absolute left-2 top-2">
          <Badge variant="secondary" className="bg-background/90 text-xs">
            {statusLabel}
          </Badge>
        </div>
      </div>

      <div className={cn("flex flex-1 flex-col p-4", compact && "py-3")}>
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <h3 className="truncate font-semibold text-foreground">{property.address}</h3>
            <p className="mt-0.5 text-xs text-muted-foreground">
              Updated {formatRelativeDate(property.lastUpdated)}
            </p>
          </div>
          <PropertyHealthBadge
            score={property.healthScore}
            status={property.healthStatus}
            label={property.healthScore.toString()}
            className="shrink-0 px-2 py-0.5 text-xs"
          />
        </div>

        <div className="mt-3 grid grid-cols-2 gap-x-4 gap-y-1 text-xs sm:grid-cols-4">
          <Metric label="AI Ready" value={`${property.aiReadiness}%`} />
          <Metric label="Complete" value={`${property.completeness}%`} />
          <Metric label="Visitors" value={property.visitorCount.toString()} />
          <Metric label="Leads" value={property.leadCount.toString()} />
          <Metric
            label="QR"
            value={
              property.qrStatus === "active"
                ? "Active"
                : property.qrStatus === "inactive"
                  ? "Inactive"
                  : "Pending"
            }
          />
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-2">
          <Button size="sm" variant="default" asChild>
            <Link href={realtorRoutes.propertySection(property.id, "overview")}>
              <Play className="size-3.5" aria-hidden />
              Resume
            </Link>
          </Button>
          <Button size="sm" variant="outline" asChild>
            <Link href={buyerRoutes.welcome(property.slug)} target="_blank">
              <Eye className="size-3.5" aria-hidden />
              Preview
            </Link>
          </Button>
          <Button size="sm" variant="outline" asChild>
            <Link href={realtorRoutes.propertySection(property.id, "publishing")}>
              <Upload className="size-3.5" aria-hidden />
              Publish
            </Link>
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button size="sm" variant="ghost" className="size-8 p-0">
                <MoreHorizontal className="size-4" aria-hidden />
                <span className="sr-only">More actions</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem>
                <Share2 className="size-4" aria-hidden />
                Share
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Copy className="size-4" aria-hidden />
                Duplicate
              </DropdownMenuItem>
              <DropdownMenuItem>
                <ExternalLink className="size-4" aria-hidden />
                Open tour
              </DropdownMenuItem>
              <DropdownMenuItem variant="destructive">
                <Archive className="size-4" aria-hidden />
                Archive
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </article>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <span className="text-muted-foreground">{label}</span>
      <span className="ml-1 font-medium text-foreground">{value}</span>
    </div>
  );
}

function formatRelativeDate(iso: string): string {
  const date = new Date(iso);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return "today";
  if (diffDays === 1) return "yesterday";
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString();
}
