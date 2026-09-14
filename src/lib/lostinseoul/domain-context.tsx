"use client";

import { createContext, useContext, type ReactNode } from "react";
import { usePathname } from "next/navigation";
import { lostRoutePath } from "./domain";

const LostDomainContext = createContext(false);

export function LostDomainProvider({
  children,
  isLostHost
}: {
  children: ReactNode;
  isLostHost: boolean;
}) {
  return (
    <LostDomainContext.Provider value={isLostHost}>
      {children}
    </LostDomainContext.Provider>
  );
}

export function useLostDomain(): boolean {
  return useContext(LostDomainContext);
}

/** Both the rewritten SSR path and public browser path identify the same shell. */
export function useRoutePathname(): string {
  const pathname = usePathname() ?? "";
  return lostRoutePath(pathname, useLostDomain());
}
