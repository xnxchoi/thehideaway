"use client";

import { Button } from "@/components/core/Button";
import { Link } from "@/components/core/Link/Link";
import { useFooterVisibility } from "@/components/Shells/Footer/footer-visibility";
import { useRPStore } from "@/providers/RP_Pro";
import type { ProductListing } from "@/lib/lost-commerce/queries";
import type { LostOrderMode } from "@/lib/lost-commerce/types";
import { useStoreCart } from "@/lib/lost-commerce/useStoreCart";

import { cn } from "@/lib/utils";
import {
  ArrowElbowDownRightIcon,
  ArrowsOutSimpleIcon,
  MagnifyingGlassIcon,
  PauseIcon,
  PlayIcon,
  SpeakerHighIcon,
  SpeakerXIcon,
  XIcon
} from "@phosphor-icons/react";
import { useLenis } from "lenis/react";
import { useReducedMotion } from "motion/react";
import * as m from "motion/react-m";
import dynamic from "next/dynamic";
import {
  type ComponentProps,
  type CSSProperties,
  type ReactNode,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState
} from "react";
import { createPortal } from "react-dom";
import { useTranslations } from "next-intl";
import {
  getLostCollectionTagState,
  getLostCollectionVideoState,
  type LostCollectionMotionState,
  lostCollectionTransition
} from "./collection-motion";
import {
  getCartAnnouncementChromeTransition,
  getCartChromeTransition
} from "./cart-frame";
import {
  getLostProductEvidenceSummary,
  getLostProductFallbackMark,
  getLostProductStoryImages
} from "./product-evidence-state";
import { getLostProductSectionMetaLabel } from "./product-section-state";
import { getLostProductListingPrice } from "./product-price-display";
import {
  getLostEntryElementState,
  getLostEntryTransition,
  lostEntryEase
} from "./entry-motion";
import { getLostHeroVideoUrl, shouldShowLostHeroVideoControls } from "./hero-media-state";
import {
  useCartOpen,
  useEntry,
  useScene,
  useSearch,
  useWatchVideo
} from "./page-status";
import {
  LOST_HERO_VIDEO_BUTTON_LABEL_CLASS,
  LOST_STATEMENT_CHROME_SAFE_CLASS
} from "./mobile-chrome-state";
import { CartOverlay } from "@lostinseoul/components/cart-overlay";
import { BlurredText } from "@lostinseoul/components/BlurredText";

const LostHeroScene = dynamic(
  () =>
    import("@lostinseoul/maisonderetail").then(
      (module) => module.LostHeroScene
    ),
  { ssr: false }
);

type ChromeLinkProps = ComponentProps<typeof Link> & {
  children: ReactNode;
};

export function FooterOverride() {
  useFooterVisibility("hide");
  const setFXFrameVisibility = useRPStore(
    (store) => store.setFXFrameVisibility
  );

  useEffect(() => {
    setFXFrameVisibility(false);
    return () => {
      setFXFrameVisibility(true);
    };
  }, [setFXFrameVisibility]);

  return null;
}

export function EntrySequence() {
  const phase = useEntry();
  return (
    <m.div
      animate={{ y: phase === "ready" || phase === "ending" ? "-100%" : "0%" }}
      aria-hidden
      className="pointer-events-none fixed inset-0 z-[1400] overflow-hidden bg-[var(--black)] text-[var(--white)]"
      data-lost-entry-loader
      data-lost-entry-loader-state={phase}
      initial={{ y: "0%" }}
      transition={{
        duration: phase === "ending" || phase === "ready" ? 1.35 : 0,
        ease: [0.6, 0, 0.3, 1]
      }}
    />
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
        pale
          ? "border-[oklch(from_var(--white)_l_c_h/0.15)]"
          : "border-[oklch(from_var(--black)_l_c_h/0.15)]"
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
        "font-sans text-[1.2rem] leading-none font-bold tracking-[0.24em] uppercase md:text-[1.6rem]",
        dark ? "text-[var(--fg)]" : "text-[var(--lost-hero-ink)]",
        "transition-colors duration-500 ease-[cubic-bezier(0.6,0,0.3,1)]",
        className
      )}
    >
      LOSTINSEOUL
    </span>
  );
}

export function Announcement({ children }: { children?: ReactNode }) {
  const { open } = useCartOpen();
  const entryPhase = useEntry();
  const t = useTranslations("LOSTINSEOUL");
  const announcementState =
    entryPhase === "ready"
      ? { opacity: open ? 0 : 1, y: open ? "-100%" : "0%" }
      : { opacity: 0, pointerEvents: "none" as const };

  return (
    <m.div
      animate={announcementState}
      className="relative z-40 border-b border-[oklch(from_var(--n-s-fg)_l_c_h_/_0.12)] bg-[oklch(from_var(--n-s-bg)_l_c_h_/_0.42)] px-4 py-4 text-center font-sans text-[1rem] leading-none tracking-[0.22em] text-[oklch(from_var(--n-s-fg)_l_c_h_/_0.7)] uppercase shadow-[0_1px_0_oklch(from_var(--n-s-fg)_l_c_h_/_0.05)_inset] backdrop-blur-xl"
      data-lost-announcement
      data-lost-entry-chrome
      initial={false}
      transition={
        entryPhase === "ready"
          ? getCartAnnouncementChromeTransition(open)
          : {
              duration: 1.25,
              ease: lostEntryEase
            }
      }
    >
      {children ?? t("home.announcement")}
    </m.div>
  );
}

type LostHeaderProps = {
  drops: Array<{ title: string; slug: string }>;
};

