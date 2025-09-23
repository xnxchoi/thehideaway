import { RP_Menu } from "@/components/UX/Menu";
import { EscapeInAppBrowser } from "@/components/UX/escapeInAppBrowser";
import { Main } from "@/components/core/Main";
import { Toaster } from "@/components/ui/sonner";
import { cn } from "@/lib/utils";
import { LivePreviewListener } from "@/payload/components/LivePreviewListener";
import { InitTheme } from "@/providers/Theme/InitTheme";
import "@/styles/hideaway.scss";
import "@/styles/reading.scss";
import { getServerSideURL } from "@/utilities/getURL";
import { mergeOpenGraph } from "@/utilities/mergeOpenGraph";
import { Header } from "@/payload/components/Header/Component";
import { GeistMono } from "geist/font/mono";
import { GeistSans } from "geist/font/sans";
import "lenis/dist/lenis.css";
import type { Metadata } from "next";
import { NextIntlClientProvider } from "next-intl";
import { draftMode } from "next/headers";
import { ReactNode } from "react";
import { ReactTempus } from "tempus/react";
import "../../styles/globals.css";
import "./estate.scss";

import { BetterAuthProvider } from "@/lib/auth/context";
import { getContextProps } from "@/lib/auth/context/get-context-props";
import { getLocale } from "next-intl/server";
import {
  Blase,
  Dots,
  NarcissianNectare,
  Saint,
  Siegfried,
  Suit
} from "../../../fonts";
import { ContentMask } from "../../components/UX/ContentMask";
import { Controlbar } from "../../components/UX/Controlbar";
import { FXFrame } from "../../components/UX/FXFrame/FXFrame";
import { MenuMediaPreview } from "../../components/UX/MediaPreview/MenuMediaPreview";
import { PageTransitionPortal } from "../../components/UX/Transition/PageTransitionPortal";

// Client Components (imported dynamically to create islands)
import { ClientLayout } from "./ClientLayout";
import { ClientProviders } from "./ClientProviders";
import { TabMessenger } from "../../utilities/visibilityChange";

export default async function RootLayout({
  children
}: {
  children: ReactNode;
}) {
  const { isEnabled } = await draftMode();
  const serverurl = getServerSideURL();
  const locale = await getLocale();

  return (
    <html
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
      lang={locale}
      suppressHydrationWarning
    >
      <head>
        <InitTheme />
        <link href="/favicon.ico" rel="icon" sizes="32x32" />
        <link href="/favicon.svg" rel="icon" type="image/svg+xml" />
        <title>The Hideaway</title>
      </head>
      <body data-themed={"color, background-color"}>
        <NextIntlClientProvider>
          <BetterAuthProvider {...getContextProps()}>
            <ClientProviders>
              {/* Server-rendered components */}
              <EscapeInAppBrowser />
              <Toaster />
              <LivePreviewListener />
              <Header />
              <RP_Menu />

              <ClientLayout>{children}</ClientLayout>
            </ClientProviders>
            <ReactTempus patch />
          </BetterAuthProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}

export const metadata: Metadata = {
  metadataBase: new URL(getServerSideURL()),
  openGraph: mergeOpenGraph(),
  twitter: {
    card: "summary_large_image",
    creator: "@"
  }
};
