import "@/styles/globals.css";
import "@/app/(frontend)/estate.scss";
import type { Metadata } from "next";
import { draftMode } from "next/headers";
import { getServerSideURL } from "@/utilities/getURL";
import { mergeOpenGraph } from "@/utilities/mergeOpenGraph";
import { ReactNode } from "react";
import { Layout } from "@/app/(frontend)/(site)/layout.client";
import { RadioProvider } from "@/providers/RadioProvider";
import { SideDrawer } from "@/components/UX/SideDrawer";

export default async function RootLayout({
  children
}: {
  children: ReactNode;
}) {
  const { isEnabled } = await draftMode();
  getServerSideURL();
  return (
    <>
      <Layout>{children}</Layout>
      <RadioProvider>
        <SideDrawer />
      </RadioProvider>
    </>
  );
}

export const metadata: Metadata = {
  metadataBase: new URL(getServerSideURL()),
  openGraph: mergeOpenGraph(),
  twitter: {
    card: "summary_large_image",
    creator: "@thehideaway"
  }
};
