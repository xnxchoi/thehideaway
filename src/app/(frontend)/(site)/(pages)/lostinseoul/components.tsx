"use client";

import {
  useEffect,
  useRef,
  useState,
  type ComponentProps,
  type ReactNode
} from "react";
import {
  ArrowsOutSimpleIcon,
  PauseIcon,
  PlayIcon,
  SpeakerHighIcon,
  SpeakerXIcon
} from "@phosphor-icons/react";
import { createPortal } from "react-dom";
import * as m from "motion/react-m";
import type Lenis from "lenis";
import { useLenis } from "lenis/react";
import { Button } from "@/components/core/Button";
import { Link } from "@/components/core/Link/Link";
import { useCursor } from "@/providers/RP_Pro";
import {
  clearLostLenis,
  getLostLenis,
  setLostLenis,
  syncLostScrollY
} from "@/lib/lenis/runtime";
import { cn } from "@/lib/utils";
import type { LostProductCard } from "@/lib/lost-commerce/queries";
import { LostCartOverlay } from "./cart-overlay";
import { LostHeroScene } from "./hero-three";

export const LOST_EASE = "cubic-bezier(0.6,0,0.3,1)";
export const LOST_PANEL = "#e7e7e3";

type ChromeLinkProps = ComponentProps<typeof Link> & {
  children: ReactNode;
};

export function LostLenisBridge() {
  const lenis = useLenis();
  const syncBridgeScroll = (instance: Lenis | null) => {
    document.body.dataset.lostLenisScroll = Math.round(
      syncLostScrollY(instance)
    ).toString();
  };

  useEffect(() => {
    document.body.dataset.lostLenisBridge = "mounted";
    const syncNativeScroll = () => {
      syncBridgeScroll(getLostLenis());
    };
    window.addEventListener("scroll", syncNativeScroll, { passive: true });

    return () => {
      window.removeEventListener("scroll", syncNativeScroll);
      document.body.dataset.lostLenisBridge = "unmounted";
    };
  }, []);

  useEffect(() => {
    document.body.dataset.lostLenisReady = lenis ? "true" : "false";
    if (!lenis) return undefined;
    setLostLenis(lenis);
    syncBridgeScroll(lenis);

    const syncLenisScroll = () => {
      syncBridgeScroll(lenis);
    };
    lenis.on("scroll", syncLenisScroll);

    return () => {
      lenis.off("scroll", syncLenisScroll);
      syncLostScrollY(null);
      clearLostLenis(lenis);
    };
  }, [lenis]);

  return <span aria-hidden className="hidden" data-lost-lenis-bridge />;
}

export function LostCursorBridge() {
  const setCursorState = useCursor((store) => store.setCursorState);
  const setCursorTheme = useCursor((store) => store.setCursorTheme);
  const setBaseCursorTheme = useCursor((store) => store.setBaseCursorTheme);
  const resetCursorTheme = useCursor((store) => store.resetCursorTheme);

  useEffect(() => {
    const applyCursorTheme = () => {
      const inVideo = document.body.dataset.lostVideoOpen === "true";
      const inBag = document.body.dataset.lostBagOpen === "true";
      const nextTheme = inVideo || inBag ? "dark" : "light";
      document.body.dataset.lostCursorTheme = nextTheme;
      setCursorTheme(nextTheme);
    };

    setCursorState(null);
    setBaseCursorTheme("light");
    applyCursorTheme();
    window.addEventListener("scroll", applyCursorTheme, { passive: true });
    window.addEventListener("resize", applyCursorTheme);
    const videoObserver = new MutationObserver(applyCursorTheme);
    videoObserver.observe(document.body, {
      attributeFilter: ["data-lost-video-open", "data-lost-bag-open"],
      attributes: true
    });

    return () => {
      window.removeEventListener("scroll", applyCursorTheme);
      window.removeEventListener("resize", applyCursorTheme);
      videoObserver.disconnect();
      delete document.body.dataset.lostCursorTheme;
      setCursorState(null);
      resetCursorTheme();
    };
  }, [resetCursorTheme, setBaseCursorTheme, setCursorState, setCursorTheme]);

  return null;
}

