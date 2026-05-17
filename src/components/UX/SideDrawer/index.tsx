"use client";
import { useDomCursor } from "@/components/core/cursorWrapper";
import { Drawer } from "@/components/ui/vaul";
import { SPRING_EASE } from "@/constants/animations";
import { useIsMobile } from "@/providers/MiddleMan";
import { useHasRadio } from "@/providers/HideawayFM/hooks";
import { useCursor, useRPStore } from "@/providers/RP_Pro";
import { useWindowResize } from "@/utilities/use_window_resize";
import {
  AnimatePresence,
  MotionValue,
  useMotionValue,
  useSpring,
  useTransform
} from "motion/react";
import * as m from "motion/react-m";
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type ReactNode,
  useMemo
} from "react";
import { useShallow } from "zustand/shallow";
import {
  AccountView,
  NotificationsView,
  SearchView
} from "../../Shells/Controlbar/views";
import { Link } from "@/components/core/Link/Link";
import { SIDE_DRAWER_LINKS } from "@/constants/navigation";
import { DrawerPlayer } from "@/components/UX/TapePlayer";
import { SideNotch } from "../SideNotch";

export const SIDE_DRAWER = {
  MOBILE: {
    width: "100vw",
    height: "65vh",
    direction: "bottom"
  },
  DESKTOP: {
    width: "24vw",
    height: "100vh",
    direction: "left"
  }
};
const MotionDrawerContent = m.create(Drawer.Content);

