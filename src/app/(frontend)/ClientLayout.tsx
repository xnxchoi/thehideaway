"use client";

import { Main } from "@/components/core/Main";
import { ContentMask } from "@/components/UX/ContentMask";
import { Controlbar } from "@/components/UX/Controlbar";
import { FXFrame } from "@/components/UX/FXFrame/FXFrame";
import { MenuMediaPreview } from "@/components/UX/MediaPreview/MenuMediaPreview";
import { useIsMobile } from "@/providers/MiddleMan";
import { useRPStore } from "@/providers/RP_Pro";
import dynamic from "next/dynamic";
import { ReactNode } from "react";
import { useShallow } from "zustand/shallow";
const TabMessenger = dynamic(
  () => import("@/utilities/visibilityChange").then((m) => m.TabMessenger),
  { ssr: false }
);
/**
 * Client-side layout wrapper for interactive components
 * This contains all the client-side UI elements that require interactivity
 */
export function ClientLayout({ children }: { children: ReactNode }) {
  const { isMobile } = useIsMobile();
  const open = useRPStore(useShallow((r) => r.sidebarOpen));
  return (
    <>
      <Main>
        <MenuMediaPreview />
        <ContentMask>{children}</ContentMask>
        <FXFrame />
        <TabMessenger />
      </Main>
      {isMobile && !open && <Controlbar />}
    </>
  );
}
