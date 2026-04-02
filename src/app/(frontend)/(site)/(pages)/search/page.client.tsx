"use client";

import {
  COLLECTION_LABELS,
  getCollectionLabel,
  getResultLabel,
  type SearchAPIResponse,
  type SearchAPIResult,
} from "@/components/UX/CommandKey/Commando";
import { useHeaderTheme } from "@/providers/HeaderTheme";
import { RPage } from "@/components/UX/Transition";
import { useDebounce } from "@/utilities/useDebounce";
import { useQuery } from "@tanstack/react-query";
import * as m from "motion/react-m";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

// ─── Types ────────────────────────────────────────────────────────────────────

type GroupedResults = Record<string, SearchAPIResult[]>;

// ─── Helpers ──────────────────────────────────────────────────────────────────

function groupByCollection(results: SearchAPIResult[]): GroupedResults {
  return results.reduce<GroupedResults>((acc, item) => {
    const key = item.collection_type;
    if (!acc[key]) acc[key] = [];
    acc[key].push(item);
    return acc;
  }, {});
}

// Preferred display order for collection groups
const COLLECTION_ORDER = [
  "posts",
  "surf",
  "profile",
  "albums",
  "tracks",
  "playlists",
  "pages",
];

function sortedGroupEntries(
  grouped: GroupedResults
): [string, SearchAPIResult[]][] {
  return Object.entries(grouped).sort(([a], [b]) => {
    const ai = COLLECTION_ORDER.indexOf(a);
    const bi = COLLECTION_ORDER.indexOf(b);
    return (ai === -1 ? 999 : ai) - (bi === -1 ? 999 : bi);
  });
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function ResultSkeleton() {
  return (
    <div aria-hidden="true" role="presentation">
      {/* Group label skeleton */}
      <div className="mb-4 mt-8 h-3 w-16 animate-pulse rounded-full bg-current opacity-[0.06]" />
      {/* Item rows */}
      {[72, 58, 80].map((w, i) => (
        <div
          key={i}
          className="flex items-center border-b border-current/5 py-4"
        >
          <div
            className="h-3.5 animate-pulse rounded-full bg-current opacity-[0.07]"
            style={{ width: `${w}%` }}
          />
          <div className="ml-auto h-3 w-12 animate-pulse rounded-full bg-current opacity-[0.05]" />
        </div>
      ))}
      {/* Second group */}
      <div className="mb-4 mt-10 h-3 w-20 animate-pulse rounded-full bg-current opacity-[0.06]" />
      {[65, 78].map((w, i) => (
        <div
          key={i}
          className="flex items-center border-b border-current/5 py-4"
        >
          <div
            className="h-3.5 animate-pulse rounded-full bg-current opacity-[0.07]"
            style={{ width: `${w}%` }}
          />
          <div className="ml-auto h-3 w-12 animate-pulse rounded-full bg-current opacity-[0.05]" />
        </div>
      ))}
    </div>
  );
}

// ─── Result item ──────────────────────────────────────────────────────────────

function ResultItem({ result }: { result: SearchAPIResult }) {
  const label = getResultLabel(result);

  return (
    <m.li
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
    >
      <a
        href={result.url}
        className="group flex min-h-[3rem] items-center gap-4 border-b border-current/[0.06] py-3.5 transition-colors duration-150 hover:border-current/20 sm:py-4"
      >
        <span className="flex-1 truncate text-base font-medium leading-snug text-faded-foreground transition-colors group-hover:text-foreground sm:text-lg">
          {label}
        </span>
        {result.subtitle && (
          <span className="hidden max-w-xs truncate text-sm text-faded-foreground/50 md:block">
            {result.subtitle}
          </span>
        )}
        <span className="rp_tag ml-auto shrink-0 text-xs opacity-40 transition-opacity group-hover:opacity-70">
          {getCollectionLabel(result.collection_type)}
        </span>
      </a>
    </m.li>
  );
}

// ─── Result group ─────────────────────────────────────────────────────────────

function ResultGroup({
  type,
  items,
}: {
  type: string;
  items: SearchAPIResult[];
}) {
  const label =
    COLLECTION_LABELS[type]
      ? `${COLLECTION_LABELS[type]}${items.length !== 1 ? "s" : ""}`
      : type;

  return (
    <m.section
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.2 }}
      aria-label={label}
    >
      <h3 className="mb-1 mt-10 text-[10px] uppercase tracking-[0.15em] text-faded-foreground/40 first:mt-0">
        {label}
      </h3>
      <ul>
        {items.map((result) => (
          <ResultItem key={result.id} result={result} />
        ))}
      </ul>
    </m.section>
  );
}

// ─── Page client ─────────────────────────────────────────────────────────────

