import { Loader2 } from "lucide-react";

interface LoadingStateProps {
  label?: string;
}

/**
 * Reusable loading state for panels that cannot be represented by skeletons.
 */
export function LoadingState({ label = "Loading" }: LoadingStateProps) {
  return (
    <div className="flex min-h-32 items-center justify-center gap-2 rounded-lg border border-border bg-card px-6 py-8 text-sm text-muted-foreground">
      <Loader2 className="size-4 animate-spin" aria-hidden />
      <span>{label}</span>
    </div>
  );
}
