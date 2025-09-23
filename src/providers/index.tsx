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

import { Providers as AuthProviders } from "@/app/(frontend)/(site)/(auth)/authProviders";
import { Voyageur } from "@/stores/Routing/RP_Voyageur";
import { LazyMotion } from "motion/react";
import React from "react";
import { HeaderThemeProvider } from "./HeaderTheme";
import { MiddleMan } from "./MiddleMan";
import { QueryProvider } from "./QueryProvider";
import { SessionProvider } from "./Session/providers";
import { ThemeProvider } from "./Theme";

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
                            <MenuProvider>
                              <MiddleMan>
                                <SearchBarProvider>
                                  <HeaderThemeProvider>
                                    {children}
                                  </HeaderThemeProvider>
                                </SearchBarProvider>
                              </MiddleMan>
                            </MenuProvider>
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
