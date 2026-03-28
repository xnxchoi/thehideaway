"use client";

import { TooltipProvider } from "@/components/ui/tooltip";
import {
  CursorProvider,
  DeviceProvider,
  HAStoreProvider,
  MenuProvider,
  SearchBarProvider
} from "@/providers/RP_Pro";

import { Providers as AuthProviders } from "@/app/(frontend)/(site)/(auth)/authProviders";
import { Voyageur } from "@/stores/Routing/RP_Voyageur";
import { LazyMotion } from "motion/react";
import React from "react";
import { HeaderThemeProvider } from "./HeaderTheme";
import { MiddleMan } from "./MiddleMan";
import { QueryProvider } from "./QueryProvider";
import { SessionProvider } from "./Session/providers";
import { CMDKeyManager, ThemeProvider } from "./Theme";
import { PortalProvider } from "@/components/UX/Transition/Portaller";
import { TransitionProvider } from "./TransitionProvider";
import { TourProvider, TourOrchestrator } from "@/components/UX/Tour";

const motion = () => import("./Motion").then((r) => r.default);
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
