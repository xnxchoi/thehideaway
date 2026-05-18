"use client";

import { useGSAP } from "@gsap/react";
import { gsap } from "gsap";
import { AnimatePresence } from "motion/react";
import * as m from "motion/react-m";
import { useTranslations } from "next-intl";
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type UIEventHandler
} from "react";
import { useIsMobile } from "@/providers/MiddleMan";
import { GuestFocus } from "./GuestFocus";
import { runConfetti, type ConfettiHandle } from "./confetti";
import type { GuestProfile } from "./types";

type Props = {
  guests: GuestProfile[];
  viewerId: string | null;
};

export function GuestsView({ guests, viewerId }: Props) {
  const t = useTranslations("Event.Guests");
  const { isMobile } = useIsMobile();
  const [active, setActive] = useState<GuestProfile | null>(null);
  const [focused, setFocused] = useState<GuestProfile | null>(null);

  // Confetti gate — fires once per "you" entry of active state.
  const lastFiredFor = useRef<string | null>(null);
  const confettiHandle = useRef<ConfettiHandle | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!active || !viewerId) return;
    if (active.authorId !== viewerId) return;
    if (lastFiredFor.current === active.profileId) return;
    if (!canvasRef.current) return;

    lastFiredFor.current = active.profileId;
    confettiHandle.current?.stop();
    confettiHandle.current = runConfetti(
      canvasRef.current,
      window.innerWidth,
      window.innerHeight,
      Math.min(Math.max(window.devicePixelRatio, 1), 2)
    );
  }, [active, viewerId]);

  // Reset confetti-debounce when the focus modal closes, so re-entering the
  // active state from outside the modal can re-fire.
  useEffect(() => {
    if (!focused) lastFiredFor.current = null;
  }, [focused]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      confettiHandle.current?.stop();
    };
  }, []);

  // Empty state
  if (guests.length === 0) {
    return (
      <main className="min-h-screen bg-background text-foreground">
        <GuestsHeader count={0} />
        <section className="mx-auto flex max-w-2xl flex-col items-center justify-center px-6 py-32 text-center">
          <span aria-hidden className="mb-4 font-mono text-5xl opacity-10">
            ○
          </span>
          <p className="text-base font-light text-foreground/75">
            {t("empty.headline")}
          </p>
          <p className="mt-1.5 max-w-xs font-mono text-[11px] text-foreground/50">
            {t("empty.body")}
          </p>
        </section>
      </main>
    );
  }

  return (
    <main className="relative min-h-screen overflow-hidden bg-background text-foreground">
      <GuestsHeader count={guests.length} />

      {isMobile ? (
        <MobileGuestList
          guests={guests}
          viewerId={viewerId}
          onActiveChange={setActive}
          onFocus={(g) => setFocused(g)}
        />
      ) : (
        <DesktopGuestList
          guests={guests}
          active={active}
          onActiveChange={setActive}
          onFocus={(g) => setFocused(g)}
        />
      )}

      {/* Confetti overlay */}
      <canvas
        ref={canvasRef}
        aria-hidden
        className="pointer-events-none fixed inset-0 z-[110]"
      />

      <GuestFocus
        guest={focused}
        isViewer={!!focused && focused.authorId === viewerId}
        onClose={() => setFocused(null)}
      />
    </main>
  );
}

/* ──────────────────────────────────────────────────────────────────── */
/* Header                                                                */
/* ──────────────────────────────────────────────────────────────────── */

function GuestsHeader({ count }: { count: number }) {
  const t = useTranslations("Event.Guests");

  return (
    <header className="sticky top-0 z-30 border-b border-border/30 bg-background/90 backdrop-blur-md">
      <div className="mx-auto flex max-w-7xl items-end justify-between gap-6 px-6 py-5 xl:px-10">
        <div>
          <p className="mb-2 font-mono text-[10px] tracking-[0.2em] text-foreground/55 uppercase">
            {t("eyebrow")}
          </p>
          <h1 className="text-3xl font-light tracking-tight xl:text-4xl">
            {t("title")}
          </h1>
          <p className="mt-1 text-sm font-light text-foreground/70 xl:text-base">
            {t("subtitle")}
          </p>
        </div>
        <div className="flex flex-col items-end gap-2 text-right">
          <p className="font-mono text-[11px] text-foreground/55 tabular-nums xl:text-xs">
            {count.toString().padStart(2, "0")}
          </p>
          <a
            href="/day-n-night"
            className="font-mono text-[10px] tracking-widest text-foreground/65 uppercase transition-colors hover:text-foreground"
          >
            ← {t("navigation.back")}
          </a>
        </div>
      </div>
    </header>
  );
}

