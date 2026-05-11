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
import { Controlbar } from "../Controlbar";
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
          className="fixed bottom-0 z-239 flex w-[calc(24vw+40px)] items-end gap-0 text-nav-foreground outline-none max-md:h-[65vh] max-md:w-screen md:top-0"
          style={{
            borderTopRightRadius: borderTopRadius,
            borderTopLeftRadius: borderTopRadius,
            borderBottomRightRadius: borderBottomRadius,
            borderBottomLeftRadius: borderBottomRadius
          }}
        >
          {isNarrow && isTouch && <Drawer.Handle className={"absolute!"} />}
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
            className="z-239 flex h-[65vh] w-full flex-col bg-nav-background md:grid md:h-full md:w-[24vw] md:grid-cols-8 md:grid-rows-14 md:items-center md:justify-center md:gap-y-5"
            key={"drawer-body"}
            onMouseEnter={() => {
              setCursor(null);
              setCursorTheme("dark");
            }}
            onMouseLeave={() => {
              resetCursor();
            }}
          >
            {/* Title — top of column on mobile, grid cell row[2/3] on desktop */}
            <div className="flex flex-col justify-center px-6 pt-10 md:col-[2/8] md:row-[2/3] md:px-0 md:pt-0">
              <Drawer.Title
                className={"text-h3"}
                title={"Shortcuts"}
              ></Drawer.Title>
            </div>
            <AnimatePresence>
              {/* Links — fill the middle on mobile (scrollable if it overflows),
                grid cell row[3/10] on desktop */}
              {open && (
                <>
                  {" "}
                  <m.div className="flex-1 overflow-y-auto px-6 py-6 md:col-[2/8] md:row-[3/10] md:flex-none md:overflow-visible md:px-4 md:py-0">
                    <m.div className="flex flex-col gap-5 font-sans text-[23px]">
                      {sd.map((link) => (
                        <Link key={link.url} href={link.url}>
                          {link.label}
                        </Link>
                      ))}
                    </m.div>
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
          </m.div>
          <AnimatePresence>
            {isNarrow && isTouch ? (
              <Controlbar key={"ctrlbar-drawer"} />
            ) : (
              <SideNotch key={"notch-drawer"} sideDrawer={true} />
            )}
          </AnimatePresence>
        </Mrawer>
      </Drawer.Portal>
    </Drawer.Root>
  ) : null;
};
