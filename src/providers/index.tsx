"use client";

import { Providers as AuthProviders } from "@/app/(frontend)/(site)/(auth)/authProviders";
import { TooltipProvider } from "@/components/ui/tooltip";
import { TourOrchestrator, TourProvider } from "@/components/UX/Tour";
import { PortalProvider } from "@/components/UX/Transition/Portaller";
import {
  CursorProvider,
  DeviceProvider,
  HAStoreProvider,
  MenuProvider,
  SearchBarProvider
} from "@/providers/RP_Pro";
import { Voyageur } from "@/stores/Routing/RP_Voyageur";
import { LazyMotion } from "motion/react";
import dynamic from "next/dynamic";
import React from "react";
import { HeaderThemeProvider } from "./HeaderTheme";
import { QueryProvider } from "./QueryProvider";
import { SessionProvider } from "./Session/providers";
import { CMDKeyManager, ThemeProvider } from "./Theme";
import { TransitionProvider } from "./TransitionProvider";

const motion = () => import("./Motion").then((r) => r.default);
const MiddleMan = dynamic(
  () => import("@/providers/MiddleMan").then((m) => m.MiddleMan),
  {
    ssr: false
  }
);
export const Providers: React.FC<{
  children: React.ReactNode;
}> = ({ children }) => {
  return (
    <QueryProvider>
      <DeviceProvider>
        <Voyageur>
          <AuthProviders>
            <SessionProvider>
              <HAStoreProvider>
                <ThemeProvider>
                  <LazyMotion features={motion} strict={true}>
                    <CursorProvider>
                      <PortalProvider>
                        <TransitionProvider>
                          <MenuProvider>
                            <SearchBarProvider>
                              <MiddleMan>
                                <TooltipProvider>
                                  <CMDKeyManager />
                                  <TourProvider>
                                    <TourOrchestrator />
                                    <HeaderThemeProvider>
                                      {children}
                                    </HeaderThemeProvider>
                                  </TourProvider>
                                </TooltipProvider>
                              </MiddleMan>
                            </SearchBarProvider>
                          </MenuProvider>
                        </TransitionProvider>
                      </PortalProvider>
                    </CursorProvider>
                  </LazyMotion>
                </ThemeProvider>
              </HAStoreProvider>
            </SessionProvider>
          </AuthProviders>
        </Voyageur>
      </DeviceProvider>
    </QueryProvider>
  );
};
