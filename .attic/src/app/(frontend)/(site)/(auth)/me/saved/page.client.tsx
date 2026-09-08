"use client";

import { BookmarkButton } from "@/components/UX/Bookmark";
import { Link } from "@/components/core/Link/Link";
import { RPage } from "@/components/UX/Transition";
import { cn } from "@/lib/utils";
import type { BookmarkItemTyped } from "@/payload/collections/Compilations/actions";
import type { CompilationItemType } from "@/payload/collections/Compilations";
import { useRPStore } from "@/providers/RP_Pro";
import { AnimatePresence, LayoutGroup, useScroll } from "motion/react";
import * as m from "motion/react-m";
import Image from "next/image";
import { useMemo, useState } from "react";
import { RP_Btn } from "@/components/core/Button";
import { useShallow } from "zustand/shallow";

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
    <RPage type="me" slug={["saved"]}>
      {/* ── Header ────────────────────────────────────────────────── */}
      <header className="sticky top-[5.5rem] z-20 border-b border-border/30 bg-background/90 backdrop-blur-md lg:top-[8rem]">
        <div className="mx-auto max-w-screen px-6 py-5 xl:px-10">
          <div className="flex items-end justify-between">
            <div>
              <p className="font-sans text-small tracking-[0.2em] text-muted-foreground/60 uppercase xl:text-xs">
                Your Library
              </p>
              <h1 className="mt-0.5 text-2xl font-light tracking-tight xl:text-3xl">
                Saved
                {totalCount > 0 && (
                  <span className="ml-2.5 font-sans text-sm text-muted-foreground/50">
                    {totalCount}
                  </span>
                )}
              </h1>
            </div>
            <Link
              href="/me/lists"
              className="font-sans text-[11px] tracking-widest text-muted-foreground/60 uppercase transition-colors hover:text-foreground xl:text-xs"
            >
              My Lists →
            </Link>
          </div>

          {/* Tabs */}
          {availableTabs.length > 1 && (
            <LayoutGroup id="saved-tabs">
              <nav className="mt-5 -mb-px flex gap-6 overflow-x-auto xl:gap-8">
                {availableTabs.map((tab) => (
                  <RP_Btn
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={cn(
                      "relative shrink-0 pb-3 font-sans text-[11px] tracking-widest uppercase transition-colors xl:text-xs",
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
                        transition={{
                          type: "spring",
                          bounce: 0.2,
                          duration: 0.4
                        }}
                      />
                    )}
                  </RP_Btn>
                ))}
              </nav>
            </LayoutGroup>
          )}
        </div>
      </header>

      {/* ── Content ───────────────────────────────────────────────── */}
      <section className="flex h-full w-full flex-col items-center">
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
                "grid gap-4 xl:gap-5",
                MUSIC_TABS.includes(activeTab)
                  ? "grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6"
                  : "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
              )}
            >
              {activeItems.map((item) => (
                <BookmarkCard key={item.id} item={item} userId={userId} />
              ))}
            </m.div>
          )}
        </AnimatePresence>
      </section>
    </RPage>
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
  const isSquare = MUSIC_TABS.some((akl) => akl === item.collection);

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
            isSquare ? "aspect-square" : "aspect-video"
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
      <div className="p-3.5 xl:p-4">
        <Link href={item.url} className="block">
          <h3 className="line-clamp-2 text-sm leading-snug font-medium tracking-tight transition-opacity group-hover:opacity-80 xl:text-base">
            {item.title}
          </h3>
        </Link>

        <div className="mt-2 flex items-center justify-between">
          <div className="flex items-center gap-2">
            {"author" in item && item.author && (
              <span className="font-sans text-small text-muted-foreground/60 xl:text-[11px]">
                {typeof item.author === "object" && item.author.name}
              </span>
            )}
            {"source" in item && item.source && (
              <span className="font-sans text-small text-muted-foreground/60 xl:text-[11px]">
                {item.source}
              </span>
            )}
            {"artist" in item && item.artist && (
              <span className="font-sans text-small text-muted-foreground/60 xl:text-[11px]">
                {item.artist}
              </span>
            )}
          </div>

          {/* Bookmark toggle — removes from saved on click */}
          <div className="opacity-0 transition-opacity group-hover:opacity-100">
            <BookmarkButton
              collectionSlug={item.collection}
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
  const messages: Record<
    CompilationItemType,
    { headline: string; sub: string }
  > = {
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
      <span className="mb-4 font-sans text-5xl opacity-10">◫</span>
      <p className="text-base font-light text-foreground/70">{msg.headline}</p>
      <p className="mt-1.5 max-w-xs font-sans text-[11px] text-muted-foreground/50">
        {msg.sub}
      </p>
    </m.div>
  );
}
