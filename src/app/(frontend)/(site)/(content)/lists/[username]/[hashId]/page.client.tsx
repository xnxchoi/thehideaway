"use client";

import { BookmarkButton } from "@/components/UX/Bookmark";
import { Link } from "@/components/core/Link/Link";
import { cn } from "@/lib/utils";
import type { CompilationItemType } from "@/payload/collections/Compilations";
import type { Compilation, Media, User } from "@/payload-types";
import * as m from "motion/react-m";
import Image from "next/image";
import { useMemo, useState } from "react";

const TYPE_LABEL: Record<CompilationItemType, string> = {
  posts: "Essay",
  surf: "Surf",
  profile: "Profile",
  albums: "Album",
  playlists: "Playlist",
  tracks: "Track",
  userMedia: "Media"
};

type CompilationFull = Compilation & {
  itemCount: number;
  items: Array<{
    relationTo: CompilationItemType;
    value: string | Record<string, any>;
  }>;
};

type Props = {
  compilation: CompilationFull;
  isOwner: boolean;
  viewerId: string | null;
};

export default function PublicCompilationClient({ compilation, isOwner, viewerId }: Props) {
  const author = compilation.author as User | string;
  const authorName = typeof author === "string" ? "Unknown" : (author.name ?? author.username ?? "—");
  const authorSlug = typeof author === "string" ? null : (author as any).slug ?? null;
  const cover = compilation.coverImage as Media | null | undefined;
  const items = (compilation.items ?? []) as CompilationFull["items"];

  const [filter, setFilter] = useState<CompilationItemType | "all">("all");

  const availableTypes = useMemo(() => {
    const types = new Set<CompilationItemType>();
    items.forEach((i) => types.add(i.relationTo));
    return Array.from(types);
  }, [items]);

  const filteredItems = useMemo(
    () => (filter === "all" ? items : items.filter((i) => i.relationTo === filter)),
    [items, filter]
  );

  return (
    <article className="min-h-screen w-full bg-background text-foreground">
      {/* ── Hero ──────────────────────────────────────────── */}
      <section className="relative h-[55vh] min-h-[340px] w-full overflow-hidden">
        {/* Background */}
        {cover?.url ? (
          <>
            <Image
              src={cover.url}
              alt={compilation.title}
              fill
              priority
              className="object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-black/40 to-background" />
          </>
        ) : (
          <>
            <div className="absolute inset-0 bg-gradient-to-br from-muted/60 to-background" />
            <span className="absolute inset-0 flex items-center justify-center select-none font-mono text-[20vw] font-light text-foreground/[0.04]">
              {compilation.title.charAt(0).toUpperCase()}
            </span>
          </>
        )}

        {/* Content */}
        <div className="absolute inset-x-0 bottom-0 px-6 pb-8 sm:px-10 sm:pb-10 xl:pb-14">
          <div className="mx-auto max-w-7xl">
            <m.p
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="mb-2 font-mono text-[10px] uppercase tracking-[0.25em] text-white/50 xl:text-xs"
            >
              A List by{" "}
              {authorSlug ? (
                <Link
                  href={`/users/${authorSlug}`}
                  className="text-white/70 hover:text-white"
                >
                  {authorName}
                </Link>
              ) : (
                <span className="text-white/70">{authorName}</span>
              )}
            </m.p>
            <m.h1
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15, type: "spring", bounce: 0.1 }}
              className="text-3xl font-light leading-tight tracking-tight text-white sm:text-4xl md:text-5xl xl:text-6xl 2xl:text-7xl"
            >
              {compilation.title}
            </m.h1>
            {compilation.description && (
              <m.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.25 }}
                className="mt-2 max-w-xl font-mono text-[11px] leading-relaxed text-white/50 xl:text-xs xl:max-w-2xl"
              >
                {compilation.description}
              </m.p>
            )}
            <m.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="mt-4 flex items-center gap-5"
            >
              <span className="font-mono text-[10px] text-white/40">
                {compilation.itemCount} {compilation.itemCount === 1 ? "item" : "items"}
              </span>
              {isOwner && (
                <Link
                  href={`/me/library/lists/${compilation.hashId}`}
                  className="font-mono text-[10px] uppercase tracking-widest text-white/40 underline decoration-dotted underline-offset-2 hover:text-white/70"
                >
                  Edit
                </Link>
              )}
            </m.div>
          </div>
        </div>
      </section>

      {/* ── Filter bar ────────────────────────────────────── */}
      {availableTypes.length > 1 && (
        <div className="sticky top-0 z-10 border-b border-border/20 bg-background/90 backdrop-blur-md">
          <div className="mx-auto flex max-w-7xl items-center gap-6 overflow-x-auto px-6 py-3.5 xl:gap-8 xl:px-10 xl:py-4">
            <button
              onClick={() => setFilter("all")}
              className={cn(
                "shrink-0 font-mono text-[10px] uppercase tracking-widest transition-colors xl:text-xs",
                filter === "all"
                  ? "text-foreground"
                  : "text-muted-foreground/40 hover:text-muted-foreground"
              )}
            >
              All
            </button>
            {availableTypes.map((t) => (
              <button
                key={t}
                onClick={() => setFilter(t)}
                className={cn(
                  "shrink-0 font-mono text-[10px] uppercase tracking-widest transition-colors xl:text-xs",
                  filter === t
                    ? "text-foreground"
                    : "text-muted-foreground/40 hover:text-muted-foreground"
                )}
              >
                {TYPE_LABEL[t]}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ── Items ─────────────────────────────────────────── */}
      <div className="mx-auto max-w-7xl px-6 py-8 sm:px-10 xl:px-10 xl:py-12">
        {filteredItems.length === 0 ? (
          <p className="py-16 text-center font-mono text-[11px] text-muted-foreground/40 xl:text-xs">
            Nothing here yet.
          </p>
        ) : (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 xl:gap-5">
            {filteredItems.map((item, i) => {
              const itemId =
                typeof item.value === "string" ? item.value : item.value.id;
              const itemData =
                typeof item.value === "string" ? null : item.value;
              return (
                <PublicItemCard
                  key={`${item.relationTo}-${itemId}`}
                  index={i}
                  collectionSlug={item.relationTo}
                  itemId={itemId}
                  itemData={itemData}
                  viewerId={viewerId}
                />
              );
            })}
          </div>
        )}
      </div>
    </article>
  );
}

// ── Public Item Card ──────────────────────────────────────────────────────────

function PublicItemCard({
  index,
  collectionSlug,
  itemId,
  itemData,
  viewerId
}: {
  index: number;
  collectionSlug: CompilationItemType;
  itemId: string;
  itemData: Record<string, any> | null;
  viewerId: string | null;
}) {
  const title = itemData?.title ?? itemData?.filename ?? "—";
  const imageUrl =
    typeof itemData?.image === "object" && itemData?.image?.url
      ? itemData.image.url
      : typeof itemData?.image === "string"
        ? null
        : (itemData?.url ?? null);
  const imageAlt = itemData?.image?.alt ?? itemData?.alt ?? title;
  const itemUrl = resolveItemUrl(collectionSlug, itemData);

  return (
    <m.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: "spring", bounce: 0.1, delay: index * 0.03, duration: 0.4 }}
      className="group relative overflow-hidden rounded-sm border border-border/20 bg-card transition-colors hover:border-border/40"
    >
      {/* Bookmark button (visible to logged-in viewers) */}
      {viewerId && (
        <div className="absolute right-2 top-2 z-10 opacity-0 transition-opacity group-hover:opacity-100">
          <BookmarkButton
            collectionSlug={collectionSlug}
            itemId={itemId}
            userId={viewerId}
            className="flex h-11 w-11 items-center justify-center rounded-sm bg-background/80 text-foreground/60 backdrop-blur-sm transition-colors hover:text-foreground [&_svg]:size-[14px]"
          />
        </div>
      )}

      {/* Image */}
      <div className="relative aspect-[4/3] w-full overflow-hidden bg-muted/20">
        {imageUrl ? (
          <Image
            src={imageUrl}
            alt={imageAlt}
            fill
            className="object-cover transition-transform duration-500 group-hover:scale-[1.04]"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center">
            <span className="select-none font-mono text-4xl text-muted-foreground/15">
              {collectionSlug.charAt(0).toUpperCase()}
            </span>
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-background/60 via-transparent to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
      </div>

      {/* Info */}
      <div className="p-3 xl:p-3.5">
        {itemUrl ? (
          <Link href={itemUrl} className="block">
            <p className="line-clamp-2 text-xs font-medium leading-snug tracking-tight transition-opacity hover:opacity-70 xl:text-sm">
              {title}
            </p>
          </Link>
        ) : (
          <p className="line-clamp-2 text-xs font-medium leading-snug tracking-tight xl:text-sm">
            {title}
          </p>
        )}
        <p className="mt-1 font-mono text-[9px] uppercase tracking-widest text-muted-foreground/35 xl:text-[10px]">
          {TYPE_LABEL[collectionSlug]}
        </p>
      </div>
    </m.div>
  );
}

function resolveItemUrl(
  collectionSlug: CompilationItemType,
  itemData: Record<string, any> | null
): string | null {
  if (!itemData) return null;
  switch (collectionSlug) {
    case "posts":
      return itemData.slug ? `/essays/${itemData.slug}` : null;
    case "surf":
      return itemData.slug ? `/surf/${itemData.slug}` : null;
    case "profile":
      return itemData.slug ? `/users/${itemData.slug}` : null;
    case "albums":
    case "playlists":
    case "tracks":
      return `/radio`;
    case "userMedia":
      return itemData.url ?? null;
    default:
      return null;
  }
}
