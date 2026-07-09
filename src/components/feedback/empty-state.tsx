import type { ComponentType, ReactNode } from "react";

import { Button } from "@/components/ui/button";

interface EmptyStateProps {
  icon?: ComponentType<{ className?: string; "aria-hidden"?: boolean }>;
  title: string;
  description?: string;
  action?: {
    label: string;
    onClick?: () => void;
    href?: string;
  };
  children?: ReactNode;
}

/**
 * Reusable empty state for lists, dashboards, and setup flows.
 */
export function EmptyState({ icon: Icon, title, description, action, children }: EmptyStateProps) {
  const actionButton = action ? (
    <Button asChild={Boolean(action.href)} onClick={action.onClick}>
      {action.href ? <a href={action.href}>{action.label}</a> : action.label}
    </Button>
  ) : null;

  return (
    <div className="flex min-h-48 flex-col items-center justify-center rounded-lg border border-dashed border-border bg-card px-6 py-10 text-center">
      {Icon && (
        <div className="mb-4 rounded-lg bg-secondary p-3 text-muted-foreground">
          <Icon className="size-5" aria-hidden />
        </div>
      )}
      <h3 className="text-base font-semibold tracking-normal text-foreground">{title}</h3>
      {description && (
        <p className="mt-2 max-w-md text-sm leading-6 text-muted-foreground">{description}</p>
      )}
      {(actionButton || children) && (
        <div className="mt-5 flex flex-wrap items-center justify-center gap-2">
          {actionButton}
          {children}
        </div>
      )}
    </div>
  );
}
