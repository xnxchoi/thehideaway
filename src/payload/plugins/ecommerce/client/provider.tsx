"use client";
import type { ReactNode } from "react";
import { authClient } from "@/lib/auth/client";
import { CartSession } from "./cart-session";

export function LostEcommerceProvider({ children }: { children: ReactNode }) {
  const { data, isPending } = authClient.useSession();
  return (
    <CartSession userId={isPending ? undefined : (data?.user.id ?? null)}>
      {children}
    </CartSession>
  );
}
