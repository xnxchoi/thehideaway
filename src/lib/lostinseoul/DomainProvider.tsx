import { headers } from "next/headers";
import type { ReactNode } from "react";
import { isLostHost } from "./domain";
import { LostDomainProvider } from "./domain-context";

export async function DomainProvider({ children }: { children: ReactNode }) {
  const requestHeaders = await headers();
  return (
    <LostDomainProvider isLostHost={isLostHost(requestHeaders.get("host"))}>
      {children}
    </LostDomainProvider>
  );
}