/* ──────────────────────────────────────────────────────────────────── */
/* Desktop                                                               */
/* ──────────────────────────────────────────────────────────────────── */
/* Vertical typographic list; GSAP ticker loops a duplicate of the list  */
/* upward. Hover sets active → portrait + intro float to the right.      */

type DesktopProps = {
  guests: GuestProfile[];
  active: GuestProfile | null;
  onActiveChange: (g: GuestProfile | null) => void;
  onFocus: (g: GuestProfile) => void;
};

function DesktopGuestList({
  guests,
  active,
  onActiveChange,
  onFocus
}: DesktopProps) {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const yPos = useRef(0);
  const yHeight = useRef(0);
  const ySetter = useRef<(value: number) => void>(null!);
  const speed = useRef(0.5); // px per frame at baseline

  const [paused, setPaused] = useState(false);

  // Doubled list for seamless wrap.
  const doubled = useMemo(() => [...guests, ...guests], [guests]);

  useGSAP(
    () => {
      if (!listRef.current) return;
      ySetter.current = gsap.quickSetter(listRef.current, "y", "px") as (
        v: number
      ) => void;

      const measure = () => {
        // Half because the list is doubled.
        yHeight.current = listRef.current!.offsetHeight / 2;
      };
      measure();
      window.addEventListener("resize", measure);

      const tick = (time: number, dt: number) => {
        if (paused) return;
        yPos.current -= (dt / 16) * speed.current;
        if (Math.abs(yPos.current) >= yHeight.current) {
          yPos.current += yHeight.current;
        }
        ySetter.current(yPos.current);
      };

      gsap.ticker.add(tick);

      return () => {
        window.removeEventListener("resize", measure);
        gsap.ticker.remove(tick);
      };
    },
    { scope: wrapperRef, dependencies: [paused, doubled.length] }
  );

  return (
    <section
      ref={wrapperRef}
      className="relative mx-auto grid h-[calc(100vh-7rem)] max-w-7xl grid-cols-[minmax(0,7fr)_minmax(0,5fr)] gap-10 px-6 py-8 xl:px-10"
    >
      {/* Looping list */}
      <div
        className="relative overflow-hidden"
        onMouseEnter={() => setPaused(true)}
        onMouseLeave={() => {
          setPaused(false);
          onActiveChange(null);
        }}
      >
        <div
          ref={listRef}
          className="absolute inset-x-0 top-0 flex flex-col"
          style={{ willChange: "transform" }}
        >
          {doubled.map((g, idx) => (
            <button
              key={`${g.profileId}-${idx}`}
              type="button"
              onMouseEnter={() => onActiveChange(g)}
              onFocus={() => onActiveChange(g)}
              onClick={() => onFocus(g)}
              className={`group flex items-baseline gap-4 py-3 text-left transition-colors ${
                active?.profileId === g.profileId
                  ? "text-foreground"
                  : "text-foreground/55 hover:text-foreground/90"
              }`}
            >
              <span className="w-9 shrink-0 font-mono text-[10px] text-foreground/40 tabular-nums group-hover:text-foreground/60">
                {((idx % guests.length) + 1).toString().padStart(2, "0")}
              </span>
              <span className="truncate text-3xl font-light tracking-tight xl:text-4xl">
                {g.displayName}
              </span>
              {g.igHandle && (
                <span className="hidden font-mono text-[10px] tracking-widest text-foreground/45 uppercase xl:inline">
                  @{g.igHandle}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Top/bottom fade masks for the loop edges */}
        <div className="pointer-events-none absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-background to-transparent" />
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-background to-transparent" />
      </div>

      {/* Active portrait + intro panel */}
      <div className="relative hidden md:block">
        <AnimatePresence mode="wait">
          {active ? (
            <m.div
              key={active.profileId}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.22 }}
              className="sticky top-0 flex flex-col gap-5"
            >
              <div className="relative aspect-[3/4] w-full overflow-hidden rounded-xl bg-muted/20">
                {active.portrait ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={active.portrait}
                    alt={active.displayName}
                    className="absolute inset-0 h-full w-full object-cover"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center">
                    <span className="font-mono text-7xl font-light text-foreground/[0.06]">
                      {active.displayName.charAt(0).toUpperCase()}
                    </span>
                  </div>
                )}
              </div>
              <p className="text-base leading-relaxed font-light text-foreground/85 xl:text-lg">
                {active.intro}
              </p>
              <button
                type="button"
                onClick={() => onFocus(active)}
                className="self-start border border-border/30 px-4 py-2 font-mono text-[10px] tracking-widest text-foreground/75 uppercase transition-colors hover:border-border hover:text-foreground"
              >
                {active.gallery.length > 0
                  ? `${active.gallery.length.toString().padStart(2, "0")} · gallery`
                  : "open"}
              </button>
            </m.div>
          ) : (
            <m.div
              key="hint"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="sticky top-0 flex h-full items-center"
            >
              <p className="font-mono text-[11px] tracking-widest text-foreground/45 uppercase">
                Hover a name
              </p>
            </m.div>
          )}
        </AnimatePresence>
      </div>
    </section>
  );
}

/* ──────────────────────────────────────────────────────────────────── */
/* Mobile                                                                */
/* ──────────────────────────────────────────────────────────────────── */
/* Horizontal snap scroll; snapped card == active. Tap = open focus.     */

type MobileProps = {
  guests: GuestProfile[];
  viewerId: string | null;
  onActiveChange: (g: GuestProfile | null) => void;
  onFocus: (g: GuestProfile) => void;
};

function MobileGuestList({
  guests,
  viewerId,
  onActiveChange,
  onFocus
}: MobileProps) {
  const t = useTranslations("Event.Guests");
  const scrollRef = useRef<HTMLDivElement>(null);
  const scrollTo = useRef<ReturnType<typeof setTimeout> | null>(null);

  const onScroll: UIEventHandler<HTMLDivElement> = useCallback(() => {
    if (scrollTo.current) clearTimeout(scrollTo.current);
    scrollTo.current = setTimeout(() => {
      const el = scrollRef.current;
      if (!el) return;
      const w = el.clientWidth;
      const idx = Math.round(el.scrollLeft / w);
      const g = guests[Math.max(0, Math.min(idx, guests.length - 1))] ?? null;
      onActiveChange(g);
    }, 80);
  }, [guests, onActiveChange]);

  // Seed active on mount
  useEffect(() => {
    if (guests.length > 0) onActiveChange(guests[0]);
    return () => onActiveChange(null);
  }, [guests, onActiveChange]);

  return (
    <section className="px-0 py-6">
      <div
        ref={scrollRef}
        onScroll={onScroll}
        className="flex snap-x snap-mandatory gap-4 overflow-x-auto scroll-smooth px-6 pb-4"
        style={{ scrollbarWidth: "none" }}
      >
        {guests.map((g) => {
          const isYou = g.authorId === viewerId;
          return (
            <button
              key={g.profileId}
              type="button"
              onClick={() => onFocus(g)}
              className="relative flex w-[78vw] shrink-0 snap-center flex-col gap-3 overflow-hidden rounded-xl border border-border/15 bg-card text-left"
            >
              <div className="relative aspect-[3/4] w-full overflow-hidden bg-muted/20">
                {g.portrait ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={g.portrait}
                    alt={g.displayName}
                    className="absolute inset-0 h-full w-full object-cover"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center">
                    <span className="font-mono text-8xl font-light text-foreground/[0.06]">
                      {g.displayName.charAt(0).toUpperCase()}
                    </span>
                  </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-background/80 via-transparent to-transparent" />
                {isYou && (
                  <span className="absolute top-3 left-3 rounded-full border border-foreground/40 bg-background/60 px-2 py-0.5 font-mono text-[9px] tracking-widest text-foreground uppercase backdrop-blur-sm">
                    {t("you")}
                  </span>
                )}
              </div>
              <div className="px-4 pb-5">
                <p className="text-2xl font-light tracking-tight">
                  {g.displayName}
                </p>
                {g.igHandle && (
                  <p className="mt-1 font-mono text-[10px] tracking-widest text-foreground/55 uppercase">
                    @{g.igHandle}
                  </p>
                )}
                <p className="mt-3 line-clamp-3 text-sm leading-relaxed font-light text-foreground/75">
                  {g.intro}
                </p>
                <p className="mt-4 font-mono text-[10px] tracking-widest text-foreground/45 uppercase">
                  {t("actions.expand")}
                </p>
              </div>
            </button>
          );
        })}
      </div>
    </section>
  );
}
