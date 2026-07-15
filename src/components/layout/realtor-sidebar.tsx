"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BarChart3,
  BookOpen,
  Brain,
  Building2,
  Calendar,
  CreditCard,
  FileText,
  HelpCircle,
  LayoutDashboard,
  Link2,
  Mic,
  Plus,
  Settings,
  Sparkles,
  Users,
  WandSparkles,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { realtorRoutes } from "@/lib/navigation/routes";
import { cn } from "@/lib/utils";
import { siteConfig } from "@/lib/config/site";

const navItems = [
  { href: realtorRoutes.dashboard, label: "Dashboard", icon: LayoutDashboard },
  { href: realtorRoutes.v2, label: "PropertyPilot V2", icon: WandSparkles },
  { href: realtorRoutes.properties, label: "Properties", icon: Building2 },
  { href: realtorRoutes.leads, label: "Leads", icon: Users },
  { href: realtorRoutes.appointments, label: "Appointments", icon: Calendar },
  { href: realtorRoutes.analytics, label: "Analytics", icon: BarChart3 },
  { href: realtorRoutes.intelligence, label: "Intelligence", icon: Brain },
  { href: realtorRoutes.documents, label: "Documents", icon: FileText },
  { href: realtorRoutes.knowledgeCenter, label: "Knowledge Center", icon: BookOpen },
  { href: realtorRoutes.voiceNotes, label: "Voice Notes", icon: Mic },
  { href: realtorRoutes.generatedAssets, label: "Property Studio", icon: Sparkles },
  { href: realtorRoutes.billing, label: "Billing", icon: CreditCard },
  { href: realtorRoutes.integrations, label: "Integrations", icon: Link2 },
  { href: realtorRoutes.settings, label: "Settings", icon: Settings },
  { href: realtorRoutes.help, label: "Help", icon: HelpCircle },
] as const;

interface RealtorSidebarProps {
  className?: string;
  onNavigate?: () => void;
}

export function RealtorSidebar({ className, onNavigate }: RealtorSidebarProps) {
  const pathname = usePathname();

  return (
    <aside
      className={cn("flex w-64 shrink-0 flex-col border-r border-border bg-sidebar", className)}
    >
      <div className="flex h-16 items-center gap-2 border-b border-sidebar-border px-4">
        <Link href="/" className="flex items-center gap-2" onClick={onNavigate}>
          <span className="flex size-8 items-center justify-center rounded-lg bg-primary text-sm font-bold text-primary-foreground">
            PP
          </span>
          <span className="font-semibold text-sidebar-foreground">{siteConfig.name}</span>
        </Link>
      </div>

      <div className="p-3">
        <Button className="w-full justify-start gap-2" asChild>
          <Link href={realtorRoutes.newProperty} onClick={onNavigate}>
            <Plus className="size-4" aria-hidden />
            New Property
          </Link>
        </Button>
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto p-3 pt-0" aria-label="Realtor navigation">
        {navItems.map((item) => {
          const isActive =
            pathname === item.href || pathname.startsWith(`${item.href}/`);
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onNavigate}
              className={cn(
                "flex min-h-10 items-center gap-3 rounded-lg px-3 text-sm font-medium transition-colors",
                isActive
                  ? "bg-sidebar-primary text-sidebar-primary-foreground"
                  : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
              )}
            >
              <item.icon className="size-4 shrink-0" aria-hidden />
              {item.label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
