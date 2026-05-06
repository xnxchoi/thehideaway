"use client";

import { TapePlayer } from "@/components/UX/TapePlayer";
import { useIsMobile } from "@/providers/MiddleMan";
import type { ReleaseSummary } from "@/payload/collections/Radio/api/queryAllReleases";
import type { Media } from "@/payload-types";
import Image from "next/image";
import Link from "next/link";
import { Suspense } from "react";
import {
  AmbientBackground,
  AmbientBackgroundFallback
} from "../Station/AmbientBackground";

/**
 * /radio — the Broadcast hub.
 *
 * Three zones, each ≥100vh, stacked simply:
 *
 *   1. On Air        full-screen player over scroll-linked AmbientBackground
 *   2. The Archive   chronological list of every published release
 *   3. Forthcoming   one line teasing the next drop
 *
 * No 3D parallax — that's reserved for Tape pages (/radio/tapes/vol-NNN).
 * No card grid — the catalog is small and the list reads as a record-label
 * release page, not a streaming hub.
 */
interface BroadcastHubProps {
  releases: ReleaseSummary[];
}

export function BroadcastHub({ releases }: BroadcastHubProps) {
  const { isMobile } = useIsMobile();

  return (
    <div className="relative flex min-h-screen flex-col">
      {/* Ambient background — R3F on desktop, CSS fallback on mobile.
          Stays fixed/scroll-linked so it persists across the player + archive. */}
      {!isMobile ? (
        <Suspense>
          <AmbientBackground />
        </Suspense>
      ) : (
        <AmbientBackgroundFallback />
      )}

      <div className="relative z-[2] flex flex-col">
        {/* ── Zone 1: On Air — full-screen player ──────────────────────────── */}
        <section
          aria-labelledby="on-air"
          className="relative flex min-h-screen w-full items-center justify-center"
        >
          <div className="absolute top-8 left-1/2 -translate-x-1/2">
            <p
              id="on-air"
              className="font-mono text-[10px] tracking-[0.2em] text-muted-foreground/50 uppercase xl:text-xs"
            >
              · On Air
            </p>
          </div>

          <TapePlayer variant="full" />
        </section>

        {/* ── Zone 2: The Archive — chronological list ─────────────────────── */}
        <BroadcastArchive releases={releases} />

        {/* ── Zone 3: Forthcoming ──────────────────────────────────────────── */}
        <Forthcoming />
      </div>
    </div>
  );
}

// ── Archive ─────────────────────────────────────────────────────────────────

interface BroadcastArchiveProps {
  releases: ReleaseSummary[];
}

function BroadcastArchive({ releases }: BroadcastArchiveProps) {
  return (
    <section
      aria-labelledby="archive"
      className="relative flex min-h-screen w-full flex-col justify-start py-24 xl:py-32"
    >
      <div className="mx-auto w-full max-w-7xl px-6 xl:px-10">
        <header className="mb-16 flex items-end justify-between border-b border-border/20 pb-8 xl:mb-20">
          <p
            id="archive"
            className="font-mono text-[10px] tracking-[0.2em] text-muted-foreground/50 uppercase xl:text-xs"
          >
            · The Archive
          </p>
          <p className="font-mono text-[10px] text-muted-foreground/40 tabular-nums xl:text-[11px]">
            {String(releases.length).padStart(3, "0")}{" "}
            {releases.length === 1 ? "release" : "releases"}
          </p>
        </header>

        {releases.length === 0 ? (
          <ArchiveEmpty />
        ) : (
          <ol className="divide-y divide-border/15">
            {releases.map((release, i) => (
              <ArchiveRow
                key={release.id}
                release={release}
                index={releases.length - i}
              />
            ))}
          </ol>
        )}
      </div>
    </section>
  );
}

interface ArchiveRowProps {
  release: ReleaseSummary;
  /** Catalog number — derived from chronological position for now.
      Will switch to a manual `catalogNumber` field once that lands. */
  index: number;
}

