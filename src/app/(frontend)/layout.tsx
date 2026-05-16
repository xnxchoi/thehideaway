"use server";
import type { Viewport } from "next";
import { Header } from "../../components/Shells/Header/Component";
import { Main } from "@/components/core/Main";
import { Toaster } from "@/components/ui/sonner";
import { ContentMask } from "../../components/Shells/ContentMask";
import { EscapeInAppBrowser } from "@/components/UX/escapeInAppBrowser";
import VGradient from "@/components/UX/Gradient";
import { MenuMediaPreview } from "@/components/UX/MediaPreview/MenuMediaPreview";
import { RP_Menu } from "@/components/UX/Menu";

// Client Components (imported dynamically to create islands)
import { ScrollIndicator } from "@/components/UX/ScrollIndicator";
import { SideDrawer } from "@/components/UX/SideDrawer";
import { Controlbar } from "@/components/Shells/Controlbar";

import { BetterAuthProvider } from "@/lib/auth/context";
import { getContextProps } from "@/lib/auth/context/get-context-props";
import { cn } from "@/lib/utils";
import { LivePreviewListener } from "@/payload/components/LivePreviewListener";
import { HideawayFMProvider } from "@/providers/HideawayFM";
import "@/styles/hideaway.scss";
import "@/styles/reading.scss";
import { InitTheme } from "@/providers/Theme/InitTheme";
import { GeistMono } from "geist/font/mono";
import { GeistSans } from "geist/font/sans";
import "lenis/dist/lenis.css";
import { NextIntlClientProvider } from "next-intl";
import React, { ReactNode, Suspense } from "react";
import "../../styles/globals.css";
import "./estate.scss";
import {
  Blase,
  Dots,
  NarcissianNectare,
  Saint,
  Siegfried,
  Suit
} from "../../../fonts";
import { ClientLayout } from "./ClientLayout";
import { ClientProviders } from "./ClientProviders";

export default async function RootLayout({
  children
}: {
  children: ReactNode;
}) {
  return (
    <html
      suppressHydrationWarning
      className={cn(
        Siegfried.variable,
        GeistSans.variable,
        GeistMono.variable,
        Blase.variable,
        NarcissianNectare.variable,
        Suit.variable,
        Dots.variable,
        Saint.variable
      )}
    >
      <head>
        <InitTheme />
        <link href="/favicon.ico" rel="icon" sizes="32x32" />
        <link href="/favicon.svg" rel="icon" type="image/svg+xml" />
        <title>The Hideaway</title>
      </head>
      <body data-themed={"color, background-color"}>
        <Suspense>
          <NextIntlClientProvider>
            <BetterAuthProvider {...getContextProps()}>
              <ClientProviders>
                <HideawayFMProvider>
                  {/* Server-rendered components */}
                  <EscapeInAppBrowser />
                  <Toaster />
                  <LivePreviewListener />
                  <Header />
                  <RP_Menu />
                  <ScrollIndicator />
                  {/*
                    Controlbar lives OUTSIDE <Main> alongside Header / Menu /
                    ScrollIndicator. Inside Main, ContentMask + Lenis wrap
                    children in transformed containers, which break
                    `position: fixed` (it becomes fixed relative to the
                    transformed ancestor, not the viewport — that's why
                    earlier real-iOS tests showed the bar half-visible /
                    hidden on scroll).
                  */}
                  <Controlbar />
                  <Main>
                    <ClientLayout>
                      <Suspense>
                        <MenuMediaPreview>
                          <VGradient />
                        </MenuMediaPreview>
                        <ContentMask>
                          {children}
                          <SideDrawer />
                        </ContentMask>
                      </Suspense>
                    </ClientLayout>
                  </Main>
                </HideawayFMProvider>
              </ClientProviders>
            </BetterAuthProvider>
          </NextIntlClientProvider>
        </Suspense>
      </body>
    </html>
  );
}
/**
 * Viewport policy:
 * - Lock to device-width; no pinch-zoom on touch devices. The user-reported
 *   "everything zoomed in / now it's gone" bug came from accidental
 *   pinch-zoom on mobile Safari breaking the layout — disabling user-scale
 *   is the standard fix for an app-shell-shaped experience like this.
 * - `viewportFit: "cover"` lets the page paint into the iOS notch / home
 *   indicator area so our `env(safe-area-inset-bottom)` paddings in the
 *   Controlbar / drawer-body actually have a non-zero value to consume.
 */
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover"
};

// export const metadata: Metadata = {
// 	metadataBase: new URL(getServerSideURL()),
// 	openGraph: mergeOpenGraph(),
// 	twitter: {
// 		card: "summary_large_image",
// 		creator: "@"
// 	}
// };
