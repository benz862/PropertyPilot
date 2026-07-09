import type { ReactNode } from "react";

import { RealtorSidebar } from "@/components/layout/realtor-sidebar";
import { NotificationsPanel } from "@/components/realtor/notifications-panel";
import { WorkspaceSearch } from "@/components/realtor/workspace-search";
import type { WorkspaceNotification } from "@/lib/realtor-workspace/types";

interface RealtorLayoutShellProps {
  children: ReactNode;
  title?: string;
  description?: string;
  actions?: ReactNode;
  notifications?: WorkspaceNotification[];
}

export function RealtorLayoutShell({
  children,
  title,
  description,
  actions,
  notifications = [],
}: RealtorLayoutShellProps) {
  return (
    <div className="flex min-h-screen bg-background">
      <RealtorSidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <div className="border-b border-border bg-card px-4 py-3 sm:px-6">
          <WorkspaceSearch />
        </div>
        {(title || actions) && (
          <header className="border-b border-border bg-card px-6 py-5">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                {title && (
                  <h1 className="text-2xl font-bold tracking-normal text-foreground">
                    {title}
                  </h1>
                )}
                {description && (
                  <p className="mt-1 text-sm text-muted-foreground">{description}</p>
                )}
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <NotificationsPanel notifications={notifications} />
                {actions}
              </div>
            </div>
          </header>
        )}
        <main className="flex-1 p-6">{children}</main>
      </div>
    </div>
  );
}
