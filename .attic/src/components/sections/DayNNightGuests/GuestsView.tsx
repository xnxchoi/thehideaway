"use client";

/**
 * Day n Night — RSVP'd guests, Petra-Garmon-aligned movie-credits direction.
 *
 * Two layouts, one model.
 *
 * Landscape (laptop / desktop):
 *   • Each guest owns one 50dvh section. The active name sits at viewport
 *     center; the previous and next sections clip at the top and bottom
 *     edges (half-visible). Three names visible at any moment.
 *   • Photo is full-bleed blurred, behind the names. The active guest's
 *     portrait fades in; on rapid swaps or fast scroll we collapse to a
 *     solid color overlay.
 *
 * Portrait (phone):
 *   • Each guest owns a compact ~12dvh section. Six-to-eight names visible
 *     at once. The name nearest viewport center is the active one — it
 *     scales up and goes bright white; neighbours fade with distance.
 *   • Photo is a contained frame at the top of the viewport (sticky), not
 *     full-bleed. Background is the off-black canvas.
 *
 * Infinite loop (both layouts):
 *   We render the guest array three times — copy A | copy B | copy C —
 *   and start the user at the beginning of copy B. When they scroll into
 *   copy A or copy C, we silently teleport them back by one copy length.
 *   The copies are visually identical, so the teleport is invisible. The
 *   velocity hook treats single-frame deltas > 70% viewport as teleports
 *   and skips them, so the bg-mode doesn't flash to "color" during a snap.
 *
 * Three-state active model (unchanged from before):
 *   focused — section whose midpoint is nearest the viewport center
 *   hovered — name the cursor is over (off in this design; reserved)
 *   active  — hovered ?? focused, with a 120ms hover-clear debounce
 */

import { useLenis } from "lenis/react";
import Snap from "lenis/snap";
import { AnimatePresence } from "motion/react";
import * as m from "motion/react-m";
import { useTranslations } from "next-intl";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { ImageMedia } from "@/components/core/Media/Image";
import { cn } from "@/lib/utils";
import { getMediaUrl } from "@/utilities/getMediaUrl";

import { runConfetti, type ConfettiHandle } from "./confetti";
import {
  useActiveId,
  useBackgroundMode,
  useFocusedGuest,
  useOrientation,
  useScrollVelocity
} from "./hooks";
import type { GuestProfile } from "./types";

type Props = {
  guests: GuestProfile[];
  viewerId: string | null;
};

/** Three identical copies for invisible infinite loop. */
const LOOP_COPIES = 3;
/** Section heights, per orientation. Landscape gives a giant centred name
 * with two half-visible neighbours. Portrait gives a compact stack with
 * many names visible at once. */
const SECTION_DVH = { landscape: 50, portrait: 12 } as const;

const SECTION_KEY_SEP = "::";
const composeKey = (profileId: string, copyIdx: number) =>
  `${profileId}${SECTION_KEY_SEP}${copyIdx}`;
const profileIdFromKey = (key: string) => key.split(SECTION_KEY_SEP)[0];

