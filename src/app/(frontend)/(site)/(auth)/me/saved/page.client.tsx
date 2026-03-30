"use client";

import { BookmarkButton } from "@/components/UX/Bookmark";
import { Link } from "@/components/core/Link/Link";
import { cn } from "@/lib/utils";
import type { BookmarkItemTyped } from "@/payload/collections/Compilations/actions";
import type { CompilationItemType } from "@/payload/collections/Compilations";
import { AnimatePresence, LayoutGroup } from "motion/react";
import * as m from "motion/react-m";
import Image from "next/image";
import { useCallback, useMemo, useState } from "react";

const TAB_LABELS: Record<CompilationItemType, string> = {
  posts: "Essays",
  surf: "Surf",
  profile: "Profiles",
  albums: "Albums",
  playlists: "Playlists",
  tracks: "Tracks",
  userMedia: "Media"
};

const MUSIC_TABS: CompilationItemType[] = ["albums", "playlists", "tracks"];

type Props = {
  userId: string;
  items: { [K in CompilationItemType]?: BookmarkItemTyped[] };
};

export default function SavedPageClient({ userId, items }: Props) {
  const availableTabs = useMemo(
    () =>
      (Object.keys(TAB_LABELS) as CompilationItemType[]).filter(
        (t) => (items[t]?.length ?? 0) > 0
      ),
    [items]
  );

  const [activeTab, setActiveTab] = useState<CompilationItemType>(
    availableTabs[0] ?? "posts"
  );

  const activeItems = items[activeTab] ?? [];
  const totalCount = Object.values(items).reduce(
    (acc, arr) => acc + (arr?.length ?? 0),
    0
  );

  return (
    <div className="min-h-screen w-full bg-background text-foreground">
      {/* ── Header ────────────────────────────────────────────────── */}
      <header className="sticky top-0 z-20 border-b border-border/30 bg-background/90 backdrop-blur-md">
        <div className="mx-auto max-w-5xl px-6 py-5">
          <div className="flex items-end justify-between">
            <div>
              <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground/60">
                Your Library
              </p>
              <h1 className="mt-0.5 text-2xl font-light tracking-tight">
                Saved
                {totalCount > 0 && (
                  <span className="ml-2.5 font-mono text-sm text-muted-foreground/50">
                    {totalCount}
                  </span>
                )}
              </h1>
            </div>
            <Link
              href="/me/lists"
              className="font-mono text-[11px] uppercase tracking-widest text-muted-foreground/60 transition-colors hover:text-foreground"
            >
              My Lists →
            </Link>
          </div>

          {/* Tabs */}
          {availableTabs.length > 1 && (
            <LayoutGroup id="saved-tabs">
              <nav className="-mb-px mt-5 flex gap-5 overflow-x-auto">
                {availableTabs.map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={cn(
                      "relative shrink-0 pb-3 font-mono text-[11px] uppercase tracking-widest transition-colors",
                      activeTab === tab
                        ? "text-foreground"
                        : "text-muted-foreground/50 hover:text-muted-foreground"
                    )}
                  >
                    {TAB_LABELS[tab]}
                    <span className="ml-1.5 text-[9px] opacity-60">
                      {items[tab]?.length}
                    </span>
                    {activeTab === tab && (
                      <m.span
                        layoutId="tab-indicator"
                        className="absolute inset-x-0 bottom-0 h-px bg-foreground"
                        transition={{ type: "spring", bounce: 0.2, duration: 0.4 }}
                      />
                    )}
                  </button>
                ))}
              </nav>
            </LayoutGroup>
          )}
        </div>
      </header>

      {/* ── Content ───────────────────────────────────────────────── */}
      <main className="mx-auto max-w-5xl px-6 py-8">
        <AnimatePresence mode="wait">
          {activeItems.length === 0 ? (
            <SavedEmptyState key="empty" tab={activeTab} />
          ) : (
            <m.div
              key={activeTab}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.22 }}
              className={cn(
                "grid gap-4",
                MUSIC_TABS.includes(activeTab)
                  ? "grid-cols-2 sm:grid-cols-3 md:grid-cols-4"
                  : "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3"
              )}
            >
              {activeItems.map((item) => (
                <BookmarkCard key={item.id} item={item} userId={userId} />
              ))}
            </m.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}

