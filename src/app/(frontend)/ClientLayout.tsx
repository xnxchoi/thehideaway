"use client";

import { FXFrame } from "@/components/Shells/FXFrame";
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
    <>
      {children}
      <FXFrame />
      <TabMessenger />
    </>
  );
}
