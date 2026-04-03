import { Header } from "@/components/core/Header/Component";
import { Main } from "@/components/core/Main";
import { Toaster } from "@/components/ui/sonner";
import { ContentMask } from "@/components/UX/ContentMask";
import { EscapeInAppBrowser } from "@/components/UX/escapeInAppBrowser";
import VGradient from "@/components/UX/Gradient";
import { MenuMediaPreview } from "@/components/UX/MediaPreview/MenuMediaPreview";
import { RP_Menu } from "@/components/UX/Menu";

// Client Components (imported dynamically to create islands)
import { ScrollIndicator } from "@/components/UX/ScrollIndicator";
import { SideDrawer } from "@/components/UX/SideDrawer";

import { BetterAuthProvider } from "@/lib/auth/context";
import { getContextProps } from "@/lib/auth/context/get-context-props";
import { cn } from "@/lib/utils";
import { LivePreviewListener } from "@/payload/components/LivePreviewListener";
import { RadioProvider } from "@/providers/RadioProvider";
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
                <RadioProvider>
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
                        </ContentMask>
                      </Suspense>
                    </ClientLayout>
                  </Main>
                </RadioProvider>
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