export function GuestsView({ guests, viewerId }: Props) {
  const t = useTranslations("Event.Guests");
  const orientation = useOrientation();

  // Section list:
  //   Landscape: triplicated — three identical copies (A | B | C) so the
  //     snap-scroll can teleport invisibly when the user hits an edge.
  //     Each name appears 3× across the document but only one is ever on
  //     screen at a time (sections are 50dvh).
  //   Portrait: rendered ONCE. The stack is naturally a "many names
  //     visible at a glance" view, so duplicating would just print the
  //     same name three times in the visible stack. Loop in portrait is
  //     a non-goal for now — the stack itself is the visualization.
  const triplicated = useMemo(() => {
    if (guests.length === 0) return [];
    const out: Array<{
      guest: GuestProfile;
      sectionKey: string;
      copyIdx: number;
    }> = [];
    const copies = orientation === "landscape" ? LOOP_COPIES : 1;
    for (let c = 0; c < copies; c++) {
      for (const g of guests) {
        out.push({
          guest: g,
          sectionKey: composeKey(g.profileId, c),
          copyIdx: c
        });
      }
    }
    return out;
  }, [guests, orientation]);

  const sectionKeys = useMemo(
    () => triplicated.map((t) => t.sectionKey),
    [triplicated]
  );
  const byProfileId = useMemo(() => {
    const map = new Map<string, GuestProfile>();
    for (const g of guests) map.set(g.profileId, g);
    return map;
  }, [guests]);

  const { focusedId: focusedSectionKey, register } =
    useFocusedGuest(sectionKeys);
  const [hoveredSectionKey] = useState<string | null>(null);
  const activeSectionKey = useActiveId({
    hovered: hoveredSectionKey,
    focused: focusedSectionKey
  });
  const activeProfileId = activeSectionKey
    ? profileIdFromKey(activeSectionKey)
    : null;
  const active = activeProfileId
    ? (byProfileId.get(activeProfileId) ?? null)
    : null;

  const velocityRef = useScrollVelocity();
  const bgMode = useBackgroundMode({ activeId: activeProfileId, velocityRef });

  const [focused, setFocused] = useState<GuestProfile | null>(null);

  /* ───── Infinite-loop scroll ─────
     We can't statically know what 50dvh is in pixels at SSR time, so we
     run the math against window.innerHeight at scroll time. Re-init when
     orientation changes (section height changes → doc length changes). */

  const didInitRef = useRef(false);
  const orientationRef = useRef(orientation);
  useEffect(() => {
    // Re-init scroll on orientation change (section heights & document
    // length both change).
    if (orientationRef.current !== orientation) {
      didInitRef.current = false;
      orientationRef.current = orientation;
    }
    if (didInitRef.current || guests.length === 0) return;
    // Only landscape uses the infinite-loop init. Portrait scrolls
    // naturally from the top.
    if (orientation !== "landscape") {
      didInitRef.current = true;
      return;
    }
    const doInit = () => {
      const sectionH = window.innerHeight * (SECTION_DVH.landscape / 100);
      const copyH = guests.length * sectionH;
      window.scrollTo({ top: copyH, behavior: "instant" as ScrollBehavior });
    };
    // Defer past Next.js's scroll restoration. Two rAFs + a small
    // setTimeout gives the framework time to settle before we plant.
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        doInit();
        setTimeout(doInit, 60);
      });
    });
    didInitRef.current = true;
  }, [guests.length, orientation]);

  /* ───── Lenis-driven snap to section centres (landscape only) ─────
     The project mounts a root Lenis instance in <Main> (`<Linus root />`).
     We attach the lenis/snap addon to that shared instance, register each
     <li data-section-key> as a snap target with `align: ['center']`, and
     let Lenis lerp the scroll position to the nearest name when motion
     settles. We use `proximity` instead of `mandatory` so trackpad inertia
     still feels like the user is driving — snap only resolves the parked
     position, not every micro-input. */
  const lenis = useLenis();
  useEffect(() => {
    if (!lenis || orientation !== "landscape" || guests.length === 0) return;
    const snap = new Snap(lenis, {
      type: "proximity",
      duration: 0.55,
      // Resolve the snap when the user has stopped feeding the wheel.
      debounce: 220
    });
    // Wait one frame so triplicated <li>s are mounted.
    let cancelled = false;
    const removers: Array<() => void> = [];
    const wire = () => {
      if (cancelled) return;
      const els = document.querySelectorAll<HTMLElement>("[data-section-key]");
      els.forEach((el) => {
        removers.push(snap.addElement(el, { align: ["center"] }));
      });
    };
    const raf = requestAnimationFrame(() => requestAnimationFrame(wire));
    return () => {
      cancelled = true;
      cancelAnimationFrame(raf);
      for (const r of removers) r();
      snap.destroy();
    };
  }, [lenis, orientation, guests.length, triplicated.length]);

  /* ───── Velocity-driven gap compression (landscape only) ─────
     As the user scrolls faster, names cluster together — the section
     height lerps from 50dvh (settled) down toward 22dvh (high velocity).
     A CSS custom property on `documentElement` carries the value; each
     landscape <li> reads it via `style={{ height: 'var(--gn-section-h)' }}`.
     We update it on a rAF loop so paint stays in sync with the
     compositor. Settled velocity decays via the existing 100ms idle decay
     in useScrollVelocity, so the gaps naturally re-expand. */
  useEffect(() => {
    if (orientation !== "landscape") return;
    const root = document.documentElement;
    const prev = root.style.getPropertyValue("--gn-section-h");
    const MAX_DVH = 50;
    const MIN_DVH = 22;
    const VELOCITY_FLOOR = 200; // px/s — below this we stay at MAX
    const VELOCITY_CEIL = 2400; // px/s — at/above this we hit MIN
    let raf = 0;
    let lastWrite = -1;
    const tick = () => {
      const v = velocityRef.current ?? 0;
      const t = Math.max(
        0,
        Math.min(1, (v - VELOCITY_FLOOR) / (VELOCITY_CEIL - VELOCITY_FLOOR))
      );
      const h = MAX_DVH - t * (MAX_DVH - MIN_DVH);
      // Only write when it changed enough to matter (0.5dvh threshold).
      if (Math.abs(h - lastWrite) > 0.5) {
        root.style.setProperty("--gn-section-h", `${h.toFixed(1)}dvh`);
        lastWrite = h;
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(raf);
      root.style.setProperty("--gn-section-h", prev);
    };
  }, [orientation, velocityRef]);

  useEffect(() => {
    if (guests.length === 0) return;
    // Only landscape has the triplicate to snap inside.
    if (orientation !== "landscape") return;
    const onScroll = () => {
      const sectionH = window.innerHeight * (SECTION_DVH.landscape / 100);
      const copyH = guests.length * sectionH;
      if (copyH < window.innerHeight) return;
      const y = window.scrollY;
      if (y < copyH * 0.8) {
        window.scrollTo({
          top: y + copyH,
          behavior: "instant" as ScrollBehavior
        });
      } else if (y > copyH * 2.2) {
        window.scrollTo({
          top: y - copyH,
          behavior: "instant" as ScrollBehavior
        });
      }
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [guests.length, orientation]);

  /* ───── Confetti gate ───── */

  const lastFiredFor = useRef<string | null>(null);
  const confettiHandle = useRef<ConfettiHandle | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

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

  useEffect(() => () => confettiHandle.current?.stop(), []);

  /* ───── Empty state ───── */

  if (guests.length === 0) {
    return (
      <main className="min-h-screen bg-off-black text-off-white">
        <Header count={0} />
        <section className="mx-auto flex max-w-2xl flex-col items-center justify-center px-6 py-32 text-center">
          <span aria-hidden className="mb-4 font-sans text-5xl opacity-10">
            ○
          </span>
          <p className="text-base font-light text-off-white/75">
            {t("empty.headline")}
          </p>
          <p className="mt-1.5 max-w-xs font-sans text-[11px] text-off-white/45">
            {t("empty.body")}
          </p>
        </section>
      </main>
    );
  }

  return (
    <main className="relative bg-off-black text-off-white">
      <Header count={guests.length} />

      {/* Landscape: full-bleed blurred photo + velocity-driven color overlay. */}
      {orientation === "landscape" && (
        <BackgroundLandscape active={active} mode={bgMode} />
      )}

      {/* Portrait: contained portrait frame, sticky at the top. */}
      {orientation === "portrait" && <PortraitFrame active={active} />}

      <ol
        className={cn(
          "relative z-10 list-none",
          // Portrait gives the names list a top offset to clear the
          // sticky portrait frame.
          orientation === "portrait" && "pt-[40dvh]"
        )}
      >
        {triplicated.map((item) => (
          <GuestSection
            key={item.sectionKey}
            guest={item.guest}
            sectionKey={item.sectionKey}
            isViewer={item.guest.authorId === viewerId}
            orientation={orientation}
            register={register}
            onClick={() => setFocused(item.guest)}
          />
        ))}
      </ol>

      {/* Confetti overlay */}
      <canvas
        ref={canvasRef}
        aria-hidden
        className="pointer-events-none fixed inset-0 z-[200] h-full w-full"
      />

      {/* Focus modal */}
      <FocusCard
        guest={focused}
        isViewer={!!focused && focused.authorId === viewerId}
        onClose={() => setFocused(null)}
      />
    </main>
  );
}

/* ────────────────────────── Header ────────────────────────── */

function Header({ count }: { count: number }) {
  const t = useTranslations("Event.Guests");
  return (
    <header className="pointer-events-none fixed top-0 right-0 left-0 z-[60] mix-blend-difference">
      <div className="pointer-events-auto mx-auto flex max-w-7xl items-end justify-between gap-4 px-5 py-4 sm:gap-5 sm:px-6 sm:py-5 md:px-8 lg:px-10 xl:px-14 2xl:px-20">
        <div>
          <p className="mb-1.5 font-sans text-[9px] tracking-[0.25em] text-off-white/75 uppercase sm:mb-2 sm:text-[10px] xl:text-[11px]">
            {t("eyebrow")}
          </p>
          <h1 className="text-xl font-light tracking-tight text-off-white sm:text-2xl lg:text-2xl xl:text-3xl 2xl:text-4xl">
            {t("title")}
          </h1>
        </div>
        <div className="flex flex-col items-end gap-1.5 text-right sm:gap-2">
          <p className="font-sans text-[10px] text-off-white/75 tabular-nums sm:text-[11px] xl:text-xs">
            {count.toString().padStart(2, "0")}
          </p>
          <a
            href="/day-n-night"
            className="font-sans text-[9px] tracking-widest text-off-white/85 uppercase transition-colors hover:text-off-white sm:text-[10px] xl:text-[11px]"
          >
            ← {t("navigation.back")}
          </a>
        </div>
      </div>
    </header>
  );
}

/* ────────────────────────── Landscape background ────────────────────────── */

function BackgroundLandscape({
  active,
  mode
}: {
  active: GuestProfile | null;
  mode: "photo" | "color";
}) {
  return (
    <div
      aria-hidden
      className="pointer-events-none fixed inset-0 z-0 overflow-hidden"
    >
      <AnimatePresence mode="popLayout" initial={false}>
        {active?.portrait && (
          <m.div
            key={`bg-${active.profileId}`}
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.55 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5, ease: [0.45, 0, 0.55, 1] }}
            className="absolute inset-0"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={active.portrait}
              alt=""
              className="absolute inset-0 h-full w-full scale-110 object-cover"
            />
            <div className="absolute inset-0 backdrop-blur-2xl" />
            <div className="absolute inset-0 bg-off-black/40" />
          </m.div>
        )}
      </AnimatePresence>
      <m.div
        className="absolute inset-0 bg-off-black"
        animate={{ opacity: mode === "color" ? 1 : 0 }}
        transition={{ duration: 0.28, ease: [0.45, 0, 0.55, 1] }}
      />
      <div
        className="absolute inset-0 opacity-[0.04] mix-blend-overlay"
        style={{
          backgroundImage:
            "radial-gradient(rgba(255,255,255,0.4) 1px, transparent 1px)",
          backgroundSize: "3px 3px"
        }}
      />
    </div>
  );
}

