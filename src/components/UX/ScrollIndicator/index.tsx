"use client";

import {
  MouseEventHandler,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState
} from "react";
import { useLenis } from "lenis/react";
import {
  useCursorAPI,
  useCursorStore,
  useMenu,
  useRPStore
} from "@/providers/RP_Pro";
import { gsap } from "gsap";
import { MorphSVGPlugin } from "gsap/MorphSVGPlugin";
import { cn } from "@/lib/utils";
import { useGSAP } from "@gsap/react";
import {
  LayoutType,
  PageType,
  useVoyageur
} from "@/stores/Routing/RP_Voyageur";
import * as m from "motion/react-m";
import { Variants } from "motion/react";
import { HA_CURS } from "@/stores/Cursor/CursorStore";
import { lerp } from "@/utilities/Helpers";

import { useWindowResize } from "@/utilities/use_window_resize";
import { useDomCursor } from "@/components/core/cursorWrapper";
import { Transition } from "motion";
import dynamic from "next/dynamic";
import { useShallow } from "zustand/shallow";

const SideDrawer = dynamic(
  () => import("../SideDrawer").then((mod) => mod.SideDrawer),
  { ssr: false }
);
gsap.registerPlugin(MorphSVGPlugin);
export const ScrollIndicator = () => {
  const [scroll, setScroll] = useState(0);
  const blobRef = useRef<SVGSVGElement>(null!);
  const pathRef = useRef<SVGPathElement>(null!);
  const scrollerRef = useRef<HTMLDivElement>(null!);
  const pageIsTransitioning = useRPStore(
    useShallow((l) => l.pageIsTransitioning)
  );
  const setCursor = useCursorStore(useShallow((r) => r.setCursorState));
  const lastResize = useWindowResize({
    debounce: 100,
    detectHeightChange: true
  });
  const navIsTransitioning = useRPStore(
    useShallow((r) => r.navIsTransitioning)
  );
  const navIsOpen = useRPStore(useShallow((r) => r.navIsOpen));
  const [showSidebar, setShowSidebar] = useState(
    !navIsTransitioning && !navIsOpen
  );
  const trackHeight = useRef(0);
  const lenis = useLenis();
  useEffect(() => {
    if (scrollTrack.current) {
      trackHeight.current = scrollTrack.current.clientHeight;
    }
  }, []);
  useEffect(() => {
    if (scrollTrack.current) {
      trackHeight.current = scrollTrack.current.clientHeight;
    }
  }, [lastResize]);
  const scrolle = useRef<HTMLDivElement>(null!);
  const mouseCoords = useCursorStore(useShallow((r) => r.mouseCoordinates));
  const { subscribe } = useCursorAPI();
  const unSub = useRef<() => void>(null!);

  const setBlobCoords = useCallback(({ x, y }: HA_CURS["mouseCoordinates"]) => {
    smoothCoordinates.current = {
      x: lerp(smoothCoordinates.current.x, x, 2),
      y: lerp(smoothCoordinates.current.y, y, 1.25)
    };

    gsap.to(blobRef.current, {
      y: y - 120,
      x: -12
    });
  }, []);

  const seekScroll = useCallback(
    ({ x, y }: { x: number; y: number }) => {
      if (!lenis) return;
      setBlobCoords({ x, y });
      const scrollUnit = lenis.limit;
      const scrollPercent = y / scrollTrack.current.clientHeight;
      const scrollValue = scrollUnit * scrollPercent;
      lenis?.scrollTo(scrollValue, {
        immediate: true
      });
    },
    [lenis, setBlobCoords]
  );
  const draggingRef = useRef(false);
  const hoveredRef = useRef(false);
  const [hovered, setHovered] = useState(false);
  const [dragging, setDragging] = useState(false);
  const smoothCoordinates = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  useEffect(() => {
    draggingRef.current = dragging;
  }, [dragging]);
  useEffect(() => {
    hoveredRef.current = hovered;
  }, [hovered]);
  useGSAP(
    () => {
      gsap.to(pathRef.current, {
        duration: 0.3,
        morphSVG: hovered
          ? "M26.58 80.5c-4.78 6.34-10.27 11.9-14.89 18.3-3.89 5.29-6.98 11.91-8.68 17.57C1.38 122.06.45 128.55.09 135.3c-.01.22-.02.43-.02.65l-.06 1.15v9.79c.01.38.04.76.06 1.15 0 .22.01.43.02.65.36 6.75 1.28 13.24 2.92 18.93 1.7 5.66 4.8 12.28 8.68 17.57 4.62 6.41 10.11 11.96 14.89 18.3l.13.17c13.38 16.72 15.9 36.06 16.29 55.97V24.34c-.39 19.91-2.91 39.24-16.29 55.97l-.13.17ZM43 24.1V4.58zm0-22.22v.08V0zm0 .08v.74zm0 277.46V259.9zm0 4.58v-1.96zm0-2v-.7.74z"
          : "M42.38 80.5c-.18 6.34-.39 11.9-.56 18.3-.15 5.29-.26 11.91-.33 17.57-.06 5.69-.1 12.18-.11 18.93v13.39c.01 6.75.05 13.24.11 18.93.06 5.66.18 12.28.33 17.57.18 6.41.38 11.96.56 18.3v.17c.51 16.72.61 36.06.62 55.97V24.34c-.01 19.91-.11 39.24-.62 55.97v.17ZM43 24.1V4.58zm0-22.22v.08V0zm0 .08v.74zm0 277.46V259.9zm0 4.58v-1.96zm0-2v-.7.74z"
      });
    },
    { dependencies: [hovered], scope: scrollerRef }
  );
  const onMouseEnter: MouseEventHandler = useCallback(
    (e) => {
      if (draggingRef.current) return;
      setCursor("FOCUS");
      setHovered(true);
      unSub.current && (unSub.current(), (unSub.current = null!));
      unSub.current = subscribe(
        (state) => state.mouseCoordinates,
        setBlobCoords
      );
    },
    [setBlobCoords, setHovered, setCursor, subscribe]
  );

  const onMouseDown: MouseEventHandler = useCallback(
    (e) => {
      e.preventDefault();
      setDragging(true);
      unSub.current && (unSub.current(), (unSub.current = null!));
      unSub.current = subscribe((state) => state.mouseCoordinates, seekScroll);
    },
    [seekScroll, setDragging, subscribe]
  );
  const onMouseUp: MouseEventHandler = useCallback(
    (e) => {
      e.preventDefault();
      setDragging(false);
      unSub.current && (unSub.current(), (unSub.current = null!));
    },
    [setDragging]
  );
  const onMouseLeave: MouseEventHandler = useCallback(
    (e) => {
      setHovered(false);
      setDragging(false);
      setCursor(null);
      (unSub.current && (unSub.current(), (unSub.current = null!)),
        gsap.killTweensOf(blobRef.current));
    },
    [setCursor, setHovered, setDragging]
  );
  const [trackk, setTrackk] = useState("idle");
  const trackTO = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    if (lenis) {
      lenis.on("scroll", (e) => {
        trackTO.current && clearTimeout(trackTO.current);
        setTrackk((r) => (r === "idle" ? "active" : r));
        setScroll(pageIsTransitioning ? 0 : e.progress * 100);
        trackTO.current = setTimeout(
          () => setTrackk((r) => (r === "active" ? "idle" : r)),
          1000
        );
      });
      return () => {
        lenis.off("scroll", (e) => {
          trackTO.current && clearTimeout(trackTO.current);
          setTrackk((r) => (r === "idle" ? "active" : r));
          setScroll(pageIsTransitioning ? 0 : e.progress * 100);
          trackTO.current = setTimeout(
            () => setTrackk((r) => (r === "active" ? "idle" : r)),
            1000
          );
        });
      };
    }
  }, [pageIsTransitioning, lenis, setScroll]);

  useGSAP(() => {
    const tovalue = pageIsTransitioning ? 0 : 1;
    gsap.to(scrolle.current, {
      autoAlpha: tovalue,
      scaleY: tovalue,
      duration: 0.2,
      ease: "power4.inOut"
    });
  }, [pageIsTransitioning]);

  const [show, setShow] = useState(true);
  const pageType = useVoyageur((l) => l.pageType);
  const scrollTrack = useRef<HTMLDivElement>(null!);
  const slug = useVoyageur((l) => l.slug);

  const setIsOpen = useRPStore((r) => r.setSideDrawerOpen);
  const isOpen = useRPStore((r) => r.sidebarOpen);

  const layoutType = useVoyageur((l) => l.layoutType);
  const pageTypeToShow = useMemo((): Partial<Record<PageType, boolean>> &
    Record<LayoutType, boolean | Partial<Record<PageType, boolean>>> => {
    return {
      archive: true,
      single: true,
      search: false,
      paginated: true,
      dynamic: true,
      account: false,
      users: true,
      "404": false,
      categories: true,
      albums: true,
      playlists: true,

      page: true
    };
  }, []);
  const setCursorTheme = useCursorStore((r) => r.setCursorTheme);
  const resetCursorTheme = useCursorStore((r) => r.resetCursorTheme);
  const setVisibility = useCallback(
    ({ layout, pageType }: { layout: LayoutType; pageType: PageType }) => {
      const pt0 = pageTypeToShow[pageType];
      const pt1 = pageTypeToShow[layout];
      if (typeof pt1 === "boolean") {
        typeof pt0 === "boolean" ? pt0 && pt1 : pt1;
      }
    },
    [pageTypeToShow]
  );
  useEffect(() => {
    setShow(
      !pageIsTransitioning &&
        !navIsTransitioning &&
        !navIsOpen &&
        layoutType === "page"
    );
  }, [pageIsTransitioning, navIsTransitioning, navIsOpen, layoutType]);
  const [enteredLeft, setEnteredLeft] = useState(false);
  const [enteredRight, setEnteredRight] = useState(false);
  const { right, left } = useMenu((r) => r.frames);
  const handlers = useDomCursor({});
  useEffect(() => {
    if (enteredLeft) {
      setCursorTheme("dark");
    } else {
      resetCursorTheme();
    }
  }, [enteredLeft, resetCursorTheme, setCursorTheme]);
  const sharedTransition: Transition = {
    ease: "easeInOut",
    duration: 0.2,
    type: "tween"
  };
  const trackVariants: Variants = useMemo(() => {
    return {
      dragging: {
        transition: { ...sharedTransition },
        right: right - 10,
        scaleX: 1.5
      },
      hovered: {
        transition: { ...sharedTransition },
        right: right - 10,
        scaleX: 1
      },
      idle: {
        transition: { ...sharedTransition },
        right: right - 10,
        scaleX: 1
      }
    };
  }, [right]);

  const blobVariants: Variants = {
    dragging: {
      transition: { ...sharedTransition },
      width: 40,
      opacity: 1
    },
    hovered: {
      transition: { ...sharedTransition },
      width: 40,
      opacity: 1
    },
    idle: {
      transition: { ...sharedTransition },
      width: 5,
      opacity: 0
    }
  };

  const [variantState, setVariantState] = useState<
    "sidebarOpen" | "idle" | "hidden"
  >("idle");
  useEffect(() => {
    if (!navIsOpen && isOpen) {
      setVariantState("sidebarOpen");
    } else if (right < 1 || navIsOpen) {
      setVariantState("hidden");
    } else {
      setVariantState("idle");
    }
  }, [navIsOpen, navIsTransitioning, isOpen, right]);
  const [trackedVariant, setTrackedVariant] = useState(
    dragging ? "dragging" : hovered ? "hovered" : "idle"
  );
  useEffect(() => {
    setTrackedVariant(dragging ? "dragging" : hovered ? "hovered" : "idle");
    trackTO.current && clearTimeout(trackTO.current);
    setTrackk((r) =>
      dragging ? "dragging" : hovered ? "hovered" : r === "active" ? r : "idle"
    );
    trackTO.current = setTimeout(
      () =>
        setTrackk((r) =>
          dragging
            ? "dragging"
            : hovered
              ? "hovered"
              : r === "active"
                ? r
                : "idle"
        ),
      1000
    );
  }, [dragging, hovered]);
  const leftNotchVariants = {
    sidebarOpen: {
      x: 0,
      transition: { duration: 1.2, ease: "easeOut", type: "tween" }
    },
    hidden: {
      x: "-100px",
      transition: { duration: 0.2, ease: "easeInOut", type: "tween" }
    },
    idle: {
      x: 0,
      transition: { duration: 1.2, ease: "easeOut", type: "tween" }
    }
  };
  return (
    <>
      {show && (
        <m.div
          key="scroller"
          className={cn(
            "fixed top-[10px] right-[-10px] bottom-[19px] z-[248] flex w-[60px] bg-transparent md:top-[50px] md:bottom-[50px]"
          )}
          ref={scrollerRef}
        >
          <m.div
            initial={{ opacity: 0, x: "+100%" }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: "+100%" }}
            transition={{ duration: 0.2, ease: "easeInOut", type: "tween" }}
            key={`scroller-${show}`}
            className={cn(
              "fixed top-0 right-0 bottom-0 z-[248] flex w-[10px] justify-center bg-transparent"
            )}
            ref={scrollTrack}
          >
            <m.div
              ref={scrolle}
              style={{ top: `${scroll}%` }}
              transition={{
                type: "spring",
                bounce: 0.25
              }}
              variants={{
                dragging: {
                  scaleX: 1.2,
                  opacity: 1,
                  zIndex: 251
                },
                hovered: {
                  scaleX: 1.1,
                  opacity: 1,
                  zIndex: 251
                },
                active: {
                  zIndex: 251,
                  opacity: 0.5
                },
                idle: {
                  zIndex: 150,
                  opacity: 0
                }
              }}
              animate={trackk}
              initial="idle"
              exit="idle"
              className="absolute h-[30px] w-[2px] origin-top rounded-[2px] bg-muted-faded-background"
            />
          </m.div>
          <m.span
            className="fixed top-0 right-[-2px] bottom-0 z-[248] h-full w-[20px] px-[20px]"
            onMouseEnter={onMouseEnter}
            onMouseLeave={onMouseLeave}
            onMouseDown={onMouseDown}
            onMouseUp={onMouseUp}
            variants={trackVariants}
            animate={trackedVariant}
            initial="idle"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 43 284"
              ref={blobRef}
              preserveAspectRatio={"none slice"}
              style={{
                position: "fixed",
                maxHeight: "200px",
                width: "35px",
                right: `${right - 13}px`,
                height: "auto"
              }}
            >
              <path
                ref={pathRef}
                d="M42.38 80.5c-.18 6.34-.39 11.9-.56 18.3-.15 5.29-.26 11.91-.33 17.57-.06 5.69-.1 12.18-.11 18.93v13.39c.01 6.75.05 13.24.11 18.93.06 5.66.18 12.28.33 17.57.18 6.41.38 11.96.56 18.3v.17c.51 16.72.61 36.06.62 55.97V24.34c-.01 19.91-.11 39.24-.62 55.97v.17ZM43 24.1V4.58zm0-22.22v.08V0zm0 .08v.74zm0 277.46V259.9zm0 4.58v-1.96zm0-2v-.7.74z"
              />
            </svg>
          </m.span>
        </m.div>
      )}
      <SideDrawer />
    </>
  );
};

