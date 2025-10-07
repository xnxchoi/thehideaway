"use client";

import { Main } from "@/components/core/Main";
import { ContentMask } from "@/components/UX/ContentMask";
import { Controlbar } from "@/components/UX/Controlbar";
import { FXFrame } from "@/components/UX/FXFrame/FXFrame";
import { MenuMediaPreview } from "@/components/UX/MediaPreview/MenuMediaPreview";
import dynamic from "next/dynamic";
import { ReactNode } from "react";
const TabMessenger = dynamic(
  () => import("@/utilities/visibilityChange").then((m) => m.TabMessenger),
  { ssr: false }
);
/**
 * Client-side layout wrapper for interactive components
 * This contains all the client-side UI elements that require interactivity
 */
export function ClientLayout({ children }: { children: ReactNode }) {
  return (
    <Main>
      <MenuMediaPreview />
      <ContentMask>{children}</ContentMask>
      <FXFrame />
      <Controlbar />
      <TabMessenger />
    </Main>
  );
}
