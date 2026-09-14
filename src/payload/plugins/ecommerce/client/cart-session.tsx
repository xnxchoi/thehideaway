"use client";
import {
  EcommerceProvider,
  EUR,
  USD
} from "@payloadcms/plugin-ecommerce/client/react";
import {
  useEffect,
  useLayoutEffect,
  useState,
  type ReactNode,
  type SyntheticEvent
} from "react";
import { JPY, KRW } from "../currencies";
import { prepareCartSession, CART_STORAGE_KEY } from "./prepare-cart-session";

/** Each identity gets isolated React state; recovery proof separately survives vendor storage cleanup. */
export function CartSession({
  userId,
  children
}: {
  userId: string | null | undefined;
  children: ReactNode;
}) {
  return (
    <SessionMount
      key={userId === undefined ? "resolving" : (userId ?? "guest")}
      userId={userId}
    >
      {children}
    </SessionMount>
  );
}

function SessionMount({
  userId,
  children
}: {
  userId: string | null | undefined;
  children: ReactNode;
}) {
  const [ready, setReady] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [error, setError] = useState<Error>();
  useLayoutEffect(() => setMounted(true), []);
  useEffect(() => {
    if (userId === undefined) return;
    const controller = new AbortController();
    void prepareCartSession(userId, controller.signal)
      .then(() => {
        if (!controller.signal.aborted) setReady(true);
      })
      .catch((cause: unknown) => {
        if (!controller.signal.aborted)
          setError(
            cause instanceof Error ? cause : new Error("Cart session failed")
          );
      });
    return () => controller.abort();
  }, [userId]);
  if (error) throw error;
  const preparing = mounted && !ready;
  const blockWhilePreparing = (event: SyntheticEvent) => {
    if (ready) return;
    event.preventDefault();
    event.stopPropagation();
  };
  return (
    <EcommerceProvider
      key={ready ? "ready" : "preparing"}
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
      syncLocalStorage={ready && !userId ? { key: CART_STORAGE_KEY } : false}
    >
      {/* Render RSC children on the server. Before paint, quarantine the vendor's
          eager initialization; its preparation instance never persists cart data. */}
      <div
        hidden={preparing}
        inert={!ready}
        style={preparing ? undefined : { display: "contents" }}
        onClickCapture={blockWhilePreparing}
        onSubmitCapture={blockWhilePreparing}
        onKeyDownCapture={blockWhilePreparing}
      >
        {children}
      </div>
    </EcommerceProvider>
  );
}
