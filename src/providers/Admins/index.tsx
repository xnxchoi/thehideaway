"use client";
import {
  CursorProvider,
  DeviceProvider,
  HAStoreProvider,
  MenuProvider
} from "@/providers/RP_Pro";
import "@/styles/payloadStyles.css";

import { AdminThemeProvider } from "@/providers/Theme";
import { ReactLenis } from "lenis/react";
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type MouseEventHandler,
  type ReactNode
} from "react";

import { useAdminCursor } from "@/hooks/useAdminCursor";
import { cn } from "@/lib/utils";
import { Toaster } from "@/payload/components/sonner";
import { MiddleMan } from "@/providers/MiddleMan";
import { useTheme } from "@/providers/Theme";
import { VoyageurProvider } from "@/stores/Routing/RP_Voyageur";
import { useConfig, useTheme as useThemePayload } from "@payloadcms/ui";
import { LazyMotion } from "motion/react";
import { usePathname } from "next/navigation";

type EventCursor = {
  listener: (e: MouseEvent) => void;
  callback: [(e: HTMLElement) => void];
  qualifiers: string[];
};
type CursorManager = {
  hover: EventCursor[];
  click: EventCursor[];
};
type PideBarStore = {
  enabled: boolean;

  toggle: () => void;
  setState: (state: boolean) => void;
  open: boolean;
};
const PidebarContext = createContext<PideBarStore>(null!);
const PidebarProvider = ({ children }: { children: ReactNode }) => {
  const [enabled, setEnabled] = useState(false);
  const [open, setOpen] = useState(false);
  const config = useConfig();
  const enabledState = useRef(enabled);
  const setState = useCallback(
    (state: boolean) => setOpen(enabledState.current ? state : false),
    []
  );
  const toggle = useCallback(
    () =>
      enabledState.current &&
      setOpen((state) => enabledState.current && !state),
    []
  );
  const regex = useMemo(() => {
    const adminPath = config.config.routes.admin.replace(
      /[.*+?^${}()|[\]\\]/g,
      "\\$&"
    );
    const collectionSlugs = config.config.collections
      .map((c) => c.slug)
      .join("|");
    // Match: /admin/collections/{slug}/{id} or /admin/collections/{slug}/create
    return new RegExp(
      `^${adminPath}/collections/(${collectionSlugs})/(create|[a-zA-Z0-9_-]{1,50})$`
    );
  }, [config]);
  const path = usePathname();
  useEffect(() => {
    if (regex.test(path)) {
      enabledState.current = true;
      setEnabled(true);
    } else {
      enabledState.current = false;
      setEnabled(false);
    }
  }, [path, regex]);
  return (
    <PidebarContext.Provider value={{ enabled, toggle, setState, open }}>
      {children}
    </PidebarContext.Provider>
  );
};
export const usePidebar = <T,>(selector: (store: PideBarStore) => T) => {
  const context = useContext(PidebarContext);
  if (!context) {
    throw new Error("usePidebar must be used within PidebarProvider");
  }
  return selector(context);
};
const AMDKeyManager = ({ children }: { children: ReactNode }) => {
  const toggleTheme = useTheme((store) => store.toggleTheme);
  const togglePide = usePidebar((store) => store.toggle);
  const pideOpen = usePidebar((store) => store.open);
  const pideEnabled = usePidebar((store) => store.enabled);
  const pider = useRef<HTMLDivElement>(null!);
  const keyPressed = useCallback(
    (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey) {
        switch (e.key) {
          case "s":
            return (e.preventDefault(), togglePide());
          case "h":
            return (e.preventDefault(), toggleTheme());
        }
      }
    },
    [togglePide, toggleTheme]
  );
  const [entered, setEntered] = useState(false);
  const onEnter: MouseEventHandler = useCallback((e) => {
    setEntered(true);
  }, []);
  const onLeave: MouseEventHandler = useCallback((e) => {
    setEntered(false);
  }, []);
  useEffect(() => {
    document.addEventListener("keydown", keyPressed);
    return () => document.removeEventListener("keydown", keyPressed);
  }, [keyPressed]);
  return (
    <div
      className={cn("relative", { sidebar__wrapped: pideEnabled && pideOpen })}
      data-sidebar-open={pideOpen}
      data-sidebar-peek={entered}
      ref={pider}
    >
      {children}
      {pideEnabled && (
        <div
          onMouseEnter={onEnter}
          onMouseLeave={onLeave}
          className={
            "fixed top-0 right-0 bottom-0 z-[9999] block h-screen w-[60px] bg-transparent"
          }
        />
      )}
    </div>
  );
};
const Middle = ({ children }: { children: React.ReactNode }) => {
  const { theme: payloadTheme } = useThemePayload();

  const setTheme = useTheme((r) => r.setTheme);
  useEffect(() => {
    setTheme(payloadTheme);
  }, [payloadTheme, setTheme]);

  useAdminCursor();

  return (
    <PidebarProvider>
      <AMDKeyManager>{children}</AMDKeyManager>
    </PidebarProvider>
  );
};
const features = () => import("@/providers/Motion").then((r) => r.default);
const AdminsProviders: React.FC<{
  children: React.ReactNode;
}> = ({ children }) => {
  return (
    <DeviceProvider>
      <VoyageurProvider>
        <ReactLenis root={true}>
          <HAStoreProvider>
            <AdminThemeProvider>
              <LazyMotion features={features} strict={true}>
                <MenuProvider>
                  <CursorProvider>
                    <MiddleMan>
                      <Middle>{children}</Middle>
                      <Toaster />
                    </MiddleMan>
                  </CursorProvider>
                </MenuProvider>
              </LazyMotion>
            </AdminThemeProvider>
          </HAStoreProvider>
        </ReactLenis>
      </VoyageurProvider>
    </DeviceProvider>
  );
};
export default AdminsProviders;