export const SideVaul = (props: { children: ReactNode }) => {
  const [open, setOpen] = useState(false);
  const toggleSideDrawer = useCallback(() => {
    setOpen((r) => !r);
  }, []);
  const width = useMotionValue("100vw");
  const widthMotion = useSpring(width, {
    ...SPRING_EASE.power3.out,
    visualDuration: 0.5
  });
  const height = useMotionValue("100vh");
  const heightMotion = useSpring(height, {
    ...SPRING_EASE.power3.out,
    visualDuration: 0.5
  });
  const [snapPoints, setSnapPoints] = useState<Array<string | number>>([]);
  const [direction, setDirection] = useState<
    "bottom" | "left" | "top" | "right" | undefined
  >(
    SIDE_DRAWER[window.innerWidth < 768 ? "MOBILE" : "DESKTOP"].direction as
      | "bottom"
      | "left"
      | "top"
      | "right"
      | undefined
  );
  const setCursorTheme = useCursor((r) => r.setCursorTheme);
  const resetCursor = useCursor((r) => r.resetCursorTheme);
  const setCursor = useCursor((r) => r.setCursorState);
  const { onMouseEnter, onMouseLeave } = useDomCursor({
    enterCondition: () => "CLOSE",
    onEnter: (e) => setCursorTheme("dark"),
    onLeave: (e) => resetCursor()
  });
  const lastResize = useWindowResize({
    debounce: 50,
    detectHeightChange: false,
    detectVisibilityChange: false
  });
  const { isMobile } = useIsMobile();
  useEffect(() => {
    if (isMobile) {
      setDirection("bottom");
      widthMotion.set(window.innerWidth + "px");
      heightMotion.set(window.innerHeight * 0.75 + "px");
    } else {
      setDirection("left");
      widthMotion.set(window.innerWidth * 0.25 + "px");
      heightMotion.set(window.innerHeight + "px");
    }
  }, [heightMotion, isMobile, lastResize, widthMotion]);
  const lastOpen = useRef(open);
  const lastRelease = useRef(0);
  const onOpenChange = useCallback((o: boolean) => {
    if (o !== lastOpen.current) {
      setOpen(o);
    }
    lastOpen.current = o;
  }, []);
  const shortcutListenerCallback = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpen(false);
      } else if ((e.ctrlKey || e.metaKey) && (e.key === "d" || e.key === "D")) {
        toggleSideDrawer();
      }
    },
    [toggleSideDrawer]
  );
  useEffect(() => {
    document.addEventListener("keydown", shortcutListenerCallback, {
      passive: true
    });
    return () => {
      document.removeEventListener("keydown", shortcutListenerCallback);
    };
  }, [shortcutListenerCallback]);
  useEffect(() => {
    !open && (setCursor(null), resetCursor());
  }, [open, setCursor, resetCursor]);
  <Drawer.Root
    snapPoints={snapPoints}
    defaultOpen={false}
    open={open}
    disablePreventScroll={true}
    modal={open}
    direction={direction}
    onOpenChange={onOpenChange}
  >
    <Drawer.Portal>
      <AnimatePresence mode="wait">
        {open &&
          (isMobile ? (
            <div
              onClick={() => {
                setOpen(false);
              }}
              className="fixed inset-0 z-[39] bg-nav-background/50 backdrop-blur-sm"
            />
          ) : (
            <div
              onClick={() => {
                setOpen(false);
              }}
              onMouseEnter={onMouseEnter}
              onMouseLeave={onMouseLeave}
              className="fixed inset-0 z-[39] bg-nav-background/50 backdrop-blur-sm"
            />
          ))}
        <MotionDrawerContent
          style={{
            width: widthMotion,
            height: heightMotion
          }}
        >
          {isMobile && <Drawer.Handle />}
        </MotionDrawerContent>
      </AnimatePresence>
    </Drawer.Portal>
  </Drawer.Root>;
};
const Mrawer = m.create(Drawer.Content);
export const SideDrawer = () => {
  const setSnapPoint = useRPStore((r) => r.setActiveSnapPoint);
  const snapPoints = useRPStore(useShallow((r) => r.snapPoints));
  const snapPoint = useRPStore(useShallow((r) => r.activeSnapPoint));
  const isOpen = useRPStore(useShallow((r) => r.sideDrawerRendered));
  const open = useRPStore(useShallow((r) => r.sidebarOpen));
  const setSideDrawerOpen = useRPStore((r) => r.setSideDrawerOpen);
  const setIsDraggingSideDrawer = useRPStore((r) => r.setIsDraggingSideDrawer);
  const toggleSideDrawer = useRPStore((r) => r.toggleSideDrawer);
  const lastResize = useWindowResize({
    debounce: 50,
    detectHeightChange: true,
    detectVisibilityChange: false
  });
  const setCursor = useCursor((r) => r.setCursorState);
  const hasRadio = useHasRadio();
  // Drawer docks to bottom below the md breakpoint (768px) to align with
  // its CSS (`max-md:` classes). This is distinct from the global `isMobile`
  // (< 640px), which other components depend on.
  const { isMobile: isNarrow, isTouch } = useIsMobile();
  const [direction, setDirection] = useState<
    "bottom" | "left" | "top" | "right" | undefined
  >(isNarrow ? "bottom" : "left");
  useEffect(() => {
    setDirection(isNarrow ? "bottom" : "left");
  }, [isNarrow]);

  const setCursorTheme = useCursor((r) => r.setCursorTheme);
  const resetCursor = useCursor((r) => r.resetCursorTheme);
  const { onMouseEnter, onMouseLeave } = useDomCursor({
    enterCondition: () => "CLOSE",
    onEnter: (e) => setCursorTheme("dark"),
    onLeave: (e) => resetCursor()
  });
  const lastOpen = useRef(open);

  const lastRelease = useRef(0);
  const onOpenChange = useCallback(
    (o: boolean) => {
      if (o !== lastOpen.current) {
        setSideDrawerOpen(o);
      }
      lastOpen.current = o;
    },
    [setSideDrawerOpen]
  );

  useEffect(() => {
    const shortcutListenerCallback = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setSideDrawerOpen(false);
      } else if ((e.ctrlKey || e.metaKey) && (e.key === "b" || e.key === "B")) {
        toggleSideDrawer();
      }
    };
    if (!isNarrow) {
      document.addEventListener("keydown", shortcutListenerCallback, {
        passive: true
      });
    }
    return () => {
      document.removeEventListener("keydown", shortcutListenerCallback);
    };
  }, [isNarrow, setSideDrawerOpen, toggleSideDrawer]);
  const [doo, setDoo] = useState(false);
  const mobileValue = useMotionValue(isNarrow);
  useEffect(() => {
    mobileValue.set(isNarrow);
  }, [isNarrow, mobileValue]);
  const sidebarStateValue = useMotionValue(open);
  useEffect(() => {
    sidebarStateValue.set(open);
  }, [open, sidebarStateValue]);
  const borderTopRad = useTransform((): number => {
    const mb = mobileValue.get(),
      op = sidebarStateValue.get();
    if (mb) {
      return op ? 16 : 0;
    } else {
      return 16;
    }
  });
  const sd = useMemo(() => SIDE_DRAWER_LINKS, []);
  const controlbarView = useRPStore(useShallow((r) => r.controlbarView));
  const setControlbarView = useRPStore((r) => r.setControlbarView);
  // When the drawer closes, reset the view so reopening from outside
  // (or from a different surface) starts at the default nav links.
  useEffect(() => {
    if (!open && controlbarView !== "default") {
      setControlbarView("default");
    }
  }, [open, controlbarView, setControlbarView]);
  const borderTopRadius = useSpring(borderTopRad, {
    ...SPRING_EASE.power2.out,
    stiffness: 1000,
    damping: 40,
    visualDuration: 0.5
  });
  const borderBottomRad = useTransform((): number => {
    const mb = mobileValue.get(),
      op = sidebarStateValue.get();
    if (mb) {
      return 16;
    } else {
      return 16;
    }
  });
  const borderBottomRadius = useSpring(borderBottomRad, {
    ...SPRING_EASE.power2.out,
    stiffness: 1000,
    damping: 40,
    visualDuration: 0.5
  });

  useEffect(() => {
    setDoo(snapPoints.length > 0);
  }, [snapPoints]);
  useEffect(() => {
    !open && (setCursor(null), resetCursor());
  }, [open, setCursor, resetCursor]);

  // Hard scroll lock while the drawer is open on touch-mobile.
  // touchmove-only — `preventDefault` on touchstart on iOS suppresses
  // the synthetic click chain (kills tap handlers). Vaul's own
  // `[data-vaul-drawer] { touch-action: none }` is the primary scroll
  // suppressor; this listener catches gestures that begin inside an
  // allowlisted region and then drift outside it.
  useEffect(() => {
    if (!open || !isNarrow || !isTouch) return;
    const isAllowed = (target: EventTarget | null) => {
      let el = target as HTMLElement | null;
      while (el && el !== document.body) {
        if (el.hasAttribute("data-allow-scroll")) return true;
        const tag = el.tagName;
        if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT")
          return true;
        el = el.parentElement;
      }
      return false;
    };
    const block = (e: TouchEvent) => {
      if (isAllowed(e.target)) return;
      e.preventDefault();
    };
    document.addEventListener("touchmove", block, { passive: false });
    return () => document.removeEventListener("touchmove", block);
  }, [open, isNarrow, isTouch]);
  return doo ? (
    <Drawer.Root
      snapPoints={snapPoints}
      activeSnapPoint={snapPoint}
      setActiveSnapPoint={setSnapPoint}
      open={isOpen}
      onOpenChange={onOpenChange}
      defaultOpen={true}
      snapToSequentialPoint={true}
      modal={false}
      direction={direction}
      onDrag={(e) => {
        setIsDraggingSideDrawer(true);
      }}
      onRelease={(e) => {
        setIsDraggingSideDrawer(false);
        lastRelease.current = e.timeStamp;
      }}
    >
      <Drawer.Portal>
        {open && (
          <div
            onMouseEnter={onMouseEnter}
            onClick={() => {
              setSideDrawerOpen(false);
            }}
            onMouseLeave={onMouseLeave}
            className="fixed inset-0 z-39 bg-nav-background/50 backdrop-blur-sm"
          />
        )}
        <Mrawer
          data-tour="side-drawer"
          className="fixed bottom-0 z-239 flex w-[calc(24vw+40px)] items-end gap-0 text-nav-foreground outline-none max-md:h-[65dvh] max-md:w-screen md:top-0"
          style={{
            borderTopRightRadius: borderTopRadius,
            borderTopLeftRadius: borderTopRadius,
            borderBottomRightRadius: borderBottomRadius,
            borderBottomLeftRadius: borderBottomRadius
          }}
        >
          {/* Designated drag-to-close zone on touch-mobile. The Drawer
              body is marked `data-vaul-no-drag` below so Vaul ignores
              drags started anywhere except here — without this, any
              swipe-down on the drawer (including over a scrollable
              list) closed the drawer unintentionally. */}
          {isNarrow && isTouch && (
            <Drawer.Handle
              className={
                "absolute! top-[10px] left-1/2 z-[240] my-0! h-[5px]! w-[44px]! -translate-x-1/2 rounded-full bg-nav-foreground/70!"
              }
            />
          )}
          {open && (
            <m.div
              key={"drawer-backdrop"}
              onClick={() => {
                setSideDrawerOpen(false);
              }}
              onMouseEnter={onMouseEnter}
              onMouseLeave={onMouseLeave}
              className="absolute inset-0 z-238 bg-transparent"
            />
          )}
          {/*
            Inner shell.
            - Mobile (< md, 768): flex-col, content scrolls in the middle,
              DrawerPlayer pinned to the bottom. The wide-short bottom-sheet
              shape makes the desktop 8×14 grid look broken (title cramped,
              player crushed); flex-col fits the shape natively.
            - Desktop (≥ md): original 8×14 grid, kept intact.
          */}
          <m.div
            // `data-vaul-no-drag` opts the inner shell out of Vaul's
            // drag-to-dismiss tracking. Only the top `Drawer.Handle`
            // above remains draggable, so a touch on a list item or
            // an idle region of the drawer body can't accidentally
            // close it. Native list scrolling is unaffected.
            data-vaul-no-drag
            className="z-239 flex h-[65dvh] w-full flex-col bg-nav-background max-md:pt-7 max-md:pb-[calc(env(safe-area-inset-bottom)+88px)] md:grid md:h-full md:w-[24vw] md:grid-cols-8 md:grid-rows-14 md:items-center md:justify-center md:gap-y-5"
            key={"drawer-body"}
            onMouseEnter={() => {
              setCursor(null);
              setCursorTheme("dark");
            }}
            onMouseLeave={() => {
              resetCursor();
            }}
          >
            {/* Title — only on desktop (mobile views provide their own headers) */}
            <div className="hidden flex-col justify-center px-6 pt-10 md:col-[2/8] md:row-[2/3] md:flex md:px-0 md:pt-0">
              <Drawer.Title
                className={"text-h3"}
                title={"Shortcuts"}
              ></Drawer.Title>
            </div>
            {/* On mobile we need an a11y title even when visually hidden */}
            <Drawer.Title className="sr-only md:hidden">Menu</Drawer.Title>
            <AnimatePresence>
              {open && (
                <>
                  {/* Middle slot — view-driven on mobile, links on desktop.
                      Default mobile view = nav links (parity with desktop). */}
                  <m.div
                    // `data-allow-scroll` opts this subtree out of the
                    // document-level touchmove guard above, so the
                    // notifications / links lists inside can still
                    // scroll natively on touch.
                    data-allow-scroll
                    className="flex-1 overflow-hidden md:col-[2/8] md:row-[3/10] md:flex-none md:overflow-visible md:px-4 md:py-0"
                    key="drawer-middle"
                  >
                    {isNarrow && isTouch ? (
                      <AnimatePresence mode="wait" initial={false}>
                        {controlbarView === "notifications" ? (
                          <NotificationsView key="v-notif" />
                        ) : controlbarView === "search" ? (
                          <SearchView key="v-search" />
                        ) : controlbarView === "account" ? (
                          <AccountView key="v-account" />
                        ) : (
                          <DefaultLinks key="v-default" links={sd} />
                        )}
                      </AnimatePresence>
                    ) : (
                      <m.div className="flex flex-col gap-5 px-8 py-6 font-sans text-[23px] md:px-0 md:py-0">
                        {sd.map((link) => (
                          <Link key={link.url} href={link.url}>
                            {link.label}
                          </Link>
                        ))}
                      </m.div>
                    )}
                  </m.div>
                  {/* DrawerPlayer — gated on `open` so it doesn't run audio-reactive
                code or mount the radio session while the drawer is closed.
                AnimatePresence keeps the close animation tidy. */}
                  {hasRadio && (
                    <m.div
                      key={"radio-ui-drawer"}
                      className="border-t border-border/10 md:col-span-full md:row-[11/14] md:border-t-0"
                      initial={{ opacity: 0, y: 12 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 12 }}
                      transition={{ duration: 0.18 }}
                    >
                      <DrawerPlayer />
                    </m.div>
                  )}
                </>
              )}
            </AnimatePresence>
            {/* Controlbar is mounted at the layout root (see
                `(frontend)/layout.tsx`) and floats over the drawer at
                z-[249] so it stays visible regardless of drawer / menu
                state. Nothing to render here. */}
          </m.div>
          {!(isNarrow && isTouch) && (
            <AnimatePresence>
              <SideNotch key={"notch-drawer"} sideDrawer={true} />
            </AnimatePresence>
          )}
        </Mrawer>
      </Drawer.Portal>
    </Drawer.Root>
  ) : null;
};

const defaultLinksContainer = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.045, delayChildren: 0.08 }
  }
};
const defaultLinksItem = {
  hidden: { opacity: 0, y: 10 },
  show: {
    opacity: 1,
    y: 0,
    transition: { type: "spring", bounce: 0.18, duration: 0.5 }
  }
};

const DefaultLinks = ({
  links
}: {
  links: { url: string; label: string }[];
}) => (
  <m.div
    variants={defaultLinksContainer}
    initial="hidden"
    animate="show"
    exit={{ opacity: 0 }}
    className="flex h-full flex-col gap-5 overflow-y-auto px-8 pt-4 pb-8 font-sans text-[23px]"
  >
    {links.map((link) => (
      <m.div key={link.url} variants={defaultLinksItem}>
        <Link href={link.url}>{link.label}</Link>
      </m.div>
    ))}
  </m.div>
);
