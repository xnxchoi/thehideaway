"use client";

import { Providers } from "@/providers";
import { ReactNode } from "react";

/**
 * Client-side providers wrapper
 * This isolates all client-side state management from the server layout
 */
export function ClientProviders({ children }: { children: ReactNode }) {
  return <Providers>{children}</Providers>;
}