/****
 * <m.div
        onMouseEnter={() => setEnteredLeft(true)}
        onMouseLeave={() => setEnteredLeft(false)}
        initial={{ x: '-100px' }}
        animate={leftNotchVariants[variantState]}
        exit={leftNotchVariants['hidden']}
        className="fixed flex h-auto md:h-[calc(100vh-100px)] top-0 md:top-auto left-[-20px] bg-transparent bottom-0 md:bottom-[20px] z-[248]" style={{
          filter: 'url(#goo-effect)'
        }} >  <span className="fixed w-[4rem] z-[248] bottom-0 md:bottom-[1.35rem] -top-[10px] md:top-[2rem] h-auto md:h-full bg-[oklch(var(--n-s-bg)/1)] -left-px md:left-[-2px]" />

          <m.div className="flex flex-col fixed gap-2.5 items-center justify-center bg-[oklch(var(--n-s-bg)/1)] px-[10px] py-[25px] bottom-[54px] left-[13.5px] rounded-r-[12px] min-w-fit min-h-fit h-[140px] w-[48px] z-[248] lg:scale-115"

          >
            <span onClick={toggleOpen} onMouseEnter={handlers.onMouseEnter} onMouseLeave={handlers.onMouseLeave} style={{ writingMode: 'sideways-rl' }} className="text-[oklch(var(--n-s-fg)/1)] text-[10px] font-bold">WORKS</span>
            <AnimatePresence initial={false} mode="sync">
              {hasRadio && <SoundBar />}
            </AnimatePresence>
 *         </m.div></m.div>    {/*<svg className="hidden" aria-hidden="true">  <defs>
 *
 *
 * */