export function LostCommerceChromeStyles() {
  return (
    <style>
      {`
        body:has(.lost-commerce-root) #rp-header,
        body:has(.lost-commerce-root) footer,
        body:has(.lost-commerce-root) .menu__frame,
        body:has(.lost-commerce-root) .menu__frame-corner,
        body:has(.lost-commerce-root) .menu__corner-svg,
        body:has(.lost-commerce-root) .menu__preview-preview,
        body:has(.lost-commerce-root) .pt_mask,
        body:has(.lost-commerce-root) .pt_cornerstones,
        body:has(.lost-commerce-root) .scroll-indicator,
        body:has(.lost-commerce-root) [class*="z-239"],
        body:has(.lost-commerce-root) [class*="z-[248]"],
        body:has(.lost-commerce-root) [class*="top-fx-bottom"] {
          display: none !important;
        }
        body:has(.lost-commerce-root) {
          background: #000;
        }
        .lost-commerce-root {
          --lost-bg: #050505;
          --lost-paper: #f2f1ea;
          --lost-paper-soft: #e7e7e3;
          --lost-dark: #080806;
          --lost-ink: #e7e7e3;
          --lost-paper-ink: #080806;
          --lost-line: rgba(231, 231, 227, 0.14);
          --lost-paper-line: rgba(8, 8, 6, 0.14);
          --lost-muted: rgba(231, 231, 227, 0.62);
          --lost-paper-muted: rgba(8, 8, 6, 0.62);
          --lost-panel: #e7e7e3;
          --lost-hero-ink: #080806;
          --lost-hero-muted: rgba(8, 8, 6, 0.62);
          --lost-hero-line: rgba(8, 8, 6, 0.16);
          --lost-hero-glass: rgba(242, 241, 234, 0.28);
          --lost-hero-glass-hover: rgba(242, 241, 234, 0.42);
          --lost-hero-halo: rgba(242, 241, 234, 0.5);
          background: var(--lost-paper);
          color: var(--lost-paper-ink);
        }
        body[data-lost-video-open="true"] .lost-commerce-root,
        body[data-lost-bag-open="true"] .lost-commerce-root {
          --lost-hero-ink: #e7e7e3;
          --lost-hero-muted: rgba(231, 231, 227, 0.68);
          --lost-hero-line: rgba(231, 231, 227, 0.15);
          --lost-hero-glass: rgba(8, 8, 6, 0.34);
          --lost-hero-glass-hover: rgba(8, 8, 6, 0.48);
          --lost-hero-halo: rgba(8, 8, 6, 0.38);
        }
        body:has(.lost-commerce-root) .rp__cursor {
          z-index: 1301 !important;
        }
        body:has(.lost-commerce-root) .rp__cursor[data-theme="light"] {
          color: #080806 !important;
        }
        body:has(.lost-commerce-root) .rp__cursor[data-theme="light"] svg circle,
        body:has(.lost-commerce-root) .rp__cursor[data-theme="light"] svg * {
          stroke: #080806 !important;
        }
        body:has(.lost-commerce-root) .rp__cursor[data-theme="light"] svg circle:last-child {
          fill: #080806 !important;
        }
        body:has(.lost-commerce-root) .rp__cursor[data-theme="dark"] {
          color: #e7e7e3 !important;
        }
        body:has(.lost-commerce-root) .rp__cursor[data-theme="dark"] svg circle,
        body:has(.lost-commerce-root) .rp__cursor[data-theme="dark"] svg * {
          stroke: #e7e7e3 !important;
        }
        body:has(.lost-commerce-root) .rp__cursor[data-theme="dark"] svg circle:last-child {
          fill: #e7e7e3 !important;
        }
        @media (prefers-reduced-motion: reduce) {
          .lost-commerce-root *,
          .lost-bag-surface * {
            animation-duration: 1ms !important;
            transition-duration: 1ms !important;
          }
        }
      `}
    </style>
  );
}

export function LostChromeLink({
  children,
  className,
  ...props
}: ChromeLinkProps) {
  return (
    <Link
      className={cn(
        "relative inline-flex min-h-16 items-center overflow-hidden rounded-[4px] border border-[var(--lost-hero-line)] bg-[var(--lost-hero-glass)] px-5 text-[1.2rem] leading-none font-medium text-[var(--lost-hero-ink)] backdrop-blur-md transition-colors duration-500 ease-[cubic-bezier(0.6,0,0.3,1)] before:absolute before:inset-y-0 before:left-0 before:w-0 before:bg-[var(--lost-hero-glass-hover)] before:transition-[width] before:duration-300 before:ease-[cubic-bezier(0.6,0,0.3,1)] hover:before:w-full focus-visible:before:w-full",
        className
      )}
      {...props}
    >
      <span className="relative z-10">{children}</span>
    </Link>
  );
}

