"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BarChart3,
  BookOpen,
  Camera,
  FileText,
  HelpCircle,
  LayoutGrid,
  Map,
  Mic,
  Settings,
  Sparkles,
  Upload,
} from "lucide-react";

import {
  propertyEditorSections,
  realtorRoutes,
  type PropertyEditorSection,
} from "@/lib/navigation/routes";
import { cn } from "@/lib/utils";

const sectionIcons: Record<PropertyEditorSection, typeof LayoutGrid> = {
  overview: LayoutGrid,
  "property-twin": Map,
  knowledge: BookOpen,
  photos: Camera,
  documents: FileText,
  "voice-notes": Mic,
  "buyer-questions": HelpCircle,
  analytics: BarChart3,
  "generated-assets": Sparkles,
  publishing: Upload,
  settings: Settings,
};

interface PropertyEditorNavProps {
  propertyId: string;
}

export function PropertyEditorNav({ propertyId }: PropertyEditorNavProps) {
  const pathname = usePathname();

  return (
    <nav
      className="w-56 shrink-0 space-y-1 overflow-y-auto border-r border-border p-3"
      aria-label="Property editor navigation"
    >
      <Link
        href={realtorRoutes.properties}
        className="mb-2 flex min-h-9 items-center rounded-lg px-3 text-xs font-medium text-muted-foreground hover:bg-secondary hover:text-foreground"
      >
        ← All Properties
      </Link>
      {propertyEditorSections.map((section) => {
        const href = realtorRoutes.propertySection(propertyId, section.slug);
        const isActive = pathname === href || pathname.endsWith(`/${section.slug}`);
        const Icon = sectionIcons[section.slug];

        return (
          <Link
            key={section.slug}
            href={href}
            className={cn(
              "flex min-h-10 items-center gap-3 rounded-lg px-3 text-sm font-medium transition-colors",
              isActive
                ? "bg-primary text-primary-foreground"
                : "text-foreground hover:bg-secondary",
            )}
          >
            <Icon className="size-4 shrink-0" aria-hidden />
            {section.label}
          </Link>
        );
      })}
    </nav>
  );
}