export function Header({ drops }: LostHeaderProps) {
  const { open: cartOpen } = useCartOpen();
  const entryPhase = useEntry();
  const t = useTranslations("LOSTINSEOUL");
  const productsLabel = t("home.products");
  const chromeState = getLostEntryElementState("chrome", entryPhase);
  const chromeTransition = getLostEntryTransition("chrome", entryPhase);
  const headerChromeState =
    entryPhase === "ready"
      ? {
          opacity: cartOpen ? 0 : 1,
          y: cartOpen ? "-100%" : "0%",

          pointerEvents: cartOpen ? "none" : "auto"
        }
      : chromeState;
  const headerChromeTransition =
    entryPhase === "ready"
      ? getCartChromeTransition(cartOpen)
      : chromeTransition;

  return (
    <m.header
      className="pointer-events-none sticky top-[7.6rem] z-[1003] mt-[4.4rem] h-0 px-4 pt-2 md:px-14 md:pt-3 lg:top-[4.9rem] lg:mt-0"
      data-lost-header
      initial={false}
    >
      <div
        className="relative z-10 flex items-start justify-end gap-4 lg:justify-between"
        data-lost-header-grid
      >
        <div className="hidden overflow-hidden lg:block">
          <m.nav
            animate={headerChromeState}
            className="pointer-events-auto flex gap-1"
            aria-label="LOSTINSEOUL"
            data-lost-entry-chrome
            initial={false}
            transition={headerChromeTransition}
          >
            <Link
              className={cn(
                "relative inline-flex min-h-16 items-center overflow-hidden rounded-[4px] border border-[var(--lost-hero-line)] bg-[var(--lost-hero-glass)] px-5 text-[1.2rem] leading-none font-medium text-[var(--lost-hero-ink)] backdrop-blur-md transition-colors duration-500 ease-[cubic-bezier(0.6,0,0.3,1)] before:absolute before:inset-y-0 before:left-0 before:w-0 before:bg-[var(--lost-hero-glass-hover)] before:transition-[width] before:duration-300 before:ease-[cubic-bezier(0.6,0,0.3,1)] hover:before:w-full focus-visible:before:w-full"
              )}
              href="/lostinseoul"
            >
              LOSTINSEOUL
            </Link>
            {drops.slice(0, 2).map((drop) => (
              <Link
                className={cn(
                  "relative inline-flex min-h-16 items-center overflow-hidden rounded-[4px] border border-[var(--lost-hero-line)] bg-[var(--lost-hero-glass)] px-5 text-[1.2rem] leading-none font-medium text-[var(--lost-hero-ink)] backdrop-blur-md transition-colors duration-500 ease-[cubic-bezier(0.6,0,0.3,1)] before:absolute before:inset-y-0 before:left-0 before:w-0 before:bg-[var(--lost-hero-glass-hover)] before:transition-[width] before:duration-300 before:ease-[cubic-bezier(0.6,0,0.3,1)] hover:before:w-full focus-visible:before:w-full"
                )}
                href={`/lostinseoul/collections/${drop.slug}`}
                key={drop.slug}
              >
                <span className={"relative z-10"}> {drop.title}</span>
              </Link>
            ))}
            <Link
              className={cn(
                "relative inline-flex min-h-16 items-center overflow-hidden rounded-[4px] border border-[var(--lost-hero-line)] bg-[var(--lost-hero-glass)] px-5 text-[1.2rem] leading-none font-medium text-[var(--lost-hero-ink)] backdrop-blur-md transition-colors duration-500 ease-[cubic-bezier(0.6,0,0.3,1)] before:absolute before:inset-y-0 before:left-0 before:w-0 before:bg-[var(--lost-hero-glass-hover)] before:transition-[width] before:duration-300 before:ease-[cubic-bezier(0.6,0,0.3,1)] hover:before:w-full focus-visible:before:w-full"
              )}
              href="#products"
            >
              {productsLabel}
            </Link>
          </m.nav>
        </div>

        <div className="min-w-0 overflow-hidden">
          <m.div
            animate={headerChromeState}
            className="pointer-events-auto flex min-w-0 justify-end gap-1"
            data-lost-header-actions
            data-lost-entry-chrome
            initial={false}
            transition={headerChromeTransition}
          >
            <Searchbar />
            <CartOverlay />
          </m.div>
        </div>
      </div>
      <LostHeaderLogo />
    </m.header>
  );
}

export { Header as HeaderComponent };

function LostHeaderLogo() {
  const { open: cartOpen } = useCartOpen();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return null;
  }

  return createPortal(
    <div
      className="pointer-events-auto fixed top-[var(--lost-logo-top)] left-1/2 z-[1004] flex items-center justify-center overflow-hidden"
      data-lost-entry-logo
    >
      <m.div
        animate={{
          opacity: cartOpen ? 0 : 1,
          y: cartOpen ? "-100%" : "0%",
          pointerEvents: cartOpen ? "none" : "auto"
        }}
        initial={false}
        transition={getCartChromeTransition(cartOpen)}
      >
        <Link aria-label="LOSTINSEOUL home" href="/lostinseoul">
          <LostBrandWord />
        </Link>
      </m.div>
    </div>,
    document.body
  );
}

function Searchbar() {
  const { query, setQuery } = useSearch();
  const t = useTranslations("LOSTINSEOUL.nav");
  const inputRef = useRef<HTMLInputElement | null>(null);
  const lenis = useLenis();
  const hasValue = query.trim().length > 0;

  return (
    <form
      action="#products"
      className="group/search grid min-h-16 w-16 grid-cols-[auto_1fr_auto] items-center overflow-hidden rounded-[4px] border border-[var(--lost-hero-line)] bg-[var(--lost-hero-glass)] text-[var(--lost-hero-ink)] backdrop-blur-md transition-[width,background-color,border-color,color] duration-500 ease-[cubic-bezier(0.6,0,0.3,1)] focus-within:w-[min(25rem,calc(100vw-11rem))] hover:bg-[var(--lost-hero-glass-hover)] md:w-[22rem] lg:w-[24rem]"
      onSubmit={(event) => {
        if (!lenis) return;
        event.preventDefault();
        lenis.scrollTo("#products");
      }}
      role="search"
    >
      <Button
        aria-label={t("search")}
        className="grid size-16 shrink-0 place-items-center border-0 bg-transparent p-0 text-foreground transition-colors duration-500 ease-[cubic-bezier(0.6,0,0.3,1)]"
        onClick={() => inputRef.current?.focus()}
        type="button"
      >
        <MagnifyingGlassIcon aria-hidden className="size-6" weight="regular" />
      </Button>
      <input
        aria-label={t("search")}
        className="h-full min-w-0 bg-transparent pr-3 text-[1.2rem] leading-none font-medium text-foreground outline-none placeholder:text-[var(--lost-hero-muted)] max-md:w-0 max-md:opacity-0 max-md:transition-[width,opacity] max-md:duration-500 max-md:ease-[cubic-bezier(0.6,0,0.3,1)] max-md:group-focus-within/search:w-full max-md:group-focus-within/search:opacity-100"
        onChange={(event) => setQuery(event.target.value)}
        placeholder={t("searchPlaceholder")}
        ref={inputRef}
        type="search"
        value={query}
      />
      {hasValue ? (
        <Button
          aria-label={t("clearSearch")}
          className="grid size-16 shrink-0 place-items-center border-0 bg-transparent p-0 text-muted-foreground transition-colors duration-300 ease-[cubic-bezier(0.6,0,0.3,1)] hover:text-[var(--lost-hero-ink)] max-md:size-12"
          onClick={() => {
            setQuery("");
            inputRef.current?.focus();
          }}
          type="button"
        >
          <XIcon aria-hidden className="size-5" weight="regular" />
        </Button>
      ) : null}
    </form>
  );
}

type HeroProps = {
  eyebrow?: string;
  imageUrl?: string | null;
  title?: string;
  videoUrl?: string | null;
};