export function LostTopBar({
  reverse = false,
  pale = false
}: {
  reverse?: boolean;
  pale?: boolean;
}) {
  return (
    <div
      aria-hidden
      className={cn(
        "h-[1.5rem] border-x border-t",
        reverse && "border-t-0 border-b",
        pale ? "border-white/15" : "border-black/15"
      )}
    />
  );
}

export function LostBrandWord({
  dark = false,
  className
}: {
  dark?: boolean;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "font-mono text-[1.2rem] leading-none font-bold tracking-[0.24em] uppercase md:text-[1.6rem]",
        dark ? "text-black" : "text-[var(--lost-hero-ink)]",
        "transition-colors duration-500 ease-[cubic-bezier(0.6,0,0.3,1)]",
        className
      )}
    >
      LOSTINSEOUL
    </span>
  );
}

export function LostAnnouncementBar({ children }: { children: ReactNode }) {
  return (
    <div className="sticky top-0 z-40 border-b border-white/12 bg-[#101010]/90 px-4 py-4 text-center font-mono text-[1rem] leading-none tracking-[0.22em] text-white/70 uppercase backdrop-blur-md">
      {children}
    </div>
  );
}

type LostHeaderProps = {
  backLabel: string;
  cartLabel: string;
  checkoutLabel: string;
  emptyLabel: string;
  removeLabel: string;
  totalLabel: string;
  shopLabel: string;
  archiveLabel: string;
  drops: Array<{ title: string; slug: string }>;
};

export function LostHeader({
  archiveLabel,
  backLabel,
  cartLabel,
  checkoutLabel,
  drops,
  emptyLabel,
  removeLabel,
  shopLabel,
  totalLabel
}: LostHeaderProps) {
  return (
    <header className="pointer-events-none fixed inset-x-0 top-20 z-50 px-4 md:px-14">
      <div className="grid grid-cols-[1fr_auto_1fr] items-start gap-4">
        <nav
          className="pointer-events-auto hidden gap-1 lg:flex"
          aria-label="LOSTINSEOUL"
        >
          <LostChromeLink href="/lostinseoul">{shopLabel}</LostChromeLink>
          {drops.slice(0, 2).map((drop) => (
            <LostChromeLink
              href={`/lostinseoul/collections/${drop.slug}`}
              key={drop.slug}
            >
              {drop.title}
            </LostChromeLink>
          ))}
          <LostChromeLink href="#products">{archiveLabel}</LostChromeLink>
        </nav>

        <Link
          aria-label="LOSTINSEOUL home"
          className="pointer-events-auto pt-5"
          href="/lostinseoul"
        >
          <LostBrandWord />
        </Link>

        <div className="pointer-events-auto flex justify-end gap-1">
          <LostCartOverlay
            backLabel={backLabel}
            cartLabel={cartLabel}
            checkoutLabel={checkoutLabel}
            emptyLabel={emptyLabel}
            removeLabel={removeLabel}
            totalLabel={totalLabel}
          />
        </div>
      </div>
    </header>
  );
}

type LostHeroProps = {
  title: string;
  eyebrow: string;
  collectionLabel: string;
  yearLabel: string;
  productsLabel: string;
  imageUrl: string;
  videoUrl?: string | null;
  watchLabel: string;
  closeLabel: string;
  playLabel: string;
  pauseLabel: string;
  muteLabel: string;
  unmuteLabel: string;
};

