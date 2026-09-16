"use client";
import type { ReactNode } from "react";
import { authClient } from "@/lib/auth/client";
import { useTransitionReady } from "@/providers/transition-readiness";
import { CartSession } from "./cart-session";

export function LostEcommerceProvider({ children }: { children: ReactNode }) {
  const { data, isPending } = authClient.useSession();
  const transitionReady = useTransitionReady();
  return (
    <CartSession
      userId={isPending ? undefined : (data?.user.id ?? null)}
      transitionReady={transitionReady}
    >
      {children}
    </CartSession>
  );
}
