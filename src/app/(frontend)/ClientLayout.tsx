"use client";

import { Main } from "@/components/core/Main";
import { ContentMask } from "@/components/UX/ContentMask";
import { Controlbar } from "@/components/UX/Controlbar";
import { FXFrame } from "@/components/UX/FXFrame/FXFrame";
import { MenuMediaPreview } from "@/components/UX/MediaPreview/MenuMediaPreview";
import { PageTransitionPortal } from "@/components/UX/Transition/PageTransitionPortal";
import { TabMessenger } from "@/utilities/visibilityChange";
import { ReactNode } from "react";

/**
 * Client-side layout wrapper for interactive components
 * This contains all the client-side UI elements that require interactivity
 */
export function ClientLayout({ children }: { children: ReactNode }) {
  return (
    <TabMessenger>
      <Main>
        <MenuMediaPreview />
        <ContentMask>{children}</ContentMask>
        <PageTransitionPortal />
        <FXFrame />
        <Controlbar />
      </Main>
    </TabMessenger>
  );
}