export function LostHero({
  closeLabel,
  collectionLabel,
  eyebrow,
  imageUrl,
  muteLabel,
  pauseLabel,
  playLabel,
  productsLabel,
  title,
  unmuteLabel,
  videoUrl,
  watchLabel,
  yearLabel
}: LostHeroProps) {
  const [videoOpen, setVideoOpen] = useState(false);
  const [videoTransitioning, setVideoTransitioning] = useState(false);
  const openTimerRef = useRef<number | null>(null);

  const openVideo = () => {
    if (!videoUrl) return;
    if (openTimerRef.current) window.clearTimeout(openTimerRef.current);
    setVideoTransitioning(true);
    document.dispatchEvent(
      new CustomEvent("lost:watch-video", { detail: { open: true } })
    );
    openTimerRef.current = window.setTimeout(() => {
      setVideoOpen(true);
      openTimerRef.current = null;
    }, 600);
  };
  const closeVideo = () => {
    if (openTimerRef.current) window.clearTimeout(openTimerRef.current);
    openTimerRef.current = null;
    setVideoOpen(false);
    setVideoTransitioning(false);
    document.dispatchEvent(
      new CustomEvent("lost:watch-video", { detail: { open: false } })
    );
  };

  useEffect(() => {
    return () => {
      if (openTimerRef.current) window.clearTimeout(openTimerRef.current);
    };
  }, []);

  return (
    <section
      className="relative grid min-h-[100svh] overflow-hidden bg-black"
      data-lost-video-transition={videoTransitioning ? "open" : "closed"}
    >
      <div
        data-lost-stage
        className="col-span-full row-span-full grid min-h-[100svh]"
      >
        <LostHeroScene imageUrl={imageUrl} videoUrl={videoUrl} />
      </div>
      <div
        aria-hidden
        className="pointer-events-none absolute -inset-20 [background-image:repeating-linear-gradient(0deg,transparent_0px,transparent_4px,white_5px),repeating-linear-gradient(90deg,transparent_0px,transparent_7px,white_8px)] opacity-[0.012] mix-blend-screen"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-56 bg-[linear-gradient(180deg,rgba(255,255,255,0.08),transparent)]"
      />

      <div className="pointer-events-none col-span-full row-span-full grid min-h-[100svh] grid-rows-[1fr_auto_1fr] px-4 pt-32 pb-10 md:px-14 md:pt-36 md:pb-16">
        <div />
        <m.div
          animate={
            videoTransitioning
              ? { opacity: 0, y: 0 }
              : { opacity: [0.9, 0.68, 0.9], y: [0, -5, 0] }
          }
          className="grid grid-cols-2 items-center gap-4 font-mono text-[1.2rem] leading-none font-bold tracking-tight text-white uppercase md:grid-cols-4 md:px-6 md:text-[1.6rem]"
          data-hero-text-container
          transition={{
            duration: videoTransitioning ? 0.8 : 8,
            ease: videoTransitioning ? [0.6, 0, 0.3, 1] : "easeInOut",
            repeat: videoTransitioning ? 0 : Infinity,
            repeatType: "loop"
          }}
        >
          <span className="text-[var(--lost-hero-ink)] transition-colors duration-700 ease-[cubic-bezier(0.6,0,0.3,1)] [text-shadow:0_1px_24px_var(--lost-hero-halo)]">
            {title}
          </span>
          <span className="justify-self-end text-[var(--lost-hero-muted)] transition-colors duration-700 ease-[cubic-bezier(0.6,0,0.3,1)] [text-shadow:0_1px_18px_var(--lost-hero-halo)] md:justify-self-center">
            {eyebrow}
          </span>
          <span className="hidden justify-self-center text-[var(--lost-hero-muted)] transition-colors duration-700 ease-[cubic-bezier(0.6,0,0.3,1)] [text-shadow:0_1px_18px_var(--lost-hero-halo)] md:block">
            {collectionLabel}
          </span>
          <span className="hidden justify-self-end text-[var(--lost-hero-ink)] transition-colors duration-700 ease-[cubic-bezier(0.6,0,0.3,1)] [text-shadow:0_1px_24px_var(--lost-hero-halo)] md:block">
            {yearLabel}
          </span>
        </m.div>
        <div
          className={cn(
            "grid items-end justify-items-center transition-opacity duration-[800ms] ease-[cubic-bezier(0.6,0,0.3,1)]",
            videoTransitioning && "opacity-0"
          )}
          data-hero-btn-container
        >
          <Link
            className="pointer-events-auto inline-grid grid-cols-[5.2rem_auto] items-center gap-3 rounded-[4px] border border-[var(--lost-hero-line)] bg-[var(--lost-hero-glass)] p-1.5 pr-5 text-[1.2rem] leading-none font-medium text-[var(--lost-hero-ink)] backdrop-blur-md transition-[color,background-color,border-color] duration-500 ease-[cubic-bezier(0.6,0,0.3,1)] hover:bg-[var(--lost-hero-glass-hover)]"
            href="#products"
          >
            <span className="block aspect-square overflow-hidden rounded-[3px] border border-[var(--lost-hero-line)] bg-[var(--lost-hero-glass)]">
              <img
                alt=""
                aria-hidden
                className="h-full w-full object-cover opacity-80 grayscale transition-transform duration-500 hover:scale-110"
                src={imageUrl}
              />
            </span>
            {productsLabel}
          </Link>
        </div>
      </div>

      <Button
        aria-label={watchLabel}
        className={cn(
          "absolute top-1/2 left-1/2 inline-flex -translate-x-1/2 -translate-y-1/2 items-center gap-1 border-0 bg-transparent p-0 text-[1.2rem] leading-none font-medium text-[var(--lost-hero-ink)] transition-[color,transform] duration-[800ms] ease-[cubic-bezier(0.6,0,0.3,1)]",
          videoTransitioning && "scale-0"
        )}
        id="open-video-button"
        onClick={openVideo}
        type="button"
      >
        <span className="grid size-16 place-items-center rounded-[4px] border border-[var(--lost-hero-line)] bg-[var(--lost-hero-glass)] backdrop-blur-md transition-[background-color,border-color] duration-500 ease-[cubic-bezier(0.6,0,0.3,1)]">
          <ArrowsOutSimpleIcon
            aria-hidden
            className="size-6"
            weight="regular"
          />
        </span>
        <span className="flex min-h-16 items-center rounded-[4px] border border-[var(--lost-hero-line)] bg-[var(--lost-hero-glass)] px-5 backdrop-blur-md transition-[background-color,border-color] duration-500 ease-[cubic-bezier(0.6,0,0.3,1)]">
          {watchLabel}
        </span>
      </Button>
      {videoUrl ? (
        <LostVideoPlayer
          closeLabel={closeLabel}
          muteLabel={muteLabel}
          onClose={closeVideo}
          open={videoOpen}
          pauseLabel={pauseLabel}
          playLabel={playLabel}
          src={videoUrl}
          unmuteLabel={unmuteLabel}
        />
      ) : null}
    </section>
  );
}

