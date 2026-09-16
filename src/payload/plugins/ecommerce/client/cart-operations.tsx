"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode
} from "react";
import { useCart } from "@payloadcms/plugin-ecommerce/client/react";
import { cartLinesMatch } from "../cart-item-matcher";

type Expectation =
  | { kind: "clear" }
  | { kind: "item"; itemID: string; quantity: number }
  | { kind: "add"; item: Record<string, unknown>; quantity: number };

type Operation = {
  cartID?: string | number;
  expectation: Expectation;
  revision: number;
  settled: boolean;
  status: "pending" | "unconfirmed";
};

type Operations = {
  pending: boolean;
  unconfirmed: boolean;
  isBlocked: () => boolean;
  run: (
    expectation: Expectation,
    mutate: () => Promise<unknown>
  ) => Promise<boolean>;
};

const blocked: Operations = {
  pending: true,
  unconfirmed: false,
  isBlocked: () => true,
  run: async () => false
};
const CartOperationsContext = createContext<Operations>(blocked);

/** Only operation metadata lives here; the official provider owns every cart document. */
export function CartOperationsProvider({ children }: { children: ReactNode }) {
  const { cart, isLoading } = useCart();
  const [operation, setOperation] = useState<Operation | null>(null);
  const lock = useRef<Operation | null>(null);
  const completion = useRef<((confirmed: boolean) => void) | null>(null);
  const revision = useRef(0);
  const providerLoading = useRef(isLoading);
  useLayoutEffect(() => {
    providerLoading.current = isLoading;
  }, [isLoading]);
  const isBlocked = useCallback(
    () => !!lock.current || providerLoading.current,
    []
  );
  useLayoutEffect(() => {
    revision.current += 1;
  }, [cart]);

  useEffect(
    () => () => {
      completion.current?.(false);
      completion.current = null;
    },
    []
  );

  useEffect(() => {
    if (!operation?.settled || isLoading) return;
    const { expectation } = operation;
    const items = cart?.items ?? [];
    const item =
      expectation.kind === "item"
        ? items.find((candidate) => candidate.id === expectation.itemID)
        : expectation.kind === "add"
          ? items.find((candidate) =>
              cartLinesMatch(candidate, expectation.item)
            )
          : undefined;
    const confirmed =
      !!cart &&
      revision.current > operation.revision &&
      (operation.cartID === undefined || cart.id === operation.cartID) &&
      (expectation.kind === "clear"
        ? items.length === 0
        : (item?.quantity ?? 0) === expectation.quantity);
    completion.current?.(confirmed);
    completion.current = null;
    if (confirmed) {
      lock.current = null;
      setOperation(null);
    } else if (operation.status !== "unconfirmed") {
      const uncertain: Operation = { ...operation, status: "unconfirmed" };
      lock.current = uncertain;
      setOperation(uncertain);
    }
  }, [cart, isLoading, operation]);

  const run = useCallback<Operations["run"]>(
    (expectation, mutate) => {
      if (isBlocked()) return Promise.resolve(false);
      const started: Operation = {
        cartID: cart?.id,
        expectation,
        revision: revision.current,
        settled: false,
        status: "pending"
      };
      // Acquire before invoking the vendor method: React state does not lock same-tick callers.
      lock.current = started;
      setOperation(started);
      return new Promise<boolean>((resolve) => {
        completion.current = resolve;
        void (async () => {
          try {
            await mutate();
          } catch {
            // A lost response may follow a committed mutation. Never retry a delta here.
          } finally {
            const settled = { ...started, settled: true };
            lock.current = settled;
            setOperation(settled);
          }
        })();
      });
    },
    [cart?.id, isBlocked]
  );

  const value = useMemo<Operations>(
    () => ({
      pending: operation?.status === "pending",
      unconfirmed: operation?.status === "unconfirmed",
      isBlocked,
      run
    }),
    [operation?.status, isBlocked, run]
  );
  return (
    <CartOperationsContext.Provider value={value}>
      {children}
    </CartOperationsContext.Provider>
  );
}

export const useCartOperations = () => useContext(CartOperationsContext);
