import type { ReactNode } from "react";

import { LostEcommerceProvider } from "@/payload/plugins/ecommerce/client/provider";

export default function LostInSeoulLayout({
  children
}: {
  children: ReactNode;
}) {
  return <LostEcommerceProvider>{children}</LostEcommerceProvider>;
}