/* ────────────────────────── Portrait top frame ────────────────────────── */
/*
 * Sticky contained portrait at the top of the viewport. Crossfades the
 * active guest's photo. Sized to roughly 40dvh so it leaves plenty of
 * room for the stacked name list below.
 */

function PortraitFrame({ active }: { active: GuestProfile | null }) {
  return (
    <div className="pointer-events-none sticky top-0 z-0 h-[40dvh] w-full overflow-hidden">
      {/* Solid canvas fallback under the photo, so the area never goes empty. */}
      <div className="absolute inset-0 bg-off-black" />
      <AnimatePresence mode="popLayout" initial={false}>
        {active?.portrait && (
          <m.div
            key={`pp-${active.profileId}`}
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.85 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.45, ease: [0.45, 0, 0.55, 1] }}
            className="absolute inset-0"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={active.portrait}
              alt=""
              className="absolute inset-0 h-full w-full object-cover"
            />
            <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-b from-transparent to-off-black" />
          </m.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ────────────────────────── Guest section ────────────────────────── */
/*
 * One section per (guest × copy). Section height is orientation-driven.
 * Opacity AND scale fall off with distance from viewport centre; in
 * landscape the scale stays at 1 (all names render at the same physical
 * size, the off-centre ones just clip at the viewport edge). In portrait
 * the scale falls off too — the active name reads bigger than its
 * neighbours, matching the PG-style stack.
 */

type GuestSectionProps = {
  guest: GuestProfile;
  sectionKey: string;
  isViewer: boolean;
  orientation: "portrait" | "landscape";
  register: (id: string, el: HTMLElement | null) => void;
  onClick: () => void;
};

function GuestSection({
  guest,
  sectionKey,
  isViewer,
  orientation,
  register,
  onClick
}: GuestSectionProps) {
  const t = useTranslations("Event.Guests");
  const tTier = useTranslations("Event.Guests.tier");
  const sectionRef = useRef<HTMLLIElement | null>(null);
  const [opacity, setOpacity] = useState(1);

  // Stable callback ref so React doesn't unmount/remount on every render.
  const setRefs = useCallback(
    (el: HTMLLIElement | null) => {
      sectionRef.current = el;
      register(sectionKey, el);
    },
    [register, sectionKey]
  );

  useEffect(() => {
    const compute = () => {
      const el = sectionRef.current;
      if (!el) return;
      const r = el.getBoundingClientRect();
      const mid = r.top + r.height / 2;
      const center = window.innerHeight / 2;
      // halfRange tuned so the section reaches opacity 1 at viewport
      // centre and fades to 0 at one full viewport away. Neighbours at
      // sectionH distance away render at (1 - sectionH / vh) opacity —
      // about 0.5 in landscape (50dvh sections), about 0.88 in portrait
      // (12dvh sections, so many remain visible).
      const halfRange = window.innerHeight;
      const d = Math.abs(mid - center);
      const next = Math.max(0, Math.min(1, 1 - d / halfRange));
      setOpacity(next);
    };

    let raf: number | null = null;
    const onScroll = () => {
      if (raf !== null) return;
      raf = requestAnimationFrame(() => {
        raf = null;
        compute();
      });
    };

    compute();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      if (raf !== null) cancelAnimationFrame(raf);
    };
  }, []);

  // Portrait emphasises the active name by also scaling it. Inactive
  // sections render at ~0.7× their nominal size; active sections at 1×.
  // Landscape keeps everyone at 1× — the half-clipped edges already do
  // the visual work.
  const scale = orientation === "portrait" ? 0.72 + opacity * 0.28 : 1;
  // Portrait inactive names sit closer to the body-text floor so the
  // active one really pops. Landscape inactives already crop visually.
  const portraitOpacity =
    orientation === "portrait" ? 0.15 + opacity * 0.85 : opacity;

  return (
    <li
      ref={setRefs}
      data-guest-tier={guest.tier}
      data-section-key={sectionKey}
      className={cn(
        "relative flex w-full items-center",
        orientation === "landscape"
          ? "px-5 sm:px-6 md:px-10 lg:px-14 xl:px-20 2xl:px-28"
          : "h-[12dvh] px-5 sm:px-6"
      )}
      style={
        orientation === "landscape"
          ? {
              // CSS var set by the velocity loop above. Falls back to 50dvh
              // when no JS has touched it yet (SSR / first paint).
              height: "var(--gn-section-h, 50dvh)",
              // Smooth the height change so the compression reads as motion,
              // not a jump. Velocity updates every frame so this transition
              // is doing nudge-smoothing on top of the rAF lerp.
              transition: "height 180ms cubic-bezier(0.45, 0, 0.55, 1)"
            }
          : undefined
      }
    >
      <div
        className="w-full max-w-full origin-left text-left will-change-[opacity,transform]"
        style={{
          opacity: portraitOpacity,
          transform: `scale(${scale})`
        }}
      >
        {/* Tier eyebrow lives above the name only in landscape — portrait
            stacks too tight to clear room for it without clutter. */}
        {orientation === "landscape" && (
          <p className="mb-2.5 font-sans text-[9px] tracking-[0.32em] text-off-white/65 uppercase sm:mb-3 sm:text-[10px] sm:tracking-[0.35em] md:mb-4 md:text-[11px] lg:mb-5 xl:mb-6 xl:text-[12px] 2xl:text-[13px]">
            {tTier(guest.tier)}
          </p>
        )}
        <button
          type="button"
          onClick={onClick}
          className={cn(
            "block max-w-full text-left font-wide font-light tracking-tight text-off-white",
            orientation === "landscape"
              ? "text-[16vw] leading-[0.95] sm:text-[14vw] md:text-[12vw] lg:text-[11vw] xl:text-[10.5vw] 2xl:text-[10vw]"
              : "text-[7.5vw] leading-[1.05]"
          )}
        >
          {guest.displayName}
          {isViewer && (
            <span aria-hidden className="ml-3 align-middle text-[0.45em]">
              ✦
            </span>
          )}
        </button>
        {/* IG / expand row lives only in landscape — portrait keeps the
            stack visually clean. Clicking any name opens the focus card. */}
        {orientation === "landscape" && (
          <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 sm:mt-5 sm:gap-x-5 md:mt-6 lg:mt-7 xl:mt-8 2xl:mt-9">
            {guest.igHandle && (
              <a
                href={`https://instagram.com/${guest.igHandle}`}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
                className="font-sans text-[10px] tracking-widest text-off-white/65 uppercase transition-colors hover:text-off-white sm:text-[11px] xl:text-[12px]"
              >
                @{guest.igHandle}
              </a>
            )}
            <button
              type="button"
              onClick={onClick}
              className="font-sans text-[10px] tracking-widest text-off-white/45 uppercase transition-colors hover:text-off-white/80 xl:text-[11px]"
            >
              {t("actions.expand")}
            </button>
          </div>
        )}
      </div>
    </li>
  );
}

/* ────────────────────────── Focus card ────────────────────────── */

type FocusProps = {
  guest: GuestProfile | null;
  isViewer: boolean;
  onClose: () => void;
};

function FocusCard({ guest, isViewer, onClose }: FocusProps) {
  const t = useTranslations("Event.Guests");
  const [galleryIdx, setGalleryIdx] = useState(0);

  useEffect(() => {
    setGalleryIdx(0);
  }, [guest?.profileId]);

  useEffect(() => {
    if (!guest) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [guest, onClose]);

  return (
    <AnimatePresence>
      {guest && (
        <m.div
          key={`focus-${guest.profileId}`}
          className="fixed inset-0 z-[120] flex items-center justify-center px-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.22 }}
        >
          <button
            type="button"
            onClick={onClose}
            aria-label={t("actions.close")}
            className="absolute inset-0 bg-off-black/85 backdrop-blur-md"
          />
          <m.div
            className="relative z-[1] grid max-h-[88vh] w-full max-w-3xl grid-rows-[auto_1fr] overflow-hidden rounded-2xl border border-off-white/10 bg-off-black/85 shadow-[0_30px_80px_-20px_rgba(0,0,0,0.6)] backdrop-blur-xl xl:max-w-4xl"
            initial={{ opacity: 0, y: 24, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 16, scale: 0.98 }}
            transition={{ type: "spring", bounce: 0.15, duration: 0.4 }}
          >
            <header className="flex items-start justify-between gap-6 border-b border-off-white/10 px-6 py-5 xl:px-9 xl:py-7">
              <div>
                {isViewer && (
                  <p className="mb-2 font-sans text-[10px] tracking-[0.3em] text-off-white/65 uppercase">
                    {t("you")}
                  </p>
                )}
                <h2 className="font-wide text-3xl font-light tracking-tight text-off-white xl:text-4xl">
                  {guest.displayName}
                </h2>
                {guest.igHandle && (
                  <a
                    href={`https://instagram.com/${guest.igHandle}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-2 inline-flex items-center gap-1.5 font-sans text-[11px] tracking-widest text-off-white/70 uppercase transition-colors hover:text-off-white"
                  >
                    @{guest.igHandle}
                    <span aria-hidden>↗</span>
                  </a>
                )}
              </div>
              <button
                type="button"
                onClick={onClose}
                aria-label={t("actions.close")}
                className="shrink-0 border border-off-white/30 px-3 py-1.5 font-sans text-[10px] tracking-widest text-off-white/70 uppercase transition-colors hover:border-off-white hover:text-off-white"
              >
                {t("actions.close")}
              </button>
            </header>
            <div className="grid gap-6 overflow-y-auto px-6 py-6 xl:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] xl:gap-10 xl:px-9 xl:py-8">
              <div className="flex flex-col gap-5">
                {guest.portrait && (
                  <div className="relative aspect-[3/4] w-full overflow-hidden rounded-xl bg-off-white/[0.04]">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={guest.portrait}
                      alt={guest.displayName}
                      className="absolute inset-0 h-full w-full object-cover"
                    />
                  </div>
                )}
                <div>
                  <p className="mb-2 font-sans text-[10px] tracking-[0.3em] text-off-white/55 uppercase">
                    {t("intro.label")}
                  </p>
                  <p className="text-base leading-relaxed font-light text-off-white/90">
                    {guest.intro}
                  </p>
                </div>
              </div>
              <div className="flex flex-col gap-3">
                <p className="font-sans text-[10px] tracking-[0.3em] text-off-white/55 uppercase">
                  {t("gallery.label")}
                </p>
                {guest.gallery.length === 0 ? (
                  <div className="flex h-40 items-center justify-center rounded-xl border border-dashed border-off-white/20">
                    <p className="font-sans text-[11px] text-off-white/45">
                      {t("gallery.empty")}
                    </p>
                  </div>
                ) : (
                  <>
                    <div className="relative aspect-[4/3] w-full overflow-hidden rounded-xl bg-off-white/[0.03]">
                      <ImageMedia
                        src={getMediaUrl(
                          (guest.gallery[galleryIdx] ?? guest.gallery[0]).media
                            .url
                        )}
                        imgClassName="absolute inset-0 h-full w-full object-cover"
                      />
                    </div>
                    {guest.gallery.length > 1 && (
                      <div className="grid grid-cols-5 gap-2">
                        {guest.gallery.map((item, i) => (
                          <button
                            key={item.id}
                            type="button"
                            onClick={() => setGalleryIdx(i)}
                            aria-label={`Photo ${i + 1}`}
                            className={cn(
                              "relative aspect-square overflow-hidden rounded-md transition-opacity",
                              i === galleryIdx
                                ? "opacity-100"
                                : "opacity-50 hover:opacity-80"
                            )}
                          >
                            <ImageMedia
                              src={getMediaUrl(item.media.url)}
                              imgClassName="absolute inset-0 h-full w-full object-cover"
                            />
                            {i === galleryIdx && (
                              <span className="pointer-events-none absolute inset-0 ring-1 ring-off-white/40 ring-inset" />
                            )}
                          </button>
                        ))}
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          </m.div>
        </m.div>
      )}
    </AnimatePresence>
  );
}
