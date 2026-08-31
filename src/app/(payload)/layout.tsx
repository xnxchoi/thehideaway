/* THIS FILE WAS GENERATED AUTOMATICALLY BY PAYLOAD. */
/* DO NOT MODIFY IT BECAUSE IT COULD BE REWRITTEN AT ANY TIME. */
import "@/styles/payloadStyles.css";
import "@payloadcms/next/css";
import "@/payload/scss/vault-theme.scss";
import "./custom.scss";
import config from "@payload-config";
import "@payloadcms/next/css";
import type { ServerFunctionClient } from "payload";
import { handleServerFunctions, RootLayout } from "@payloadcms/next/layouts";
import React, { Suspense } from "react";

import { importMap } from "./vault/importMap";
import { cn } from "@/lib/utils";
import { Blase, NarcissianNectare, Suit, Dots, Siegfried, Saint } from "fonts";
import { GeistMono } from "geist/font/mono";
import { InitTheme } from "@/providers/Theme/InitTheme";
import { GeistSans } from "geist/font/sans";

type Args = {
  children: React.ReactNode;
};

const serverFunction: ServerFunctionClient = async function (args) {
  "use server";
  return handleServerFunctions({
    ...args,
    config,
    importMap
  });
};

const Layout = ({ children }: Args) => (
  <Suspense>
    <RootLayout
      config={config}
      importMap={importMap}
      serverFunction={serverFunction}
      htmlProps={{
        className: cn(
          Siegfried.variable,
          GeistSans.variable,
          GeistMono.variable,
          Blase.variable,
          NarcissianNectare.variable,
          Suit.variable,
          Dots.variable,
          Saint.variable
        )
      }}
    >
      <div
        className={cn(
          Blase.variable,
          NarcissianNectare.variable,
          Suit.variable,
          Dots.variable,
          GeistMono.variable,
          "relative min-h-screen w-screen"
        )}
      >
        {children}
      </div>
    </RootLayout>
  </Suspense>
);

export default Layout;
