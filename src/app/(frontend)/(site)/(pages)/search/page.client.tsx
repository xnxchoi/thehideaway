"use client";

import {
  COLLECTION_LABELS,
  getCollectionLabel,
  getResultLabel,
  type SearchAPIResponse,
  type SearchAPIResult
} from "@/components/UX/CommandKey/Commando";
import { useHeaderTheme } from "@/providers/HeaderTheme";
import { RPage } from "@/components/UX/Transition";
import { useDebounce } from "@/utilities/useDebounce";
import { useQuery } from "@tanstack/react-query";
import * as m from "motion/react-m";
import {
  ChangeEvent,
  Suspense,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState
} from "react";
import { Link } from "@/components/core/Link/Link";
import { AnimatePresence } from "motion/react";
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
  "pages"
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
    <m.div aria-hidden="true" role="presentation">
      {/* Group label skeleton */}
      <div className="mt-8 mb-4 h-3 w-16 animate-pulse rounded-full bg-current opacity-[0.06]" />
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
      <div className="mt-10 mb-4 h-3 w-20 animate-pulse rounded-full bg-current opacity-[0.06]" />
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
    </m.div>
  );
}

// ─── Result item ──────────────────────────────────────────────────────────────

function ResultItem({
  result,
  index
}: {
  result: SearchAPIResult;
  index: number;
}) {
  const label = getResultLabel(result);

  return (
    <m.li
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: "spring", bounce: 0.1, delay: index * 0.04 }}
    >
      <Link
        href={result.url}
        prefetch
        className="group flex min-h-[3rem] items-center gap-4 border-b border-current/[0.06] py-3.5 transition-colors duration-150 hover:border-current/20 sm:py-4"
      >
        <span className="flex-1 truncate text-sm leading-snug font-medium text-muted-foreground transition-colors group-hover:text-foreground sm:text-base">
          {label}
        </span>
        {result.subtitle && (
          <span className="hidden max-w-xs truncate font-sans text-[10px] text-muted-foreground/50 md:block xl:text-[11px]">
            {result.subtitle}
          </span>
        )}
        <span className="rp_tag ml-auto shrink-0 opacity-40 transition-opacity group-hover:opacity-70">
          {getCollectionLabel(result.collection_type)}
        </span>
      </Link>
    </m.li>
  );
}

// ─── Result group ─────────────────────────────────────────────────────────────

function ResultGroup({
  type,
  items
}: {
  type: string;
  items: SearchAPIResult[];
}) {
  const label = COLLECTION_LABELS[type]
    ? `${COLLECTION_LABELS[type]}${items.length !== 1 ? "s" : ""}`
    : type;

  return (
    <m.section
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.2 }}
      aria-label={label}
    >
      <h3 className="mt-10 mb-1 font-sans text-[10px] tracking-[0.2em] text-muted-foreground/40 uppercase first:mt-0 xl:text-xs">
        {label}
      </h3>
      <ul>
        <AnimatePresence mode="popLayout">
          {items.map((result, index) => (
            <ResultItem key={result.id} result={result} index={index} />
          ))}
        </AnimatePresence>
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
  // const syncURL = useCallback((q: string) => {
  //   if (typeof window === "undefined") return;
  //   const url = new URL(window.location.href);
  //   if (q) {
  //     url.searchParams.set("q", q);
  //   } else {
  //     url.searchParams.delete("q");
  //   }
  //   window.history.replaceState({}, "", url.toString());
  // }, []);

  const handleChange = useCallback((e: ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setQuery(val);
    // syncURL(val);
  }, []);

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
    placeholderData: (prev) => prev
  });

  const results = data?.results ?? [];
  const total = data?.total ?? 0;
  const isLoading = isDebouncing || (debouncedQuery.length > 0 && isFetching);
  const hasResults = !isLoading && results.length > 0;
  const isEmpty =
    !isLoading && debouncedQuery.length > 0 && results.length === 0;

  const grouped = useMemo(() => groupByCollection(results), [results]);
  const groupEntries = useMemo(() => sortedGroupEntries(grouped), [grouped]);

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <RPage type="search" slug={["search"]}>
      <m.div className="min-h-screen py-20 sm:py-28 xl:py-32">
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
                "w-full border-b bg-transparent pt-0 pb-4 text-3xl leading-none font-medium outline-none",
                "text-foreground placeholder:text-faded-foreground/30",
                "transition-colors duration-200",
                // Prevent iOS Safari zoom on focus (font-size must be ≥ 16px)
                "text-[clamp(1.25rem,5vw,1.875rem)]",
                "border-current/10 focus:border-current/30",
                // Mobile: slightly smaller, full touch target
                "sm:pb-5 sm:text-3xl"
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
          <div className="mt-4 h-5 font-sans text-[10px] tracking-widest text-muted-foreground/40 uppercase xl:text-[11px]">
            {hasResults && (
              <m.span
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.2 }}
              >
                {total} result{total !== 1 ? "s" : ""} for &ldquo;
                {debouncedQuery}&rdquo;
              </m.span>
            )}
          </div>

          {/* ── Content area ── */}
          <div className="mt-2">
            <AnimatePresence mode="popLayout" initial={true}>
              {!query && (
                <m.div className="flex flex-col items-start gap-1.5 py-16">
                  <p className="text-base font-light text-foreground/50">
                    Start typing to search…
                  </p>
                  <p className="font-sans text-[10px] text-muted-foreground/40 xl:text-[11px]">
                    Essays · Surf · People · Albums · Tracks · Playlists
                  </p>
                </m.div>
              )}
              {query && (
                <Suspense fallback={<ResultSkeleton />}>
                  {hasResults &&
                    groupEntries.map(([type, items]) => (
                      <ResultGroup key={type} type={type} items={items} />
                    ))}

                  {isEmpty && (
                    <m.div
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{
                        type: "spring",
                        bounce: 0.15,
                        duration: 0.4
                      }}
                      className="flex flex-col items-center justify-center py-24 text-center"
                    >
                      <span className="mb-4 font-sans text-5xl opacity-10">
                        ○
                      </span>
                      <p className="text-base font-light text-foreground/70">
                        No results for &ldquo;{debouncedQuery}&rdquo;
                      </p>
                      <p className="mt-1.5 max-w-xs font-sans text-[11px] text-muted-foreground/50">
                        Try a different spelling or a broader term.
                      </p>
                    </m.div>
                  )}
                </Suspense>
              )}
            </AnimatePresence>
          </div>
        </div>
      </m.div>
    </RPage>
  );
};

export default PageClient;
