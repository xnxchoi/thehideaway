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
import { useRPSession } from "@/lib/auth/session/RP_SessionProvider";
import { useShallow } from "zustand/shallow";
import { HeaderThemeProvider } from "./HeaderTheme";
import { NotificationProvider } from "./Notifications";
import { QueryProvider } from "./QueryProvider";
import { SessionProvider } from "./Session/providers";
import { CMDKeyManager, ThemeProvider } from "./Theme";
const TransitionProvider = dynamic(
  () => import("./TransitionProvider").then((r) => r.TransitionProvider),
  { ssr: false }
);
const TransitionDevOverlay = dynamic(
  () =>
    import("@/components/UX/Transition/TransitionDevOverlay").then(
      (r) => r.TransitionDevOverlay
    ),
  { ssr: false }
);

const motion = () => import("./Motion").then((r) => r.default);
const MiddleMan = dynamic(
  () => import("@/providers/MiddleMan").then((m) => m.MiddleMan),
  {
    ssr: false
  }
);
/**
 * Mounts NotificationProvider globally with the current session user.
 * For signed-out users (id null) we pass an empty string — the orchestrator
 * inside gates polling on `Boolean(sessionUser)`, so no network traffic
 * happens until login. Surfaces that consume `useNotifications` (Controlbar,
 * MenuExtras, etc.) can mount anywhere in the tree without needing their
 * own local provider.
 */
const GlobalNotificationProvider: React.FC<{ children: React.ReactNode }> = ({
  children
}) => {
  const userId = useRPSession(useShallow((r) => r.id)) ?? "";
  return <NotificationProvider user={userId}>{children}</NotificationProvider>;
};

export const Providers: React.FC<{
  children: React.ReactNode;
}> = ({ children }) => {
  return (
    <QueryProvider>
      <DeviceProvider>
        <Voyageur>
          <AuthProviders>
            <SessionProvider>
              <GlobalNotificationProvider>
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
                                      <TransitionDevOverlay />
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
              </GlobalNotificationProvider>
            </SessionProvider>
          </AuthProviders>
        </Voyageur>
      </DeviceProvider>
    </QueryProvider>
  );
};