function ArchiveRow({ release, index }: ArchiveRowProps) {
  const kindLabel = release.kind === "album" ? "Long-play" : "Curation";
  const cover = release.cover as Media | null;
  const coverUrl =
    cover && typeof cover === "object" && "url" in cover ? cover.url : null;

  return (
    <li>
      <Link
        href={`/radio/${release.slug}`}
        className="group grid grid-cols-12 items-center gap-4 py-8 transition-colors hover:bg-muted/5 xl:gap-6 xl:py-10"
      >
        {/* Catalog no. */}
        <span className="col-span-2 font-mono text-[10px] text-muted-foreground/40 tabular-nums xl:col-span-1 xl:text-[11px]">
          No. {String(index).padStart(3, "0")}
        </span>

        {/* Cover thumb */}
        <span className="col-span-2 xl:col-span-1">
          <span className="relative block aspect-square w-full overflow-hidden rounded-sm border border-border/20 bg-muted/20">
            {coverUrl ? (
              <Image
                src={coverUrl}
                alt=""
                fill
                className="object-cover transition-transform duration-500 group-hover:scale-[1.04]"
                sizes="64px"
              />
            ) : (
              <span className="flex h-full items-center justify-center font-mono text-2xl text-foreground/[0.15] uppercase">
                {(release.title ?? "—").slice(0, 1)}
              </span>
            )}
          </span>
        </span>

        {/* Title + kind */}
        <span className="col-span-8 flex min-w-0 flex-col gap-1 xl:col-span-7">
          <span className="truncate text-lg font-light tracking-tight text-foreground/90 transition-colors group-hover:text-foreground xl:text-xl 2xl:text-2xl">
            {release.title}
          </span>
          <span className="truncate font-mono text-[10px] tracking-widest text-muted-foreground/50 uppercase xl:text-[11px]">
            {kindLabel}
            {release.artist && (
              <>
                <Sep />
                {release.artist}
              </>
            )}
          </span>
        </span>

        {/* Date · runtime · count */}
        <span className="col-span-12 flex justify-between font-mono text-[10px] text-muted-foreground/50 tabular-nums xl:col-span-3 xl:justify-end xl:gap-3 xl:text-[11px]">
          <ReleaseDate date={release.releaseDate} />
          <span className="hidden sm:inline">
            <Sep />
            <Runtime seconds={release.runtimeSec} />
          </span>
          <span className="hidden sm:inline">
            <Sep />
            {release.trackCount} {release.trackCount === 1 ? "track" : "tracks"}
          </span>
        </span>
      </Link>
    </li>
  );
}

function ArchiveEmpty() {
  return (
    <div className="flex flex-col items-center py-24 text-center">
      <span className="mb-4 font-mono text-5xl text-foreground/10">○</span>
      <p className="text-base font-light text-foreground/70">
        Nothing in rotation yet.
      </p>
      <p className="mt-1.5 max-w-xs font-mono text-[11px] text-muted-foreground/50">
        The first volume drops soon.
      </p>
    </div>
  );
}

// ── Forthcoming ─────────────────────────────────────────────────────────────

function Forthcoming() {
  return (
    <section
      aria-labelledby="forthcoming"
      className="relative w-full border-t border-border/20 py-20 xl:py-24"
    >
      <div className="mx-auto w-full max-w-7xl px-6 xl:px-10">
        <p
          id="forthcoming"
          className="mb-6 font-mono text-[10px] tracking-[0.2em] text-muted-foreground/50 uppercase xl:text-xs"
        >
          · Forthcoming
        </p>
        {/* TODO(forthcoming-cms): pull from a Payload global once the
            Brevo dispatch capture lands (Phase 2 step 9). For now this
            slot stays inert so /radio still ships. */}
        <p className="max-w-prose text-lg font-light text-foreground/70 xl:text-xl">
          Untitled · Spring 2026
        </p>
        <p className="mt-3 font-mono text-[11px] text-muted-foreground/50 xl:text-xs">
          Sign up for the dispatch{" "}
          <span className="text-muted-foreground/30">→</span>
          <span className="ml-2 text-muted-foreground/30">[coming soon]</span>
        </p>
      </div>
    </section>
  );
}

// ── Atoms ───────────────────────────────────────────────────────────────────

function Sep() {
  return <span className="mx-2 text-muted-foreground/30">·</span>;
}

function ReleaseDate({ date }: { date?: string | null }) {
  if (!date) return null;
  const d = new Date(date);
  if (Number.isNaN(d.getTime())) return null;
  return (
    <time dateTime={d.toISOString()}>
      {d.getFullYear()}.{String(d.getMonth() + 1).padStart(2, "0")}.
      {String(d.getDate()).padStart(2, "0")}
    </time>
  );
}

function Runtime({ seconds }: { seconds: number }) {
  if (!seconds) return null;
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return (
    <span>
      {mins}′{String(secs).padStart(2, "0")}″
    </span>
  );
}