export function Hero({ eyebrow, imageUrl, title, videoUrl }: HeroProps) {
  const { open: cartOpen } = useCartOpen();
  const { setOpen: setWatchVideo } = useWatchVideo();
  const entryPhase = useEntry();
  const onSceneReady = useScene();
  const t = useTranslations("LOSTINSEOUL");
  const collectionLabel = t("home.collection");
  const resolvedEyebrow = eyebrow ?? t("home.eyebrow");
  const productsLabel = t("home.products");
  const resolvedTitle = title ?? t("home.title");
  const watchLabel = t("actions.watchVideo");
  const yearLabel = t("home.year");
  const [videoOpen, setVideoOpen] = useState(false);
  const [videoTransitioning, setVideoTransitioning] = useState(false);
  const openTimerRef = useRef<number | null>(null);

  const heroVideoUrl = getLostHeroVideoUrl(videoUrl);
  const hasVideo = shouldShowLostHeroVideoControls(heroVideoUrl);

  const openVideo = useCallback(() => {
    if (!hasVideo) return;
    if (openTimerRef.current) window.clearTimeout(openTimerRef.current);
    setVideoTransitioning(true);
    setWatchVideo(true);
    openTimerRef.current = window.setTimeout(() => {
      setVideoOpen(true);
      openTimerRef.current = null;
    }, 600);
  }, [hasVideo, setWatchVideo]);
  const closeVideo = () => {
    if (openTimerRef.current) window.clearTimeout(openTimerRef.current);
    openTimerRef.current = null;
    setVideoOpen(false);
    setVideoTransitioning(false);
    setWatchVideo(false);
  };

  useEffect(() => {
    return () => {
      if (openTimerRef.current) window.clearTimeout(openTimerRef.current);
    };
  }, []);

  return (
    <section
      className="relative grid min-h-svh overflow-hidden bg-background"
      data-lost-video-transition={videoTransitioning ? "open" : "closed"}
    >
      <m.div
        animate={{
          opacity: entryPhase === "loading" ? 0.58 : 1,
          scale: entryPhase === "loading" ? 0.985 : 1,
          y: entryPhase === "loading" ? "18svh" : 0
        }}
        className="col-span-full row-span-full grid min-h-svh"
        data-lost-stage
        initial={false}
        transition={getLostEntryTransition("stage", entryPhase)}
      >
        <LostHeroScene
          imageUrl={imageUrl}
          cartOpen={cartOpen}
          onReady={onSceneReady}
          videoUrl={heroVideoUrl}
        />
      </m.div>
      <div
        aria-hidden
        className="pointer-events-none absolute -inset-20 [background-image:repeating-linear-gradient(0deg,transparent_0px,transparent_4px,white_5px),repeating-linear-gradient(90deg,transparent_0px,transparent_7px,white_8px)] opacity-[0.012] mix-blend-screen"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-56 bg-[linear-gradient(180deg,oklch(from_var(--white)_l_c_h_/_0.08),transparent)]"
      />

      <div className="pointer-events-none col-span-full row-span-full grid min-h-svh grid-rows-[1fr_auto_1fr] px-4 pt-32 pb-10 md:px-14 md:pt-36 md:pb-16">
        <div />
        <m.div
          animate={
            entryPhase === "loading"
              ? getLostEntryElementState("heroText", entryPhase)
              : videoTransitioning
                ? { opacity: 0, y: 0 }
                : {
                    opacity: [0.9, 0.68, 0.9],
                    pointerEvents: "auto",
                    y: [0, -5, 0]
                  }
          }
          className="grid grid-cols-2 items-center gap-4 font-sans text-[1.2rem] leading-none font-bold tracking-tight text-background uppercase md:grid-cols-4 md:px-6 md:text-[1.6rem]"
          initial={false}
          transition={
            videoTransitioning
              ? { duration: 0.8, ease: [0.6, 0, 0.3, 1] }
              : entryPhase === "loading"
                ? getLostEntryTransition("heroText", entryPhase)
                : {
                    delay: getLostEntryTransition("heroText", entryPhase).delay,
                    duration: 8,
                    ease: "easeInOut",
                    repeat: Infinity,
                    repeatType: "loop"
                  }
          }
        >
          <span className="text-foreground transition-colors duration-700 ease-[cubic-bezier(0.6,0,0.3,1)] [text-shadow:0_1px_24px_var(--lost-hero-halo)]">
            {resolvedTitle}
          </span>
          <span className="justify-self-end text-nav-foreground transition-colors duration-700 ease-[cubic-bezier(0.6,0,0.3,1)] [text-shadow:0_1px_18px_var(--lost-hero-halo)] md:justify-self-center">
            {resolvedEyebrow}
          </span>
          <span className="hidden justify-self-center text-nav-foreground transition-colors duration-700 ease-[cubic-bezier(0.6,0,0.3,1)] [text-shadow:0_1px_18px_var(--lost-hero-halo)] md:block">
            {collectionLabel}
          </span>
          <span className="hidden justify-self-end text-foreground transition-colors duration-700 ease-[cubic-bezier(0.6,0,0.3,1)] [text-shadow:0_1px_24px_var(--lost-hero-halo)] md:block">
            {yearLabel}
          </span>
        </m.div>
        {hasVideo ? (
          <m.button
            animate={
              videoTransitioning
                ? { opacity: 1, scale: 0, y: 0 }
                : {
                    scale: 1,
                    opacity: entryPhase === "loading" ? 0 : 1,
                    y: entryPhase === "loading" ? "7.5rem" : 0,
                    pointerEvents: entryPhase === "loading" ? "none" : "auto"
                  }
            }
            aria-label={watchLabel}
            className="pointer-events-auto absolute top-[calc(50%+2.45rem)] left-1/2 inline-flex -translate-x-1/2 -translate-y-1/2 items-center gap-1 rounded-[4px] border border-[var(--lost-hero-line)] bg-[var(--lost-hero-glass)] p-0 text-[1.2rem] leading-none font-medium text-[var(--lost-hero-ink)] shadow-[0_1.2rem_4.8rem_var(--lost-hero-halo)] backdrop-blur-xl transition-[color,background-color,border-color] duration-[800ms] ease-[cubic-bezier(0.6,0,0.3,1)] hover:bg-[var(--lost-hero-glass-hover)]"
            id="open-video-button"
            initial={false}
            onClick={openVideo}
            transition={getLostEntryTransition("heroButton", entryPhase)}
            type="button"
          >
            <span className="grid size-16 place-items-center rounded-[3px] border-r border-[var(--lost-hero-line)] bg-[oklch(from_var(--lost-hero-glass)_l_c_h_/_0.45)] backdrop-blur-xl transition-[background-color,border-color] duration-500 ease-[cubic-bezier(0.6,0,0.3,1)]">
              <ArrowsOutSimpleIcon
                aria-hidden
                className="size-6"
                weight="regular"
              />
            </span>
            <span className={LOST_HERO_VIDEO_BUTTON_LABEL_CLASS}>
              {watchLabel}
            </span>
          </m.button>
        ) : null}
        <m.div
          animate={
            videoTransitioning
              ? { opacity: 0, y: 0 }
              : getLostEntryElementState("heroButton", entryPhase)
          }
          className="grid items-end justify-items-center"
          data-hero-btn-container
          initial={false}
          transition={getLostEntryTransition("heroButton", entryPhase)}
        >
          <Link
            className="pointer-events-auto inline-grid grid-cols-[5.2rem_auto] items-center gap-3 rounded-[4px] border border-[var(--lost-hero-line)] bg-[var(--lost-hero-glass)] p-1.5 pr-5 text-[1.2rem] leading-none font-medium text-[var(--lost-hero-ink)] backdrop-blur-md transition-[color,background-color,border-color] duration-500 ease-[cubic-bezier(0.6,0,0.3,1)] hover:bg-[var(--lost-hero-glass-hover)]"
            href="#products"
          >
            <span className="block aspect-square overflow-hidden rounded-[3px] border border-[var(--lost-hero-line)] bg-[var(--lost-hero-glass)]">
              {imageUrl ? (
                <img
                  alt=""
                  aria-hidden
                  className="h-full w-full object-cover opacity-80 grayscale transition-transform duration-500 hover:scale-110"
                  src={imageUrl}
                />
              ) : null}
            </span>
            {productsLabel}
          </Link>
        </m.div>
      </div>

      {heroVideoUrl ? (
        <LostVideoPlayer
          onClose={closeVideo}
          open={videoOpen}
          src={heroVideoUrl}
        />
      ) : null}
    </section>
  );
}

