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
import { SearchSheet } from "@/components/UX/SearchSheet";
import { SideDrawer } from "@/components/UX/SideDrawer";
import { SideDrawerPullTab } from "@/components/UX/SideDrawer/PullTab";
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
import type { Viewport } from "next";
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

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  // Allow user-initiated zoom (WCAG 1.4.4 / iOS Safari ignores
  // `maximum-scale=1` for accessibility anyway). The JS-side gesture
  // block in `MobileProvider` is what suppresses accidental pinch-zoom
  // during interaction; this leaves the explicit accessibility lever
  // intact.
  maximumScale: 5,
  viewportFit: "cover"
  // NOTE: `interactiveWidget: "resizes-content"` was tried for the
  // keyboard / empty-sheet issue but caused unexpected zoom behaviour
  // on real iOS. Revisit when the SearchSheet layout is settled.
};

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
                  <Main>
                    <ClientLayout>
                      <Suspense>
                        <MenuMediaPreview>
                          <VGradient />
                        </MenuMediaPreview>
                        <ContentMask>
                          {children}
                          <SideDrawer />
                          <SideDrawerPullTab />
                          <Controlbar />
                          <SearchSheet />
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
// export const metadata: Metadata = {
// 	metadataBase: new URL(getServerSideURL()),
// 	openGraph: mergeOpenGraph(),
// 	twitter: {
// 		card: "summary_large_image",
// 		creator: "@"
// 	}
// };