function LostVideoPlayer({
  closeLabel,
  muteLabel,
  onClose,
  open,
  pauseLabel,
  playLabel,
  src,
  unmuteLabel
}: {
  closeLabel: string;
  muteLabel: string;
  onClose: () => void;
  open: boolean;
  pauseLabel: string;
  playLabel: string;
  src: string;
  unmuteLabel: string;
}) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const mutedRef = useRef(false);
  const [mounted, setMounted] = useState(false);
  const [muted, setMuted] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    document.body.dataset.lostVideoOpen = open ? "true" : "false";
    if (!open) return undefined;

    const lenis = getLostLenis();
    lenis?.stop();
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
        return;
      }
      if (event.key === " " || event.code === "Space") {
        event.preventDefault();
        const video = videoRef.current;
        if (!video) return;
        if (video.paused) {
          void video.play().then(() => setPlaying(true));
        } else {
          video.pause();
          setPlaying(false);
        }
        return;
      }
      if (event.key.toLowerCase() === "m") {
        const nextMuted = !mutedRef.current;
        mutedRef.current = nextMuted;
        setMuted(nextMuted);
        if (videoRef.current) videoRef.current.muted = nextMuted;
      }
    };
    document.addEventListener("keydown", onKeyDown);
    const video = videoRef.current;
    if (video) {
      video.muted = mutedRef.current;
      const syncTime = () => {
        setCurrentTime(video.currentTime || 0);
        setDuration(Number.isFinite(video.duration) ? video.duration : 0);
      };
      video.addEventListener("loadedmetadata", syncTime);
      video.addEventListener("timeupdate", syncTime);
      syncTime();
      void video
        .play()
        .then(() => setPlaying(true))
        .catch(() => setPlaying(false));

      return () => {
        document.removeEventListener("keydown", onKeyDown);
        video.removeEventListener("loadedmetadata", syncTime);
        video.removeEventListener("timeupdate", syncTime);
        lenis?.start();
        videoRef.current?.pause();
        setPlaying(false);
      };
    }

    return () => {
      document.removeEventListener("keydown", onKeyDown);
      lenis?.start();
      videoRef.current?.pause();
      setPlaying(false);
    };
  }, [onClose, open]);

  const togglePlay = () => {
    const video = videoRef.current;
    if (!video) return;
    if (video.paused) {
      void video.play().then(() => setPlaying(true));
    } else {
      video.pause();
      setPlaying(false);
    }
  };
  const toggleMute = () => {
    const nextMuted = !mutedRef.current;
    mutedRef.current = nextMuted;
    setMuted(nextMuted);
    if (videoRef.current) videoRef.current.muted = nextMuted;
  };
  const formatTime = (seconds: number) => {
    if (!Number.isFinite(seconds)) return "0:00";
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`;
  };

  const player = (
    <m.div
      aria-hidden={!open}
      className={cn(
        "group fixed inset-0 z-[1250] grid h-dvh w-dvw bg-black/90 text-white opacity-0 backdrop-blur-[5px] transition-opacity duration-1000 ease-in-out",
        open ? "pointer-events-auto opacity-100" : "pointer-events-none"
      )}
      data-lost-video-player={open ? "open" : "closed"}
      inert={!open}
      initial={false}
      transition={{ duration: 1, ease: "easeInOut" }}
    >
      <video
        aria-label={closeLabel}
        autoPlay
        className="h-full w-full object-cover"
        loop
        muted={muted}
        onClick={onClose}
        onPause={() => setPlaying(false)}
        onPlay={() => setPlaying(true)}
        playsInline
        ref={videoRef}
        src={src}
      />
      <div
        className="pointer-events-none absolute bottom-0 left-0 h-fit w-fit p-4 md:p-8 lg:p-12"
        data-lost-video-interface
      >
        <Button
          aria-label={muted ? unmuteLabel : muteLabel}
          className="pointer-events-auto grid size-18 place-items-center rounded-[4px] border border-white/10 bg-white/[0.08] p-0 text-white backdrop-blur-md transition-[opacity,background-color] duration-200 ease-in-out hover:bg-white/[0.13]"
          onClick={toggleMute}
          type="button"
        >
          {muted ? (
            <SpeakerXIcon aria-hidden className="size-7" weight="regular" />
          ) : (
            <SpeakerHighIcon aria-hidden className="size-7" weight="regular" />
          )}
        </Button>
      </div>

      <div
        className="pointer-events-none absolute right-0 bottom-0 flex h-fit w-fit gap-1 p-4 md:p-8 lg:p-12"
        data-lost-video-interface
      >
        <Button
          aria-label={playing ? pauseLabel : playLabel}
          className="pointer-events-auto grid size-18 place-items-center rounded-[4px] border border-white/10 bg-white/[0.08] p-0 text-white backdrop-blur-md transition-[opacity,background-color] duration-200 ease-in-out hover:bg-white/[0.13]"
          onClick={togglePlay}
          type="button"
        >
          {playing ? (
            <PauseIcon aria-hidden className="size-7" weight="regular" />
          ) : (
            <PlayIcon aria-hidden className="size-7" weight="regular" />
          )}
        </Button>
        <div className="pointer-events-none flex min-h-18 items-center rounded-[4px] border border-white/10 bg-white/[0.08] px-4 font-mono text-[1.1rem] leading-none text-white tabular-nums backdrop-blur-md">
          {formatTime(currentTime)} / {formatTime(duration)}
        </div>
      </div>
    </m.div>
  );

  return mounted ? createPortal(player, document.body) : null;
}

export function LostStatement({
  count,
  lede,
  objectsLabel
}: {
  count: number;
  lede: string;
  objectsLabel: string;
}) {
  return (
    <section className="relative grid bg-[var(--lost-paper)] px-4 py-24 text-center text-[var(--lost-paper-ink)] md:px-14 md:py-40">
      <p className="mx-auto max-w-[89.4rem] text-[2.4rem] leading-[1.08] font-medium tracking-tight md:text-[3.8rem]">
        {lede}
      </p>
      <p className="mt-8 font-mono text-[1.1rem] leading-none tracking-[0.22em] text-[var(--lost-paper-muted)] uppercase">
        {count.toString().padStart(2, "0")} {objectsLabel}
      </p>
    </section>
  );
}

type LostProductSectionProps = {
  cartLabel: string;
  emptyLabel: string;
  incomingLabel: string;
  products: LostProductCard[];
  productsLabel: string;
};

export function LostProductSection({
  cartLabel,
  emptyLabel,
  incomingLabel,
  products,
  productsLabel
}: LostProductSectionProps) {
  return (
    <section
      id="products"
      className="relative border-t border-[var(--lost-paper-line)] bg-[var(--lost-paper)] px-4 py-14 text-[var(--lost-paper-ink)] md:px-14 md:py-20"
    >
      <div className="mb-8 grid gap-6">
        <LostTopBar />
        <div className="flex items-end justify-between gap-4">
          <h2 className="font-mono text-[1.1rem] leading-none tracking-[0.22em] text-[var(--lost-paper-muted)] uppercase">
            {productsLabel}
          </h2>
          <p className="font-mono text-[1.1rem] leading-none text-black/45">
            {cartLabel} / 00
          </p>
        </div>
      </div>

      {products.length === 0 ? (
        <div className="grid gap-3 md:grid-cols-3">
          {[0, 1, 2].map((index) => (
            <LostEmptyProductCard
              emptyLabel={emptyLabel}
              incomingLabel={incomingLabel}
              index={index}
              key={index}
            />
          ))}
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {products.map((product) => (
            <LostProductTile key={product.id} product={product} />
          ))}
        </div>
      )}
    </section>
  );
}

function LostEmptyProductCard({
  emptyLabel,
  incomingLabel,
  index
}: {
  emptyLabel: string;
  incomingLabel: string;
  index: number;
}) {
  return (
    <div className="group relative min-h-[32rem] overflow-hidden rounded-[4px] border border-[var(--lost-paper-line)] bg-black/[0.035]">
      <div
        aria-hidden
        className="absolute inset-0 bg-[linear-gradient(130deg,rgba(8,34,255,0.18),rgba(242,241,234,0.42)_42%,rgba(8,8,6,0.1))] opacity-90"
      />
      <div
        aria-hidden
        className="absolute inset-x-8 top-16 h-16 bg-black/75 transition-transform duration-500 group-hover:translate-x-3"
      />
      <div className="absolute inset-x-4 bottom-4 flex items-end justify-between">
        <div>
          <p className="font-mono text-[1rem] leading-none tracking-[0.2em] text-black/45 uppercase">
            {incomingLabel}
          </p>
          <p className="mt-2 text-[1.6rem] leading-tight font-medium text-black">
            {emptyLabel}
          </p>
        </div>
        <span className="font-mono text-[1.1rem] leading-none text-black/45">
          0{index + 1}
        </span>
      </div>
    </div>
  );
}

function LostProductTile({ product }: { product: LostProductCard }) {
  return (
    <Link
      className="group block"
      href={`/lostinseoul/products/${product.slug}`}
    >
      <div className="relative aspect-[580/725] overflow-hidden rounded-[4px] border border-[var(--lost-paper-line)] bg-black/[0.035]">
        {product.imageUrl ? (
          <img
            alt={product.imageAlt ?? product.name}
            className="h-full w-full object-cover opacity-85 transition duration-500 ease-[cubic-bezier(0.6,0,0.3,1)] group-hover:scale-[1.035] group-hover:opacity-100"
            src={product.imageUrl}
          />
        ) : (
          <div className="flex h-full items-end bg-[linear-gradient(145deg,rgba(8,34,255,0.18),rgba(242,241,234,0.38)_40%,rgba(8,8,6,0.14))] p-4 font-serif text-[7rem] leading-none font-bold text-black/10">
            {product.name.slice(0, 1)}
          </div>
        )}
        <span className="absolute inset-0 bg-black/10 opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
      </div>
      <div className="grid grid-cols-[1fr_auto] gap-3 py-4">
        <h3 className="text-[1.4rem] leading-tight font-medium tracking-tight text-black">
          {product.name}
        </h3>
        <p className="font-mono text-[1.1rem] leading-tight text-black/55 tabular-nums">
          {product.price}
        </p>
      </div>
    </Link>
  );
}
