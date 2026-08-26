
import "@/app/(frontend)/estate.scss";
import { Layout } from "@/app/(frontend)/(site)/layout.client";
import { Footer } from "../../../components/Shells/Footer/Footer";
import { LegalFooterGate } from "../../../components/Shells/Footer/LegalFooterGate";
import { getServerSideURL } from "@/utilities/getURL";
import { mergeOpenGraph } from "@/utilities/mergeOpenGraph";
import type { Metadata } from "next";
import { ReactNode, Suspense } from "react";

export default async function RootLayout({
  children
}: {
  children: ReactNode;
}) {
  getServerSideURL();
  return (
    <>
      <Layout>{children}</Layout>
      {/* Path-gated: hidden by default on auth, reading, and checkout
          routes; pages can override via `useFooterVisibility` from
          `@/components/core/LegalFooter/footer-visibility`. */}
      <Suspense fallback={null}>
        <LegalFooterGate>
          <Footer />
        </LegalFooterGate>
      </Suspense>
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
