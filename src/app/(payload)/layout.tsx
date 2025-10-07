/* THIS FILE WAS GENERATED AUTOMATICALLY BY PAYLOAD. */
/* DO NOT MODIFY IT BECAUSE IT COULD BE REWRITTEN AT ANY TIME. */
import "@payloadcms/next/css";
import "../../styles/payloadStyles.css";
import "./custom.scss";
import config from "@payload-config";
import "@payloadcms/next/css";
import type { ServerFunctionClient } from "payload";
import { handleServerFunctions, RootLayout } from "@payloadcms/next/layouts";
import React from "react";

import { importMap } from "./vault/importMap";
import { cn } from "@/lib/utils";
import { NarcissianNectare, Suit } from "fonts";
import { GeistMono } from "geist/font/mono";

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
  <RootLayout
    config={config}
    importMap={importMap}
    serverFunction={serverFunction}
  >
    <div
      className={cn(
        Suit.variable,
        NarcissianNectare.variable,
        GeistMono.variable,
        "relative min-h-screen w-screen"
      )}
    >
      {children}
    </div>
  </RootLayout>
);

export default Layout;