function LostVideoPlayer({
  onClose,
  open,
  src
}: {
  onClose: () => void;
  open: boolean;
  src: string;
}) {
  const t = useTranslations("LOSTINSEOUL.video");
  const closeLabel = t("close");
  const muteLabel = t("mute");
  const pauseLabel = t("pause");
  const playLabel = t("play");
  const unmuteLabel = t("unmute");
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

  const lenis = useLenis();
  useEffect(() => {
    if (!open) return undefined;
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
        video.pause();
        setPlaying(false);
      };
    }

    return () => {
      document.removeEventListener("keydown", onKeyDown);
      lenis?.start();
      setPlaying(false);
    };
  }, [onClose, lenis, open]);

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
        "group fixed inset-0 z-[1250] grid h-dvh w-dvw bg-[oklch(from_var(--black)_l_c_h_/_0.9)] text-[var(--white)] opacity-0 backdrop-blur-[5px] transition-opacity duration-1000 ease-in-out",
        open ? "pointer-events-auto opacity-100" : "pointer-events-none"
      )}
      data-lost-video-player={open ? "open" : "closed"}
      data-lost-cursor-theme={open ? "light" : undefined}
      inert={!open}
      initial={false}
      transition={{ duration: 1, ease: "easeInOut" }}
    >
      <video
        aria-label={closeLabel}
        autoPlay={open}
        className="h-full w-full object-cover"
        loop
        muted={muted}
        onClick={onClose}
        onPause={() => setPlaying(false)}
        onPlay={() => setPlaying(true)}
        playsInline
        preload={open ? "auto" : "none"}
        ref={videoRef}
        src={open ? src : undefined}
      />
      <div
        className="pointer-events-none absolute bottom-0 left-0 h-fit w-fit p-4 md:p-8 lg:p-12"
        data-lost-video-interface
      >
        <Button
          aria-label={muted ? unmuteLabel : muteLabel}
          className="pointer-events-auto grid size-18 place-items-center rounded-[4px] border border-[oklch(from_var(--white)_l_c_h_/_0.1)] bg-[oklch(from_var(--white)_l_c_h_/_0.08)] p-0 text-[var(--white)] backdrop-blur-md transition-[opacity,background-color] duration-200 ease-in-out hover:bg-[oklch(from_var(--white)_l_c_h_/_0.13)]"
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
          className="pointer-events-auto grid size-18 place-items-center rounded-[4px] border border-[oklch(from_var(--white)_l_c_h_/_0.1)] bg-[oklch(from_var(--white)_l_c_h_/_0.08)] p-0 text-[var(--white)] backdrop-blur-md transition-[opacity,background-color] duration-200 ease-in-out hover:bg-[oklch(from_var(--white)_l_c_h_/_0.13)]"
          onClick={togglePlay}
          type="button"
        >
          {playing ? (
            <PauseIcon aria-hidden className="size-7" weight="regular" />
          ) : (
            <PlayIcon aria-hidden className="size-7" weight="regular" />
          )}
        </Button>
        <div className="pointer-events-none flex min-h-18 items-center rounded-[4px] border border-[oklch(from_var(--white)_l_c_h_/_0.1)] bg-[oklch(from_var(--white)_l_c_h_/_0.08)] px-4 font-sans text-[1.1rem] leading-none text-[var(--white)] tabular-nums backdrop-blur-md">
          {formatTime(currentTime)} / {formatTime(duration)}
        </div>
      </div>
    </m.div>
  );

  return mounted ? createPortal(player, document.body) : null;
}

export function Statement({ count, lede }: { count: number; lede: string }) {
  const t = useTranslations("LOSTINSEOUL.home");
  return (
    <section
      className={cn(
        "relative grid bg-[var(--lost-paper)] px-4 text-center text-[var(--lost-paper-ink)] md:px-14",
        LOST_STATEMENT_CHROME_SAFE_CLASS
      )}
    >
      <p className="mx-auto max-w-[89.4rem] text-[2.4rem] leading-[1.08] font-medium tracking-tight md:text-[3.8rem]">
        <BlurredText text={lede} />
      </p>
      <p className="mt-8 font-sans text-[1.1rem] leading-none tracking-[0.22em] text-[var(--lost-paper-muted)] uppercase">
        <BlurredText
          text={`${count.toString().padStart(2, "0")} ${t("objects")}`}
        />
      </p>
    </section>
  );
}

type LostProductSectionProps = {
  layout?: "collection" | "recommendations";

  products: ProductListing[];
};

