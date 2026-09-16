"use client";
import {
  EcommerceProvider,
  EUR,
  USD,
  useEcommerce
} from "@payloadcms/plugin-ecommerce/client/react";
import {
  useEffect,
  useLayoutEffect,
  useState,
  type ReactNode,
  type SyntheticEvent
} from "react";
import { useTranslations } from "next-intl";
import { CartOperationsProvider } from "./cart-operations";
import { JPY, KRW } from "../currencies";
import { prepareCartSession, CART_STORAGE_KEY } from "./prepare-cart-session";

/** Each identity gets isolated React state; recovery proof separately survives vendor storage cleanup. */
export function CartSession({
  userId,
  transitionReady = true,
  children
}: {
  userId: string | null | undefined;
  transitionReady?: boolean;
  children: ReactNode;
}) {
  return (
    <SessionMount
      key={userId === undefined ? "resolving" : (userId ?? "guest")}
      userId={userId}
      transitionReady={transitionReady}
    >
      {children}
    </SessionMount>
  );
}

function SessionMount({
  userId,
  transitionReady,
  children
}: {
  userId: string | null | undefined;
  transitionReady: boolean;
  children: ReactNode;
}) {
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<Error>();
  useEffect(() => {
    if (!transitionReady || userId === undefined) return;
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
  }, [transitionReady, userId]);
  const prepared = transitionReady && ready;
  return (
    <EcommerceProvider
      key={prepared ? "ready" : "preparing"}
      initialize={prepared}
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
      syncLocalStorage={prepared && !userId ? { key: CART_STORAGE_KEY } : false}
    >
      <CartOperationsProvider>
        <SessionGate
          prepared={prepared}
          preparationError={error}
          userId={userId}
        >
          {children}
        </SessionGate>
      </CartOperationsProvider>
    </EcommerceProvider>
  );
}

/** Keep streamed server children visible; quarantine interaction before client paint. */
function SessionGate({
  prepared,
  preparationError,
  userId,
  children
}: {
  prepared: boolean;
  preparationError?: Error;
  userId: string | null | undefined;
  children: ReactNode;
}) {
  const { isHydrating, hydrationError, user } = useEcommerce();
  const [mounted, setMounted] = useState(false);
  useLayoutEffect(() => setMounted(true), []);
  const identityMismatch = !isHydrating && (user?.id ?? null) !== userId;
  const failed = Boolean(
    preparationError || hydrationError || identityMismatch
  );
  const ready = prepared && !isHydrating && !failed;
  const hidden = mounted && !ready;
  const blockUntilReady = (event: SyntheticEvent) => {
    if (ready) return;
    event.preventDefault();
    event.stopPropagation();
  };
  return (
    <>
      {failed && <SessionRecovery />}
      <div
        hidden={hidden}
        inert={!ready}
        style={hidden ? undefined : { display: "contents" }}
        onClickCapture={blockUntilReady}
        onSubmitCapture={blockUntilReady}
        onKeyDownCapture={blockUntilReady}
      >
        {children}
      </div>
    </>
  );
}

function SessionRecovery() {
  const t = useTranslations("CartSession");
  return (
    <div role="alert" className="px-6 py-12 text-sm">
      <p>{t("unavailable")}</p>
      <button
        type="button"
        className="mt-4 border-b border-current"
        onClick={() => window.location.reload()}
      >
        {t("reload")}
      </button>
    </div>
  );
}
