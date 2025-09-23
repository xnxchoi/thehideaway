"use client";
import { useDomCursor } from "@/components/core/cursorWrapper";
import { useCursorStore, useRPStore } from "@/providers/RP_Pro";
import { useCallback, useEffect, useRef, useState } from "react";
import { Drawer } from "@/components/vaul";
import { Link } from "../Link";
import { useIsMobile } from "@/providers/MiddleMan";
import { RP_FM } from "../Radio/RP_FM";
import { SideNotch } from "../SideNotch";
import { useRadioStore } from "@/providers/RadioProvider";
import { useShallow } from "zustand/shallow";

export const SIDE_DRAWER = {
  MOBILE: {
    width: "100vw",
    height: "auto",
    direction: "bottom"
  },
  DESKTOP: {
    width: "24vw",
    height: "100vh",
    direction: "left"
  }
};

export const SideDrawer = () => {
  const setSnapPoint = useRPStore((r) => r.setActiveSnapPoint);
  const snapPoints = useRPStore(useShallow((r) => r.snapPoints));
  const snapPoint = useRPStore(useShallow((r) => r.activeSnapPoint));
  const isOpen = useRPStore(useShallow((r) => r.sideDrawerRendered));
  const open = useRPStore(useShallow((r) => r.sidebarOpen));
  const setSideDrawerOpen = useRPStore((r) => r.setSideDrawerOpen);
  const setIsDraggingSideDrawer = useRPStore((r) => r.setIsDraggingSideDrawer);
  const toggleSideDrawer = useRPStore((r) => r.toggleSideDrawer);
  const { isMobile } = useIsMobile();
  const setCursor = useCursorStore((r) => r.setCursorState);
  const hasRadio = useRadioStore(useShallow((r) => r.hasRadio));
  const [direction, setDirection] = useState<
    "bottom" | "left" | "top" | "right" | undefined
  >(
    SIDE_DRAWER[isMobile ? "MOBILE" : "DESKTOP"].direction as
      | "bottom"
      | "left"
      | "top"
      | "right"
      | undefined
  );
  useEffect(() => {
    setDirection(
      SIDE_DRAWER[isMobile ? "MOBILE" : "DESKTOP"].direction as
        | "bottom"
        | "left"
        | "top"
        | "right"
        | undefined
    );
  }, [isMobile]);

  const setCursorTheme = useCursorStore((r) => r.setCursorTheme);
  const resetCursor = useCursorStore((r) => r.resetCursorTheme);
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
  const shortcutListenerCallback = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setSideDrawerOpen(false);
      } else if ((e.ctrlKey || e.metaKey) && (e.key === "b" || e.key === "B")) {
        toggleSideDrawer();
      }
    },
    [setSideDrawerOpen, toggleSideDrawer]
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
  return (
    snapPoints.length > 0 && (
      <Drawer.Root
        snapPoints={snapPoints}
        activeSnapPoint={snapPoint}
        setActiveSnapPoint={setSnapPoint}
        open={isOpen}
        onOpenChange={onOpenChange}
        defaultOpen={true}
        snapToSequentialPoint={true}
        modal={open}
        direction={"left"}
        onDrag={(e) => {
          setIsDraggingSideDrawer(true);
        }}
        onRelease={(e) => {
          console.log("release");
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
              className="fixed inset-0 z-[39] bg-[oklch(var(--n-s-bg)/0.5)] backdrop-blur-sm"
            />
          )}
          <Drawer.Content
            className="fixed top-0 bottom-0 z-[239] flex w-[calc(24vw+40px)] items-end gap-0 text-[oklch(var(--n-s-fg)/1)] outline-none max-md:w-screen"
            style={{} as React.CSSProperties}
          >
            {open && (
              <div
                onClick={() => {
                  setSideDrawerOpen(false);
                }}
                onMouseEnter={onMouseEnter}
                onMouseLeave={onMouseLeave}
                className="absolute inset-0 z-[238] bg-transparent"
              />
            )}
            <div
              className="z-[239] grid h-full w-[24vw] grid-cols-8 grid-rows-14 items-center justify-center gap-y-5 rounded-[16px] bg-[oklch(var(--n-s-bg)/1)] max-md:w-screen"
              onMouseEnter={() => {
                setCursor(null);
                setCursorTheme("dark");
              }}
              onMouseLeave={() => {
                resetCursor();
              }}
            >
              <div
                className={"col-[2/8] row-[2/3] flex flex-col justify-center"}
              >
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
                  <Link href="/posts">Latest</Link>
                </div>
              </div>
              <div className={"col-[1/-1] row-[11/14]"}>
                {hasRadio && <RP_FM />}
              </div>
            </div>
            <SideNotch sideDrawer={true} />
          </Drawer.Content>
        </Drawer.Portal>
      </Drawer.Root>
    )
  );
};
