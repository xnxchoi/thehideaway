"use client";

import { FXFrame } from "@/components/Shells/FXFrame";
import { TabMessenger } from "@/utilities/visibilityChange";
import { ReactNode } from "react";

/**
 * Client-side layout wrapper for interactive components
 * This contains all the client-side UI elements that require interactivity
 */
export function ClientLayout({ children }: { children: ReactNode }) {
  return (
    <>
      {children}
      <FXFrame />
      <TabMessenger />
    </>
  );
}
