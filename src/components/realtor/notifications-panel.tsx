"use client";

import Link from "next/link";
import { Bell } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { realtorRoutes } from "@/lib/navigation/routes";
import type { WorkspaceNotification } from "@/lib/realtor-workspace/types";

interface NotificationsPanelProps {
  notifications: WorkspaceNotification[];
}

export function NotificationsPanel({ notifications }: NotificationsPanelProps) {
  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="icon" className="relative" aria-label="Notifications">
          <Bell className="size-4" aria-hidden />
          {unreadCount > 0 && (
            <span className="absolute -right-1 -top-1 flex size-4 items-center justify-center rounded-full bg-accent text-[10px] font-bold text-accent-foreground">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80">
        <DropdownMenuLabel className="flex items-center justify-between">
          Notifications
          {unreadCount > 0 && (
            <Badge variant="secondary" className="text-xs">
              {unreadCount} new
            </Badge>
          )}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        {notifications.length === 0 ? (
          <p className="px-2 py-4 text-center text-sm text-muted-foreground">
            No notifications yet.
          </p>
        ) : (
          notifications.slice(0, 8).map((notification) => (
            <DropdownMenuItem key={notification.id} asChild>
              <Link
                href={
                  notification.propertyId
                    ? realtorRoutes.propertySection(notification.propertyId, "overview")
                    : realtorRoutes.dashboard
                }
                className="flex flex-col items-start gap-0.5"
              >
                <span className="font-medium">{notification.title}</span>
                <span className="line-clamp-2 text-xs text-muted-foreground">
                  {notification.message}
                </span>
              </Link>
            </DropdownMenuItem>
          ))
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
