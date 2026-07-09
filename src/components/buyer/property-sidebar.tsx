"use client";

import Link from "next/link";
import { LogOut } from "lucide-react";

import { PropertyInfoPanel } from "@/components/buyer/property-info-panel";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { buyerRoutes } from "@/lib/navigation/routes";
import type { PropertyTwinContext } from "@/types/database";

interface PropertySidebarProps {
  slug: string;
  agentName: string;
  agentPhone?: string | null;
  agentEmail?: string | null;
  context: PropertyTwinContext;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function PropertySidebar({
  slug,
  agentName,
  agentPhone,
  agentEmail,
  context,
  open,
  onOpenChange,
}: PropertySidebarProps) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full max-w-md overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Property Information</SheetTitle>
        </SheetHeader>

        <PropertyInfoPanel
          slug={slug}
          agentName={agentName}
          agentPhone={agentPhone}
          agentEmail={agentEmail}
          context={context}
        />

        <div className="mt-6 border-t border-border pt-4">
          <Button variant="ghost" className="w-full min-h-11 justify-start gap-2" asChild>
            <Link href={buyerRoutes.welcome(slug)}>
              <LogOut className="size-4" aria-hidden />
              Exit Tour
            </Link>
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}

interface PropertySidebarTriggerProps {
  onClick: () => void;
}

export function PropertySidebarTrigger({ onClick }: PropertySidebarTriggerProps) {
  return (
    <Button
      type="button"
      variant="outline"
      size="icon"
      className="fixed right-4 top-4 z-30 size-12 rounded-full"
      onClick={onClick}
      aria-label="Open property information"
    >
      <span aria-hidden className="text-sm font-bold">
        i
      </span>
    </Button>
  );
}
