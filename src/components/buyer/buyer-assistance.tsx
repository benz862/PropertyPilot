"use client";

import Link from "next/link";
import {
  Bookmark,
  Calendar,
  FileText,
  Mail,
  Map,
  Phone,
  Send,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { buyerRoutes } from "@/lib/navigation/routes";

interface BuyerAssistanceProps {
  slug: string;
  agentPhone?: string | null;
  agentEmail?: string | null;
  onSave?: () => void;
  saved?: boolean;
}

export function BuyerAssistance({
  slug,
  agentPhone,
  agentEmail,
  onSave,
  saved = false,
}: BuyerAssistanceProps) {
  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <h3 className="text-sm font-semibold text-foreground">Need something?</h3>
      <p className="mt-1 text-xs text-muted-foreground">
        Everything available without leaving the tour.
      </p>
      <div className="mt-3 grid gap-2 sm:grid-cols-2">
        <Button variant="outline" size="sm" className="min-h-11 justify-start gap-2" asChild>
          <Link href={buyerRoutes.lead(slug)}>
            <FileText className="size-4" aria-hidden />
            Feature Sheet
          </Link>
        </Button>
        <Button variant="outline" size="sm" className="min-h-11 justify-start gap-2" asChild>
          <Link href={buyerRoutes.lead(slug)}>
            <FileText className="size-4" aria-hidden />
            Property Brochure
          </Link>
        </Button>
        <Button variant="outline" size="sm" className="min-h-11 justify-start gap-2" asChild>
          <Link href={buyerRoutes.lead(slug)}>
            <Map className="size-4" aria-hidden />
            Floor Plan
          </Link>
        </Button>
        <Button variant="outline" size="sm" className="min-h-11 justify-start gap-2" asChild>
          <Link href={buyerRoutes.lead(slug)}>
            <Calendar className="size-4" aria-hidden />
            Schedule Showing
          </Link>
        </Button>
        {agentPhone && (
          <Button variant="outline" size="sm" className="min-h-11 justify-start gap-2" asChild>
            <a href={`tel:${agentPhone}`}>
              <Phone className="size-4" aria-hidden />
              Call Agent
            </a>
          </Button>
        )}
        {agentEmail && (
          <Button variant="outline" size="sm" className="min-h-11 justify-start gap-2" asChild>
            <a href={`mailto:${agentEmail}`}>
              <Send className="size-4" aria-hidden />
              Send Question
            </a>
          </Button>
        )}
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="min-h-11 justify-start gap-2"
          onClick={onSave}
        >
          <Bookmark className="size-4" aria-hidden />
          {saved ? "Saved" : "Save Property"}
        </Button>
        {!agentPhone && !agentEmail && (
          <Button variant="outline" size="sm" className="min-h-11 justify-start gap-2" asChild>
            <Link href={buyerRoutes.lead(slug)}>
              <Mail className="size-4" aria-hidden />
              Contact Agent
            </Link>
          </Button>
        )}
      </div>
    </div>
  );
}
