import type { ReactNode } from "react";

import { LostEcommerceProvider } from "@/payload/plugins/ecommerce/client/provider";
import { LostChromeProvider } from "./lost-page-state";

export default function LostInSeoulLayout({
  children
}: {
  children: ReactNode;
}) {
  return (
    <LostEcommerceProvider>
      <LostChromeProvider>{children}</LostChromeProvider>
    </LostEcommerceProvider>
  );
}
