"use client";

import {
  CurProvider,
  DeviceProvider,
  HAStoreProvider,
  MenuProvider,
  RafProvider,
  ScrollProvider,
  SearchBarProvider,
  TransProvider
} from "@/providers/RP_Pro";

import { HeaderThemeProvider } from "./HeaderTheme";
import { ThemeProvider } from "./Theme";
import React from "react";
import { Voyageur } from "@/stores/Routing/RP_Voyageur";
import { MiddleMan } from "./MiddleMan";
import { NotificationProvider } from "./Notifications";
import { LazyMotion } from "motion/react";
import { SessionProvider } from "./Session/providers";
import { RadioProvider } from "./RadioProvider";
import { Providers as AuthProviders } from "@/app/(frontend)/(site)/(auth)/authProviders";
import { QueryProvider } from "./QueryProvider";

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
                    <ScrollProvider>
                      <CurProvider>
                        <TransProvider>
                          <RafProvider>
                            <NotificationProvider>
                              <MenuProvider>
                                <MiddleMan>
                                  <SearchBarProvider>
                                    <RadioProvider>
                                      <HeaderThemeProvider>
                                        {children}
                                      </HeaderThemeProvider>
                                    </RadioProvider>
                                  </SearchBarProvider>
                                </MiddleMan>
                              </MenuProvider>
                            </NotificationProvider>
                          </RafProvider>
                        </TransProvider>
                      </CurProvider>
                    </ScrollProvider>
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