export function ProductSection({
  layout = "collection",

  products
}: LostProductSectionProps) {
  const t = useTranslations("LOSTINSEOUL");
  const { count: cartCount } = useStoreCart();
  const incomingLabel = t("home.incoming"),
    standardModeLabel = t("modes.standard"),
    requestModeLabel = t("modes.request"),
    privateModeLabel = t("modes.private"),
    requestQuoteLabel = t("actions.requestQuote"),
    productsLabel = t("home.products"),
    emptyLabel = t("home.empty"),
    cartLabel = t("nav.cart"),
    searchLabel = t("nav.search"),
    searchPlaceholder = t("nav.searchPlaceholder"),
    searchResultsLabel = t("nav.searchResults"),
    searchNoResultsLabel = t("nav.searchNoResults"),
    viewProductLabel = t("actions.view");
  const { query } = useSearch();
  const searchQuery = layout === "recommendations" ? "" : query;
  const visibleProducts = useMemo(() => {
    const needle = searchQuery.trim().toLowerCase();
    if (!needle) return products;

    return products.filter((product) => {
      const searchable = [
        product.name,
        product.summary,
        product.displayPrice,
        getLostProductListingPrice(
          product.displayPrice,
          requestQuoteLabel,
          product.modes
        ),
        product.stockState,
        product.campaign?.title,
        ...product.modes
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return searchable.includes(needle);
    });
  }, [products, requestQuoteLabel, searchQuery]);
  const searching = searchQuery.trim().length > 0;
  const modeLabels: Record<LostOrderMode, string> = {
    private_order: privateModeLabel,
    request_to_order: requestModeLabel,
    standard_purchase: standardModeLabel
  };
  const gridCount = Math.min(Math.max(visibleProducts.length, 1), 5);
  const gridPushProduct =
    layout === "collection"
      ? (visibleProducts[1] ?? visibleProducts[0] ?? null)
      : null;
  const sectionMetaText = getLostProductSectionMetaLabel({
    cartCount,
    cartLabel,
    incomingLabel,
    productCount: visibleProducts.length,
    searchQuery,
    searchResultsLabel
  });

  return (
    <section
      id="products"
      className="relative grid scroll-mt-[12rem] gap-y-8 border-t border-[var(--lost-paper-line)] bg-[var(--lost-paper)] px-4 pt-14 pb-32 text-[var(--lost-paper-ink)] md:scroll-mt-[14rem] md:px-14 md:pt-20 md:pb-40"
    >
      <LostTopBar />
      <div className="grid gap-y-10">
        <div className="grid items-center gap-y-8 md:flex md:justify-between">
          <h2 className="font-sans text-[1.6rem] leading-none font-bold tracking-[0.08em] text-[var(--lost-paper-ink)] uppercase md:text-[2rem]">
            <BlurredText text={productsLabel} />
          </h2>
          <div className="hidden w-fit gap-1 md:flex">
            <Link
              aria-label={productsLabel}
              className="lost-frost-button lost-frost-button--icon"
              href="#products"
            >
              <ArrowElbowDownRightIcon
                aria-hidden
                className="size-7"
                weight="regular"
              />
            </Link>
            <Link className="lost-frost-button" href="#products">
              {productsLabel}
            </Link>
          </div>
        </div>
        <p className="justify-self-end font-sans text-[1.1rem] leading-none text-[var(--lost-paper-muted)]">
          <BlurredText text={sectionMetaText} />
        </p>
      </div>

      <div className="grid gap-y-8">
        {visibleProducts.length === 0 ? (
          <div className="grid">
            <LostEmptyProductCard
              emptyLabel={searching ? searchNoResultsLabel : emptyLabel}
              incomingLabel={searching ? searchLabel : incomingLabel}
              index={0}
            />
          </div>
        ) : (
          <div
            className={cn(
              "grid",
              layout === "collection"
                ? "lost-collection-product-grid gap-x-5 gap-y-10"
                : "grid-cols-1 gap-x-5 gap-y-[3.2rem] md:grid-cols-2 lg:min-h-[51.438rem] lg:grid-cols-3"
            )}
            data-lost-collection-grid-products-count={gridCount}
          >
            {visibleProducts.map((product, index) => (
              <div
                data-lost-collection-grid-products-product
                data-lost-collection-grid-products-product-second={index + 1}
                key={product.id}
              >
                <LostProductTile
                  modeLabels={modeLabels}
                  product={product}
                  requestQuoteLabel={requestQuoteLabel}
                  viewProductLabel={viewProductLabel}
                />
              </div>
            ))}
            {gridPushProduct ? (
              <div data-lost-collection-grid-products-push>
                <LostCollectionGridPush
                  href={`/lostinseoul/products/${gridPushProduct.slug}`}
                  imageUrl={gridPushProduct.imageUrl}
                  incomingLabel={incomingLabel}
                  price={getLostProductListingPrice(
                    gridPushProduct.displayPrice,
                    requestQuoteLabel,
                    gridPushProduct.modes
                  )}
                  productsLabel={productsLabel}
                  title={gridPushProduct.name}
                  viewProductLabel={viewProductLabel}
                />
              </div>
            ) : null}
          </div>
        )}
        <div className="flex justify-center md:hidden">
          <Link className="lost-frost-button" href="#products">
            <BlurredText
              interval={120}
              text={searching ? searchResultsLabel : productsLabel}
            />
          </Link>
        </div>
      </div>
    </section>
  );
}

function LostCollectionGridPush({
  href,
  imageUrl,
  incomingLabel,
  price,
  productsLabel,
  title,
  viewProductLabel
}: {
  href: string;
  imageUrl?: string | null;
  incomingLabel: string;
  price: string;
  productsLabel: string;
  title: string;
  viewProductLabel: string;
}) {
  return (
    <Link
      aria-label={`${viewProductLabel}: ${title}`}
      className="lost-collection-grid-push block-push group/push grid overflow-hidden rounded-[4px]"
      href={href}
    >
      <div className="col-span-full row-span-full grid">
        {imageUrl ? (
          <img
            alt=""
            aria-hidden
            className="h-full w-full object-cover"
            loading="lazy"
            src={imageUrl}
          />
        ) : (
          <span
            aria-hidden
            className="grid h-full place-items-center font-serif text-[16rem] leading-none font-bold text-[oklch(from_var(--white)_l_c_h_/_0.12)]"
          >
            {title.slice(0, 1)}
          </span>
        )}
      </div>
      <div
        aria-hidden
        className="col-span-full row-span-full bg-[linear-gradient(180deg,oklch(from_var(--black)_l_c_h_/_0.22),oklch(from_var(--black)_l_c_h_/_0.72))]"
      />
      <div className="z-2 col-span-full row-span-full grid content-between p-4 md:p-6">
        <div>
          <span className="lost-product-tag">
            <span>{incomingLabel}</span>
          </span>
        </div>
        <div className="grid gap-4">
          <div aria-hidden className="lost-top-bar lost-top-bar--pale" />
          <div className="flex items-end justify-between gap-6">
            <div className="grid gap-3">
              <p className="font-sans text-[1.1rem] leading-none tracking-[0.18em] text-[oklch(from_var(--white)_l_c_h_/_0.62)] uppercase">
                {productsLabel}
              </p>
              <h3 className="max-w-[42rem] font-sans text-[1.8rem] leading-none font-bold tracking-[0.05em] text-[var(--white)] uppercase md:text-[2.4rem]">
                {title}
              </h3>
            </div>
            <p className="font-sans text-[1.2rem] leading-none text-[oklch(from_var(--white)_l_c_h_/_0.72)] tabular-nums">
              {price}
            </p>
          </div>
        </div>
      </div>
    </Link>
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
    <div className="relative grid min-h-[21rem] content-between overflow-hidden rounded-[4px] border border-[var(--lost-paper-line)] bg-[oklch(from_var(--fg)_l_c_h_/_0.035)] p-5 md:min-h-[32rem] md:p-6">
      <LostTopBar />
      <div className="flex items-end justify-between gap-5">
        <div>
          <p className="font-sans text-[1rem] leading-none tracking-[0.2em] text-[var(--lost-paper-muted)] uppercase">
            {incomingLabel}
          </p>
          <p className="mt-3 max-w-[34rem] text-[1.6rem] leading-tight font-medium text-[var(--fg)] md:text-[1.9rem]">
            {emptyLabel}
          </p>
        </div>
        <span className="shrink-0 font-sans text-[1.1rem] leading-none text-[var(--lost-paper-muted)]">
          0{index + 1}
        </span>
      </div>
    </div>
  );
}

function LostProductTile({
  modeLabels,
  product,
  requestQuoteLabel,
  viewProductLabel
}: {
  modeLabels: Record<LostOrderMode, string>;
  product: ProductListing;
  requestQuoteLabel: string;
  viewProductLabel: string;
}) {
  const href = `/lostinseoul/products/${product.slug}`;
  const storyImages = getLostProductStoryImages(product);
  const evidenceSummary = getLostProductEvidenceSummary(product.summary);
  const displayPrice = getLostProductListingPrice(
    product.displayPrice,
    requestQuoteLabel,
    product.modes
  );
  const fallbackMark = getLostProductFallbackMark(product.name);
  const progressCount = Math.max(storyImages.length, 1);
  const [storyActiveIndex, setStoryActiveIndex] = useState(0);
  const [storyLeavingIndex, setStoryLeavingIndex] = useState<number | null>(
    null
  );
  const [storyProgress, setStoryProgress] = useState(0);
  const storyIntervalRef = useRef<number | null>(null);
  const storyTimeoutRef = useRef<number | null>(null);

  const stopStory = useCallback(() => {
    if (storyIntervalRef.current) {
      window.clearInterval(storyIntervalRef.current);
      storyIntervalRef.current = null;
    }
    if (storyTimeoutRef.current) {
      window.clearTimeout(storyTimeoutRef.current);
      storyTimeoutRef.current = null;
    }
    setStoryActiveIndex(0);
    setStoryLeavingIndex(null);
    setStoryProgress(0);
  }, []);

  const startStory = useCallback(() => {
    if (storyImages.length <= 1 || storyIntervalRef.current) return;

    const timerDuration = 2000;
    const startedAt = Date.now();

    storyIntervalRef.current = window.setInterval(() => {
      const elapsed = Date.now() - startedAt;
      setStoryProgress(Math.min(elapsed / timerDuration, 1));
    }, 100);
  }, [storyImages.length]);

  useEffect(() => {
    if (storyProgress < 1 || storyImages.length <= 1) return;

    const oldIndex = storyActiveIndex;
    const nextIndex = (storyActiveIndex + 1) % storyImages.length;

    if (storyIntervalRef.current) {
      window.clearInterval(storyIntervalRef.current);
      storyIntervalRef.current = null;
    }

    setStoryLeavingIndex(oldIndex);
    setStoryActiveIndex(nextIndex);
    setStoryProgress(0);

    storyTimeoutRef.current = window.setTimeout(() => {
      setStoryLeavingIndex(null);
    }, 800);

    if (nextIndex === 0) {
      storyTimeoutRef.current = window.setTimeout(() => {
        setStoryLeavingIndex(null);
        startStory();
      }, 800);
      return;
    }

    startStory();
  }, [startStory, storyActiveIndex, storyImages.length, storyProgress]);

  useEffect(
    () => () => {
      if (storyIntervalRef.current) {
        window.clearInterval(storyIntervalRef.current);
      }
      if (storyTimeoutRef.current) {
        window.clearTimeout(storyTimeoutRef.current);
      }
    },
    []
  );

  return (
    <article
      aria-label={product.name}
      className="group grid gap-y-[3.2rem]"
      data-product-card
    >
      <div
        className="lost-product-story grid max-w-full overflow-hidden rounded-[4px]"
        onBlur={stopStory}
        onFocus={startStory}
        onMouseEnter={startStory}
        onMouseLeave={stopStory}
      >
        <Link
          className="col-start-1 row-start-1 grid max-w-full overflow-hidden rounded-[4px]"
          data-story-image-link
          href={href}
        >
          <div className="col-span-full row-span-full overflow-hidden">
            {storyImages.length > 0 ? (
              <>
                <div className="relative hidden grid-cols-1 overflow-hidden lg:grid">
                  {storyImages.map((image, index) => (
                    <figure
                      aria-hidden={index !== storyActiveIndex}
                      className={cn(
                        "relative col-start-1 row-start-1",
                        index === storyActiveIndex && "is-visible is-z-2",
                        index === storyLeavingIndex && "is-hidden is-z-1"
                      )}
                      data-load-img
                      data-story-image-item-image={index + 1}
                      key={`${image.url}-${index}`}
                      role={index === 0 ? undefined : "presentation"}
                    >
                      <img
                        alt={index === 0 ? (image.alt ?? product.name) : ""}
                        className="aspect-[580/725] h-full w-full object-cover"
                        loading="lazy"
                        src={image.url}
                      />
                    </figure>
                  ))}
                </div>
                <figure
                  className="relative grid w-full max-w-[34.3rem] lg:hidden"
                  data-load-img
                >
                  <img
                    alt={storyImages[0]?.alt ?? product.name}
                    className="aspect-[343/428] h-full w-full object-cover"
                    loading="lazy"
                    src={storyImages[0]?.url}
                  />
                </figure>
              </>
            ) : (
              <div className="flex h-full items-end bg-[linear-gradient(145deg,oklch(from_var(--fg)_l_c_h_/_0.14),oklch(from_var(--bg)_l_c_h_/_0.38)_40%,oklch(from_var(--fg)_l_c_h_/_0.08))] p-4 font-serif text-[7rem] leading-none font-bold text-[oklch(from_var(--fg)_l_c_h_/_0.1)]">
                {fallbackMark}
              </div>
            )}
          </div>
          <div
            className="z-[3] col-start-1 row-start-1 grid content-start gap-y-[2.2rem] px-[1.6rem] pt-[2.4rem]"
            data-product-card-top-left
          >
            <div
              className="z-[3] grid gap-x-[1.2rem]"
              style={{
                gridTemplateColumns: `repeat(${progressCount}, minmax(0, 1fr))`
              }}
            >
              {Array.from({ length: progressCount }).map((_, index) => (
                <span
                  aria-hidden
                  className={cn(
                    "lost-product-progress-bar",
                    index === storyActiveIndex && "active",
                    index < storyActiveIndex && "is-complete"
                  )}
                  data-story-image-item-progress={index + 1}
                  key={index}
                  style={
                    {
                      "--progress":
                        index < storyActiveIndex
                          ? "100%"
                          : index === storyActiveIndex
                            ? `${storyProgress * 100}%`
                            : "0%"
                    } as CSSProperties
                  }
                />
              ))}
            </div>
            <div className="flex flex-wrap gap-[0.6rem] self-start justify-self-start">
              {product.modes.map((mode) => (
                <span
                  className="lost-product-tag"
                  key={`${product.id}-${mode}`}
                  role="presentation"
                >
                  <span>{modeLabels[mode]}</span>
                </span>
              ))}
            </div>
          </div>
        </Link>
        <Link
          className="lost-product-quick-panel col-start-1 row-start-1 self-end"
          data-product-card-quick-add
          href={href}
        >
          <span
            className="grid w-fit justify-center justify-items-center overflow-hidden"
            data-quick-add-inside
          >
            <span
              className="col-span-full row-span-full font-sans text-[2rem] leading-none font-medium text-[var(--black)] uppercase"
              data-quick-add-btn
            >
              {viewProductLabel}
            </span>
            <span
              className="col-span-full row-span-full flex gap-x-[1.2rem] font-sans text-[2rem] leading-none font-medium text-[var(--black)] uppercase"
              data-quick-add-form
            >
              {product.modes.map((mode) => (
                <span key={`${product.id}-quick-${mode}`}>
                  {modeLabels[mode]}
                </span>
              ))}
            </span>
          </span>
        </Link>
      </div>

      <div className="grid grid-cols-[auto_auto] justify-between gap-5">
        <div className="grid content-start gap-y-[2rem]">
          <h3 className="font-sans text-[2rem] leading-none font-normal text-[var(--lost-paper-ink)] uppercase">
            {product.name}
          </h3>
          {evidenceSummary ? (
            <p className="max-w-[34rem] text-[1.25rem] leading-snug text-[oklch(from_var(--fg)_l_c_h_/_0.68)] md:text-[1.35rem]">
              {evidenceSummary}
            </p>
          ) : null}
          <p
            aria-label={displayPrice}
            className="font-sans text-[2rem] leading-none text-[var(--lost-paper-muted)] tabular-nums"
            role="status"
          >
            {displayPrice}
          </p>
        </div>
        <div className="grid content-start gap-y-2">
          <Link
            aria-label={viewProductLabel}
            className="lost-frost-button lost-frost-button--icon justify-self-end"
            href={href}
          >
            <ArrowElbowDownRightIcon
              aria-hidden
              className="size-7"
              weight="regular"
            />
          </Link>
          <div className="flex gap-x-1 justify-self-end">
            {product.modes.slice(0, 3).map((mode) => (
              <Link
                aria-label={modeLabels[mode]}
                className="lost-product-swatch"
                href={href}
                key={`${product.id}-swatch-${mode}`}
              >
                <span aria-hidden data-mode={mode} />
              </Link>
            ))}
          </div>
        </div>
      </div>
    </article>
  );
}

const LOST_FOCUS_POSITIONS = [
  { left: "15%", top: "40%" },
  { left: "64%", top: "40%" },
  { left: "50%", top: "53%" },
  { left: "32%", top: "40%" },
  { left: "81%", top: "40%" }
];

function useLostUkiyoImage(imageUrl: string | null, wrapperClass: string) {
  const imageRef = useRef<HTMLImageElement | null>(null);
  const shouldReduceMotion = useReducedMotion();

  useEffect(() => {
    if (!imageUrl || shouldReduceMotion) return undefined;

    let cancelled = false;
    let parallax: { destroy: () => void } | null = null;

    void import("ukiyojs")
      .then(({ default: Ukiyo }) => {
        const image = imageRef.current;
        if (cancelled || !image) return;

        parallax = new Ukiyo(image, {
          scale: 1.2,
          speed: 1.2,
          wrapperClass,
          willChange: true
        });
      })
      .catch(() => undefined);

    return () => {
      cancelled = true;
      parallax?.destroy();
      parallax = null;
    };
  }, [imageUrl, shouldReduceMotion, wrapperClass]);

  return imageRef;
}

function LostFocusParallaxMedia({
  hasFocusProducts,
  imageUrl
}: {
  hasFocusProducts: boolean;
  imageUrl?: string | null;
}) {
  const imageRef = useLostUkiyoImage(imageUrl ?? null, "lost-focus-ukiyo");

  return (
    <figure className="lost-focus-media col-span-full row-span-full overflow-hidden">
      {imageUrl ? (
        <img
          alt=""
          className={cn(
            "ukiyo h-full w-full object-cover",
            !hasFocusProducts && "is-empty"
          )}
          loading="lazy"
          ref={imageRef}
          src={imageUrl}
        />
      ) : null}
    </figure>
  );
}

function LostCollectionPreviewFigure({
  active,
  imageUrl,
  leaving
}: {
  active: boolean;
  imageUrl?: string | null;
  leaving: boolean;
}) {
  const imageRef = useLostUkiyoImage(imageUrl ?? null, "lost-collection-ukiyo");
  const motionState: LostCollectionMotionState = active
    ? "active"
    : leaving
      ? "leaving"
      : "inactive";

  return (
    <m.figure
      animate={getLostCollectionVideoState(motionState)}
      className="lost-collection-video"
      data-collection-video
      initial={false}
      transition={lostCollectionTransition}
    >
      {imageUrl ? (
        <img
          alt=""
          aria-hidden
          className="ukiyo h-full w-full object-cover"
          loading="lazy"
          ref={imageRef}
          src={imageUrl}
        />
      ) : null}
    </m.figure>
  );
}

export function FeaturedProductSection({
  imageUrl,
  products
}: {
  imageUrl?: string | null;
  products: ProductListing[];
}) {
  const focusProducts = products.slice(0, 5);
  const hasFocusProducts = focusProducts.length > 0;
  const t = useTranslations("LOSTINSEOUL");
  const focusTitleLabel = t("home.focusTitle");
  const viewProductLabel = t("actions.view");
  const requestQuoteLabel = t("actions.requestQuote");
  return (
    <article
      aria-label={focusTitleLabel}
      className={cn(
        "lost-focus-section relative grid grid-cols-[1.6rem_auto_1.6rem] grid-rows-[2.4rem_1.5rem_auto_1.5rem_2.4rem] gap-y-4 bg-[var(--n-s-bg)] text-[var(--n-s-fg)] md:grid-cols-[7rem_auto_7rem] md:grid-rows-[3.2rem_1.5rem_auto_1.5rem_3.2rem] md:gap-y-8",
        !hasFocusProducts && "is-empty"
      )}
      data-lost-cursor-theme="light"
    >
      <LostFocusParallaxMedia
        hasFocusProducts={hasFocusProducts}
        imageUrl={imageUrl}
      />
      <div className="z-2 col-start-2 row-start-2">
        <LostTopBar pale />
      </div>
      <div className="relative z-2 col-start-2 row-start-3">
        <div className="grid min-h-[46rem] grid-cols-5 items-start gap-x-3 md:sticky md:top-[14rem] md:h-fit md:min-h-0 md:grid-cols-12 md:gap-x-5">
          <h3 className="col-span-4 self-start font-sans text-[1.3rem] leading-none font-bold tracking-[0.12em] text-[var(--n-s-fg)] uppercase md:text-[1.6rem]">
            <BlurredText text={focusTitleLabel} />
          </h3>
          <div
            className={cn(
              "col-span-full flex justify-between self-end md:col-span-5 md:col-start-8 md:self-start",
              !hasFocusProducts && "md:self-start"
            )}
          >
            <Link
              className="lost-frost-button lost-frost-button--icon"
              href="#products"
            >
              <ArrowElbowDownRightIcon
                aria-hidden
                className="size-7"
                weight="regular"
              />
            </Link>
            <Link className="lost-frost-button" href="/lostinseoul#products">
              {t("home.products")}
            </Link>
          </div>
        </div>
      </div>
      <div className="col-span-full row-span-full">
        {focusProducts.map((product, index) => (
          <div
            className="lost-focus-pin group/focus absolute z-[3] hidden h-12 w-12 items-center justify-center md:grid"
            key={product.id}
            style={LOST_FOCUS_POSITIONS[index]}
          >
            <Link
              aria-label={viewProductLabel}
              className="lost-focus-pin__target"
              href={`/lostinseoul/products/${product.slug}`}
            >
              <span />
            </Link>
            <div className="lost-focus-card">
              {product.imageUrl ? (
                <figure aria-hidden className="overflow-hidden rounded-[4px]">
                  <img
                    alt=""
                    className="aspect-260/147 w-[16.25rem] object-cover"
                    loading="lazy"
                    src={product.imageUrl}
                  />
                </figure>
              ) : null}
              <article aria-label={product.name}>
                <div className="flex items-start justify-between gap-3">
                  <h4 className="font-sans text-[1.2rem] leading-none font-bold tracking-[0.06em] text-black uppercase">
                    {product.name}
                  </h4>
                  <Link
                    aria-label={viewProductLabel}
                    className="lost-frost-button lost-frost-button--icon min-h-12! w-12! border-black/15! bg-black/5! text-black!"
                    href={`/lostinseoul/products/${product.slug}`}
                  >
                    <ArrowElbowDownRightIcon
                      aria-hidden
                      className="size-5"
                      weight="regular"
                    />
                  </Link>
                </div>
                <p className="mt-2 font-sans text-[1.2rem] leading-none text-[oklch(from_var(--black)_l_c_h_/_0.6)]">
                  {getLostProductListingPrice(
                    product.displayPrice,
                    requestQuoteLabel,
                    product.modes
                  )}
                </p>
              </article>
            </div>
          </div>
        ))}
      </div>
      {focusProducts.length > 0 ? (
        <div className="z-2 col-start-2 row-start-3 grid content-end gap-2 self-end md:hidden">
          {focusProducts.slice(0, 3).map((product) => (
            <Link
              className="lost-focus-mobile-card"
              href={`/lostinseoul/products/${product.slug}`}
              key={`${product.id}-mobile-focus`}
            >
              <span>{product.name}</span>
              <span>
                {getLostProductListingPrice(
                  product.displayPrice,
                  requestQuoteLabel,
                  product.modes
                )}
              </span>
            </Link>
          ))}
        </div>
      ) : null}
      <div className="z-2 col-start-2 row-start-4">
        <LostTopBar pale reverse />
      </div>
    </article>
  );
}

export function VideoCollections({
  drops,
  fallbackImageUrl,
  products
}: {
  drops: Array<{ title: string; slug: string; kicker?: string; lede?: string }>;
  fallbackImageUrl?: string | null;
  products: ProductListing[];
}) {
  const t = useTranslations("LOSTINSEOUL");
  const collectionsEyebrowLabel = t("home.collectionsEyebrow");
  const collectionsTitleLabel = t("home.collectionsTitle");

  const collectionItems =
    drops.length > 0
      ? drops.slice(0, 4).map((drop, index) => ({
          href: `/lostinseoul/collections/${drop.slug}`,
          imageUrl: products[index]?.imageUrl ?? products[0]?.imageUrl,
          title: drop.title
        }))
      : products.slice(0, 4).map((product) => ({
          href: `/lostinseoul/products/${product.slug}`,
          imageUrl: product.imageUrl,
          title: product.name
        }));
  const visibleCollectionItems =
    collectionItems.length > 0
      ? collectionItems
      : [
          {
            href: "#products",
            imageUrl: fallbackImageUrl,
            title: t("home.products")
          },
          {
            href: "#products",
            imageUrl: fallbackImageUrl,
            title: collectionsEyebrowLabel
          },
          {
            href: "#products",
            imageUrl: fallbackImageUrl,
            title: collectionsTitleLabel
          }
        ];
  const [activeIndex, setActiveIndex] = useState(0);
  const [previousIndex, setPreviousIndex] = useState<number | null>(null);
  const activeItem =
    visibleCollectionItems[activeIndex] ?? visibleCollectionItems[0];
  const activateCollection = (index: number) => {
    if (index === activeIndex) return;
    setPreviousIndex(activeIndex);
    setActiveIndex(index);
  };

  useEffect(() => {
    if (typeof previousIndex !== "number") return;

    const timeout = setTimeout(() => {
      setPreviousIndex(null);
    }, 1000);

    return () => clearTimeout(timeout);
  }, [previousIndex]);
  return (
    <section
      className="lost-collections-section grid gap-y-[3.2rem] bg-[var(--n-s-bg)] pt-[2.4rem] pb-[8rem] text-[var(--n-s-fg)] md:pt-[6.4rem] md:pb-[19.2rem] md:pl-[7rem]"
      data-lost-cursor-theme="light"
    >
      <div className="mx-4 md:mx-0 md:mr-[7rem]">
        <LostTopBar pale />
      </div>
      <div className="px-4 md:px-0">
        <span className="font-sans text-[1.4rem] leading-none font-bold tracking-[0.1em] text-[var(--n-s-fg)] uppercase">
          <BlurredText text={collectionsEyebrowLabel} />
        </span>
      </div>
      <div className="grid gap-x-5 gap-y-[1.6rem] md:grid-cols-12 md:grid-rows-2 md:gap-y-0">
        <div className="z-2 grid gap-y-[2.4rem] px-4 md:col-span-6 md:col-start-1 md:row-span-1 md:row-start-1 md:gap-y-[4rem] md:self-start md:px-0">
          <h2 className="max-w-[73rem] text-[3.6rem] leading-[0.98] font-medium tracking-tight text-[var(--n-s-fg)] md:text-[8rem]">
            <BlurredText text={collectionsTitleLabel} />
          </h2>
          <div className="flex w-fit gap-1">
            <Link
              aria-label={t("home.products")}
              className="lost-frost-button lost-frost-button--icon"
              href="#products"
            >
              <ArrowElbowDownRightIcon
                aria-hidden
                className="size-7"
                weight="regular"
              />
            </Link>
            <Link className="lost-frost-button" href="#products">
              {t("home.products")}
            </Link>
          </div>
        </div>

        <div className="z-2 flex gap-2 self-end overflow-x-auto px-4 pt-[4.6rem] md:col-span-6 md:col-start-1 md:row-span-1 md:row-start-2 md:px-0 md:pt-0">
          {visibleCollectionItems.map((item, index) => (
            <Button
              aria-label={item.title}
              className={cn(
                "lost-collection-thumb",
                index === activeIndex && "is-active"
              )}
              key={`${item.href}-${index}`}
              onClick={() => activateCollection(index)}
              type="button"
            >
              {item.imageUrl ? (
                <img alt="" aria-hidden src={item.imageUrl} />
              ) : null}
              <span
                aria-hidden
                className="lost-collection-thumb-label"
                data-collection-link-svg
              >
                {item.title}
              </span>
              <span
                aria-hidden
                className="lost-collection-thumb-enter"
                data-collection-link-icon
              >
                <ArrowElbowDownRightIcon className="size-7" weight="regular" />
              </span>
            </Button>
          ))}
        </div>

        <div className="lost-collection-preview col-span-full grid aspect-[375/281] md:row-span-full md:aspect-[801/700] md:h-[43.75rem] md:justify-self-end">
          {visibleCollectionItems.map((item, index) => (
            <LostCollectionPreviewFigure
              active={index === activeIndex}
              imageUrl={item.imageUrl}
              key={`${item.href}-${index}-preview`}
              leaving={index === previousIndex}
            />
          ))}
          {activeItem ? (
            <>
              <div className="lost-collection-tags">
                {visibleCollectionItems.map((item, index) => (
                  <m.div
                    animate={getLostCollectionTagState(
                      index === activeIndex
                        ? "active"
                        : index === previousIndex
                          ? "leaving"
                          : "inactive"
                    )}
                    className="lost-collection-tag"
                    initial={false}
                    key={`${item.href}-${index}-tag`}
                    transition={lostCollectionTransition}
                  >
                    <span className="lost-product-tag">{item.title}</span>
                  </m.div>
                ))}
              </div>
              <Link
                aria-label={activeItem.title}
                className="lost-collection-mobile-link lost-frost-button lost-frost-button--icon !bg-[var(--white)] !text-[var(--black)]"
                href={activeItem.href}
              >
                <ArrowElbowDownRightIcon
                  aria-hidden
                  className="size-7"
                  weight="regular"
                />
              </Link>
            </>
          ) : null}
          <div aria-hidden className="lost-video-mask-left" />
          <div aria-hidden className="lost-video-mask-right" />
          <div aria-hidden className="lost-video-mask-vertical" />
          <div aria-hidden className="lost-video-mask-horizontal-top" />
          <div aria-hidden className="lost-video-mask-horizontal-bottom" />
        </div>
      </div>
    </section>
  );
}
