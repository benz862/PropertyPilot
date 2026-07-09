"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Search, X } from "lucide-react";

import { Input } from "@/components/ui/input";
import { APP_LIMITS } from "@/lib/constants";
import type { SearchResultGroup } from "@/lib/realtor-workspace/types";
import { cn } from "@/lib/utils";

export function WorkspaceSearch({ className }: { className?: string }) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResultGroup[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const search = useCallback(async (value: string) => {
    if (value.trim().length < 2) {
      setResults([]);
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch(`/api/workspace/search?q=${encodeURIComponent(value)}`);
      const json = (await response.json()) as { data: SearchResultGroup[] };
      setResults(json.data ?? []);
    } catch {
      setResults([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      void search(query);
    }, APP_LIMITS.workspaceSearchDebounceMs);
    return () => clearTimeout(timer);
  }, [query, search]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const hasResults = results.some((group) => group.results.length > 0);

  return (
    <div ref={containerRef} className={cn("relative w-full max-w-md", className)}>
      <div className="relative">
        <Search
          className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
          aria-hidden
        />
        <Input
          type="search"
          placeholder="Search properties, knowledge, leads..."
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
          className="pl-9 pr-9"
          aria-label="Workspace search"
          aria-expanded={isOpen && hasResults}
        />
        {query && (
          <button
            type="button"
            onClick={() => {
              setQuery("");
              setResults([]);
            }}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            aria-label="Clear search"
          >
            <X className="size-4" />
          </button>
        )}
      </div>

      {isOpen && query.length >= 2 && (
        <div className="absolute left-0 right-0 top-full z-50 mt-1 max-h-96 overflow-y-auto rounded-lg border border-border bg-popover shadow-lg">
          {isLoading && (
            <p className="p-4 text-sm text-muted-foreground">Searching...</p>
          )}
          {!isLoading && !hasResults && (
            <p className="p-4 text-sm text-muted-foreground">No results found.</p>
          )}
          {!isLoading &&
            results.map((group) =>
              group.results.length > 0 ? (
                <div key={group.type} className="border-b border-border last:border-0">
                  <p className="px-3 py-2 text-xs font-semibold uppercase tracking-normal text-muted-foreground">
                    {group.label}
                  </p>
                  <ul>
                    {group.results.map((item) => (
                      <li key={item.id}>
                        <Link
                          href={item.href}
                          onClick={() => {
                            setIsOpen(false);
                            setQuery("");
                          }}
                          className="block px-3 py-2 hover:bg-accent"
                        >
                          <p className="text-sm font-medium text-foreground">{item.title}</p>
                          <p className="text-xs text-muted-foreground">{item.subtitle}</p>
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null,
            )}
        </div>
      )}
    </div>
  );
}
