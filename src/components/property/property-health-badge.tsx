import type { PropertyHealthBreakdown as HealthBreakdown } from "@/lib/property-health/score";
import { getHealthStatusColor } from "@/lib/property-health/score";
import type { HealthStatus } from "@/lib/property-health/score";
import { cn } from "@/lib/utils";

interface PropertyHealthBadgeProps {
  score: number;
  status: HealthStatus;
  label: string;
  className?: string;
}

export function PropertyHealthBadge({
  score,
  status,
  label,
  className,
}: PropertyHealthBadgeProps) {
  return (
    <div
      className={cn(
        "inline-flex items-center gap-2 rounded-full border px-3 py-1 text-sm font-medium",
        getHealthStatusColor(status),
        className,
      )}
    >
      <span className="font-bold">{score}</span>
      <span className="text-xs opacity-80">/ 100</span>
      <span aria-hidden>·</span>
      <span>{label}</span>
    </div>
  );
}

interface PropertyHealthBreakdownProps {
  breakdown: HealthBreakdown;
  labels: Record<keyof HealthBreakdown, string>;
  weights: Record<keyof HealthBreakdown, number>;
}

export function PropertyHealthBreakdown({
  breakdown,
  labels,
  weights,
}: PropertyHealthBreakdownProps) {
  return (
    <div className="space-y-3">
      {(Object.keys(breakdown) as Array<keyof HealthBreakdown>).map((key) => (
        <div key={key} className="space-y-1">
          <div className="flex items-center justify-between text-sm">
            <span className="text-foreground">{labels[key]}</span>
            <span className="text-muted-foreground">
              {weights[key]} pts · {breakdown[key]}%
            </span>
          </div>
          <div className="h-1.5 overflow-hidden rounded-full bg-secondary">
            <div
              className="h-full rounded-full bg-primary transition-all"
              style={{ width: `${breakdown[key]}%` }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}