const PageClient = ({ initialQuery = "" }: { initialQuery?: string }) => {
  const { setHeaderTheme } = useHeaderTheme();
  const [query, setQuery] = useState(initialQuery);
  const debouncedQuery = useDebounce(query, 300);
  const inputRef = useRef<HTMLInputElement>(null);
  const isDebouncing = query !== debouncedQuery;

  useEffect(() => {
    setHeaderTheme("dark");
  }, [setHeaderTheme]);

  // Sync URL without triggering Next.js server round-trips
  const syncURL = useCallback((q: string) => {
    if (typeof window === "undefined") return;
    const url = new URL(window.location.href);
    if (q) {
      url.searchParams.set("q", q);
    } else {
      url.searchParams.delete("q");
    }
    window.history.replaceState({}, "", url.toString());
  }, []);

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const val = e.target.value;
      setQuery(val);
      syncURL(val);
    },
    [syncURL]
  );

  // Focus input on mount
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  // ── Fetch ──────────────────────────────────────────────────────────────────
  const { data, isFetching } = useQuery<SearchAPIResponse>({
    queryKey: ["search-page", debouncedQuery],
    queryFn: async () => {
      if (!debouncedQuery) {
        return { results: [], query: "", collections: [], total: 0 };
      }
      const res = await fetch(
        `/api/search/?q=${encodeURIComponent(debouncedQuery)}&limit=30`
      );
      if (!res.ok) throw new Error("Search failed");
      return res.json() as Promise<SearchAPIResponse>;
    },
    enabled: debouncedQuery.length > 0,
    refetchOnWindowFocus: false,
    staleTime: 30_000,
    placeholderData: (prev) => prev,
  });

  const results = data?.results ?? [];
  const total = data?.total ?? 0;
  const isLoading = isDebouncing || (debouncedQuery.length > 0 && isFetching);
  const hasResults = !isLoading && results.length > 0;
  const isEmpty = !isLoading && debouncedQuery.length > 0 && results.length === 0;

  const grouped = useMemo(
    () => groupByCollection(results),
    [results]
  );
  const groupEntries = useMemo(
    () => sortedGroupEntries(grouped),
    [grouped]
  );

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <RPage type="search" slug={["search"]}>
      <m.div className="min-h-screen py-20 sm:py-28">
        <div className="container max-w-3xl">
          {/* ── Search input ── */}
          <div className="relative">
            <label htmlFor="search-input" className="sr-only">
              Search
            </label>
            <input
              id="search-input"
              ref={inputRef}
              type="search"
              value={query}
              onChange={handleChange}
              placeholder="Search for anything…"
              autoComplete="off"
              autoCorrect="off"
              spellCheck={false}
              className={[
                "w-full border-b bg-transparent pb-4 pt-0 text-3xl font-medium leading-none outline-none",
                "text-foreground placeholder:text-faded-foreground/30",
                "transition-colors duration-200",
                // Prevent iOS Safari zoom on focus (font-size must be ≥ 16px)
                "text-[clamp(1.25rem,5vw,1.875rem)]",
                "border-current/10 focus:border-current/30",
                // Mobile: slightly smaller, full touch target
                "sm:text-3xl sm:pb-5",
              ].join(" ")}
              aria-label="Search query"
            />
            {/* Loading pulse line */}
            {isLoading && (
              <div
                className="absolute bottom-0 left-0 h-px w-full overflow-hidden"
                aria-hidden="true"
              >
                <div className="animate-loading-bar h-full w-1/2 bg-current opacity-30" />
              </div>
            )}
          </div>

          {/* ── Result count ── */}
          <div className="mt-4 h-5 text-xs uppercase tracking-widest text-faded-foreground/40">
            {hasResults && (
              <m.span
                key={debouncedQuery}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.2 }}
              >
                {total} result{total !== 1 ? "s" : ""} for &ldquo;{debouncedQuery}&rdquo;
              </m.span>
            )}
          </div>

          {/* ── Content area ── */}
          <div className="mt-2">
            {!query && (
              <div className="flex flex-col items-start gap-2 py-16 text-faded-foreground/40">
                <p className="text-base">Start typing to search…</p>
                <p className="text-sm opacity-60">
                  Essays, surf, people, music, categories
                </p>
              </div>
            )}

            {isLoading && query && <ResultSkeleton />}

            {hasResults &&
              groupEntries.map(([type, items]) => (
                <ResultGroup key={type} type={type} items={items} />
              ))}

            {isEmpty && (
              <m.div
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                className="py-16 text-faded-foreground/50"
              >
                <p className="text-base">
                  No results for &ldquo;{debouncedQuery}&rdquo;
                </p>
                <p className="mt-2 text-sm opacity-60">
                  Try a different spelling or broader term.
                </p>
              </m.div>
            )}
          </div>
        </div>
      </m.div>
    </RPage>
  );
};

export default PageClient;
