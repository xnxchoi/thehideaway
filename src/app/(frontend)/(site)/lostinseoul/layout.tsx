import type { ReactNode } from "react";

import { LostEcommerceProvider } from "@/payload/plugins/ecommerce/client/provider";
import { getLostHomeData } from "@/lib/lost-commerce/queries";
import {
  ChromeProvider,
  CommerceMain,
  EntryProvider
} from "@lostinseoul/page-status";
import { StoreChrome } from "@lostinseoul/store-chrome";
import "@lostinseoul/index.css";

export default async function Layout({ children }: { children: ReactNode }) {
  const data = await getLostHomeData().catch(() => ({
    products: [],
    drops: []
  }));

  return (
    <LostEcommerceProvider>
      <ChromeProvider>
        <EntryProvider>
          <StoreChrome drops={data.drops} />
          <CommerceMain className="lost-commerce-root relative z-[1001] min-h-screen bg-[var(--lost-paper)] text-[var(--lost-paper-ink)] selection:bg-[var(--fg)] selection:text-[var(--bg)]">
            {children}
          </CommerceMain>
        </EntryProvider>
      </ChromeProvider>
    </LostEcommerceProvider>
  );
}