// ── Bookmark Card ──────────────────────────────────────────────────────────

function BookmarkCard({
  item,
  userId
}: {
  item: BookmarkItemTyped;
  userId: string;
}) {
  const isSquare = MUSIC_TABS.includes(item.collectionSlug);

  return (
    <m.div
      layout
      initial={{ opacity: 0, scale: 0.97 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ type: "spring", bounce: 0.15, duration: 0.35 }}
      className="group relative overflow-hidden rounded-sm border border-border/20 bg-card transition-colors hover:border-border/50"
    >
      {/* Image */}
      {item.image?.url && (
        <div
          className={cn(
            "relative w-full overflow-hidden",
            isSquare ? "aspect-square" : "aspect-[16/9]"
          )}
        >
          <Image
            src={item.image.url}
            alt={item.image.alt || item.title}
            fill
            className="object-cover transition-transform duration-500 group-hover:scale-105"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-background/60 via-transparent to-transparent" />
        </div>
      )}

      {/* Body */}
      <div className="p-3.5">
        <Link href={item.url} className="block">
          <h3 className="line-clamp-2 text-sm font-medium leading-snug tracking-tight transition-opacity group-hover:opacity-80">
            {item.title}
          </h3>
        </Link>

        <div className="mt-2 flex items-center justify-between">
          <div className="flex items-center gap-2">
            {"author" in item && item.author && (
              <span className="font-mono text-[10px] text-muted-foreground/60">
                {item.author}
              </span>
            )}
            {"source" in item && item.source && (
              <span className="font-mono text-[10px] text-muted-foreground/60">
                {item.source}
              </span>
            )}
            {"artist" in item && item.artist && (
              <span className="font-mono text-[10px] text-muted-foreground/60">
                {item.artist}
              </span>
            )}
          </div>

          {/* Bookmark toggle — removes from saved on click */}
          <div className="opacity-0 transition-opacity group-hover:opacity-100">
            <BookmarkButton
              collectionSlug={item.collectionSlug}
              itemId={item.id}
              userId={userId}
              className="flex h-7 w-7 items-center justify-center rounded-sm text-muted-foreground/50 transition-colors hover:text-foreground [&_svg]:size-[14px]"
            />
          </div>
        </div>
      </div>
    </m.div>
  );
}

// ── Empty State ────────────────────────────────────────────────────────────

function SavedEmptyState({ tab }: { tab: CompilationItemType }) {
  const messages: Record<CompilationItemType, { headline: string; sub: string }> = {
    posts: {
      headline: "No saved essays yet.",
      sub: "Bookmark essays while reading to collect them here."
    },
    surf: {
      headline: "Nothing surfed and saved.",
      sub: "Bookmark surf pieces to revisit them."
    },
    profile: {
      headline: "No profiles saved.",
      sub: "Bookmark profiles to keep track of members you like."
    },
    albums: {
      headline: "No albums saved.",
      sub: "Save albums from the radio to see them here."
    },
    playlists: {
      headline: "No playlists saved.",
      sub: "Bookmark playlists to build your personal listening stack."
    },
    tracks: {
      headline: "No tracks saved.",
      sub: "Save tracks to revisit them later."
    },
    userMedia: {
      headline: "No media saved.",
      sub: "Bookmark media to collect it here."
    }
  };

  const msg = messages[tab];

  return (
    <m.div
      key="empty"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="flex flex-col items-center justify-center py-24 text-center"
    >
      <span className="mb-4 font-mono text-5xl opacity-10">◫</span>
      <p className="text-base font-light text-foreground/70">{msg.headline}</p>
      <p className="mt-1.5 max-w-xs font-mono text-[11px] text-muted-foreground/50">
        {msg.sub}
      </p>
    </m.div>
  );
}
