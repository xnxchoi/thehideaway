"use client";
import {
  CurProvider,
  DeviceProvider,
  HAStoreProvider,
  MenuProvider,
  RafProvider
} from "@/providers/RP_Pro";
import "@/styles/payloadStyles.css";

import { ThemeProvider } from "@/providers/Theme";
import { ReactLenis } from "lenis/react";
import { usePathname } from "next/navigation";
import React, { useEffect } from "react";

import { useAdminCursor } from "@/hooks/useAdminCursor";
import { Toaster } from "@/payload/components/sonner";
import { MiddleMan } from "@/providers/MiddleMan";
import { useTheme } from "@/providers/Theme";
import { VoyageurProvider } from "@/stores/Routing/RP_Voyageur";
import { useTheme as useThemePayload } from "@payloadcms/ui";
import { LazyMotion } from "motion/react";

type EventCursor = {
  listener: (e: MouseEvent) => void;
  callback: [(e: HTMLElement) => void];
  qualifiers: string[];
};
type CursorManager = {
  hover: EventCursor[];
  click: EventCursor[];
};

const Middle = ({ children }: { children: React.ReactNode }) => {
  const pathname = usePathname();
  const { theme: payloadTheme } = useThemePayload();
  const setTheme = useTheme((r) => r.setTheme);
  useEffect(() => {
    setTheme(payloadTheme);
  }, [payloadTheme, setTheme]);

  useAdminCursor();

  return <>{children}</>;
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
            <ThemeProvider>
              <LazyMotion features={features} strict={true}>
                <RafProvider>
                  <MenuProvider>
                    <CurProvider>
                      <MiddleMan>
                        <Middle>{children}</Middle>
                        <Toaster />
                      </MiddleMan>
                    </CurProvider>
                  </MenuProvider>
                </RafProvider>
              </LazyMotion>
            </ThemeProvider>
          </HAStoreProvider>
        </ReactLenis>
      </VoyageurProvider>
    </DeviceProvider>
  );
};
export default AdminsProviders;
