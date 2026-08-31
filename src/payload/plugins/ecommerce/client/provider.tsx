"use client";

import {
  EcommerceProvider,
  EUR,
  USD,
  useEcommerce
} from "@payloadcms/plugin-ecommerce/client/react";
import { useEffect, useRef, type ReactNode } from "react";

import { useRPSession } from "@/lib/auth/session/RP_SessionProvider";
import { JPY, KRW } from "../currencies";

function CartSessionBridge() {
  const { onLogin, onLogout } = useEcommerce();
  const userId = useRPSession((session) => session.id);
  const previousId = useRef<string | null>(null);

  useEffect(() => {
    if (!userId) {
      if (previousId.current) onLogout();
      previousId.current = null;
      return;
    }
    const timer = window.setTimeout(() => {
      void onLogin();
    }, 50);
    previousId.current = userId;
    return () => window.clearTimeout(timer);
  }, [onLogin, onLogout, userId]);

  return null;
}

export function LostEcommerceProvider({ children }: { children: ReactNode }) {
  return (
    <EcommerceProvider
      api={{
        cartsFetchQuery: {
          depth: 2,
          populate: {
            products: {
              name: true,
              slug: true,
              hero_media: true,
              priceInKRW: true
            },
            variants: {
              sku: true,
              label: true,
              options: true,
              priceInKRW: true
            }
          }
        }
      }}
      currenciesConfig={{
        defaultCurrency: "KRW",
        supportedCurrencies: [KRW, USD, EUR, JPY]
      }}
      customersSlug="users"
      enableVariants={true}
      paymentMethods={[
        {
          name: "portone",
          label: "PortOne",
          initiatePayment: true,
          confirmOrder: true
        }
      ]}
      syncLocalStorage={{ key: "lostinseoul.plugin-cart" }}
    >
      <CartSessionBridge />
      {children}
    </EcommerceProvider>
  );
}
