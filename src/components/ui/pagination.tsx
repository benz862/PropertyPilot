import { ChevronLeft, ChevronRight } from "lucide-react";

import { Button } from "@/components/ui/button";

export interface PaginationProps {
  page: number;
  pageCount: number;
  onPrevious?: () => void;
  onNext?: () => void;
}

export function Pagination({ page, pageCount, onPrevious, onNext }: PaginationProps) {
  return (
    <nav className="flex items-center justify-between gap-3" aria-label="Pagination">
      <Button variant="outline" size="sm" onClick={onPrevious} disabled={page <= 1}>
        <ChevronLeft className="size-4" aria-hidden />
        Previous
      </Button>
      <span className="text-sm text-muted-foreground">
        Page {page} of {Math.max(pageCount, 1)}
      </span>
      <Button variant="outline" size="sm" onClick={onNext} disabled={page >= pageCount}>
        Next
        <ChevronRight className="size-4" aria-hidden />
      </Button>
    </nav>
  );
}
