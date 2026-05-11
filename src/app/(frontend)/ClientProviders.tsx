"use client";
import { Providers } from "@/providers";
import { NuqsAdapter } from "nuqs/adapters/next/app";
import { ReactNode } from "react";

/**
 * Client-side providers wrapper
 * This isolates all client-side state management from the server layout.
 *
 * NuqsAdapter sits at this boundary so any client surface (currently
 * NotificationTable, soon /me/posts) can use `useQueryState` /
 * `useQueryStates` for URL-driven state without each route remounting an
 * adapter.
 */
export function ClientProviders({ children }: { children: ReactNode }) {
  return (
    <NuqsAdapter>
      <Providers>{children}</Providers>
    </NuqsAdapter>
  );
}
