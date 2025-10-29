"use client";
import { useDomCursor } from "@/components/core/cursorWrapper";
import { Drawer } from "@/components/vaul";
import { springGSAP } from "@/constants/animations";
import { useIsMobile } from "@/providers/MiddleMan";
import { useRadioStore } from "@/providers/RadioProvider";
import { useCursor, useRPStore } from "@/providers/RP_Pro";
import { useWindowResize } from "@/utilities/use_window_resize";
import { useMotionValue, useSpring } from "motion/react";
import * as m from "motion/react-m";
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type ReactNode
} from "react";
import { useShallow } from "zustand/shallow";
import { Controlbar } from "../Controlbar";
import { Link } from "../Link/Link";
import { RP_FM } from "../Radio/RP_FM";
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
    ...springGSAP.power3.out,
    visualDuration: 0.5
  });
  const height = useMotionValue("100vh");
  const heightMotion = useSpring(height, {
    ...springGSAP.power3.out,
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
      {open &&
        (isMobile ? (
          <div
            onClick={() => {
              setOpen(false);
            }}
            className="fixed inset-0 z-[39] bg-[oklch(var(--n-s-bg)/0.5)] backdrop-blur-sm"
          />
        ) : (
          <div
            onClick={() => {
              setOpen(false);
            }}
            onMouseEnter={onMouseEnter}
            onMouseLeave={onMouseLeave}
            className="fixed inset-0 z-[39] bg-[oklch(var(--n-s-bg)/0.5)] backdrop-blur-sm"
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
    detectHeightChange: false,
    detectVisibilityChange: false
  });
  const { isMobile } = useIsMobile();
  const setCursor = useCursor((r) => r.setCursorState);
  const hasRadio = useRadioStore(useShallow((r) => r.hasRadio));
  const [direction, setDirection] = useState<
    "bottom" | "left" | "top" | "right" | undefined
  >(isMobile ? "bottom" : "left");

  useEffect(() => {
    console.log("vaul direction!", isMobile ? "bottom" : "left");
    setDirection(isMobile ? "bottom" : "left");
  }, [isMobile, lastResize]);

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
    if (!isMobile) {
      document.addEventListener("keydown", shortcutListenerCallback, {
        passive: true
      });
    }
    return () => {
      document.removeEventListener("keydown", shortcutListenerCallback);
    };
  }, [isMobile, setSideDrawerOpen, toggleSideDrawer]);
  const [doo, setDoo] = useState(false);
  const borderTopRad = useMotionValue(16);
  const borderTopRadius = useSpring(borderTopRad, {
    ...springGSAP.power2.out,
    stiffness: 1000,
    damping: 40,
    visualDuration: 0.5
  });
  const borderBottomRad = useMotionValue(16);
  const borderBottomRadius = useSpring(borderBottomRad, {
    ...springGSAP.power2.out,
    stiffness: 1000,
    damping: 40,
    visualDuration: 0.5
  });
  useEffect(() => {
    if (!isMobile) return;
    if (open) {
      borderTopRad.set(16);
      borderBottomRad.set(16);
    } else {
      borderTopRad.set(0);
      borderBottomRad.set(16);
    }
  }, [borderBottomRad, borderTopRad, isMobile, open]);
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
      modal={open}
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
            onMouseLeave={onMouseLeave} className="fixed inset-0 z-39 bg-[oklch(var(--n-s-bg)/0.5)] backdrop-blur-sm"
          />
        )}
        <Mrawer
	        className="fixed bottom-0 z-239 flex w-[calc(24vw+40px)] items-end gap-0 text-[oklch(var(--n-s-fg)/1)] outline-none max-md:h-[65vh] max-md:w-screen md:top-0"
          style={{
            borderTopRightRadius: borderTopRadius,
            borderTopLeftRadius: borderTopRadius,
            borderBottomRightRadius: borderBottomRadius,
            borderBottomLeftRadius: borderBottomRadius
          }}
        >
	        {isMobile && <Drawer.Handle className={"absolute!"} />}
          {open && (
            <div
              onClick={() => {
                setSideDrawerOpen(false);
              }}
              onMouseEnter={onMouseEnter}
              onMouseLeave={onMouseLeave} className="absolute inset-0 z-238 bg-transparent"
            />
          )}
          <m.div
	          className="z-239 grid h-full w-[24vw] grid-cols-8 grid-rows-14 items-center justify-center gap-y-5 bg-[oklch(var(--n-s-bg)/1)] max-md:h-[65vh] max-md:w-full"
            onMouseEnter={() => {
              setCursor(null);
              setCursorTheme("dark");
            }}
            onMouseLeave={() => {
              resetCursor();
            }}
          >
            <div className={"col-[2/8] row-[2/3] flex flex-col justify-center"}>
              <Drawer.Title
                className={"text-h3"}
                title={"Shortcuts"}
              ></Drawer.Title>
            </div>
            <div className="col-[2/8] row-[3/10] px-4">
              <div className="flex flex-col gap-5 font-sans text-[23px]">
                <Link href="/home">Home</Link>
                <Link href="/users">Directory</Link>
                <Link href="/archives">Archives</Link>
                <Link href="/essays">Latest</Link>
              </div>
            </div>
	          <div className={"col-span-full row-[11/14]"}>
              {hasRadio && <RP_FM />}
            </div>
          </m.div>
          {isMobile ? (
            (open && <Controlbar />) || <> </>
          ) : (
            <SideNotch sideDrawer={true} />
          )}
        </Mrawer>
      </Drawer.Portal>
    </Drawer.Root>
  ) : null;
};
