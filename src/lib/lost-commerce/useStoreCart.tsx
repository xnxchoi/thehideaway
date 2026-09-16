"use client";

import { useCallback, useMemo } from "react";
import { useCart } from "@payloadcms/plugin-ecommerce/client/react";
import { useCartOperations } from "@/payload/plugins/ecommerce/client/cart-operations";
import { cartLinesMatch } from "@/payload/plugins/ecommerce/cart-item-matcher";

import type { LostCartLineInput } from "./types";
import {
  mapPluginCartLines,
  pluginCartAddItem
} from "@/payload/plugins/ecommerce/client/map-cart-lines";

/**
 * Storefront cart line. Distinct from Payload plugin `useCart()` documents
 * and from UI `useCartOpen` (drawer chrome).
 */
export type StoreCartLine = LostCartLineInput & {
  itemId?: string;
  productName: string;
  productSlug: string;
  variantLabel?: string;
  price: string;
  unitAmount: number;
  currency: "KRW" | "USD" | "JPY" | "EUR";
  imageUrl?: string | null;
};

export function serializeStoreCartLines(
  lines: StoreCartLine[]
): LostCartLineInput[] {
  return lines.map((line) => ({
    productId: line.productId,
    skuId: line.skuId,
    mode: line.mode,
    quantity: line.quantity,
    campaignId: line.campaignId
  }));
}

/** Adapter over plugin `useCart`. Do not name this `useCart`. */
export function useStoreCart() {
  const {
    addItem,
    cart,
    clearCart,
    decrementItem,
    incrementItem,
    isLoading,
    removeItem
  } = useCart();
  const { run, pending, unconfirmed, isBlocked } = useCartOperations();
  const lines = useMemo(
    () => mapPluginCartLines(cart, String(cart?.currency ?? "KRW")),
    [cart]
  );
  const total =
    typeof cart?.subtotal === "number"
      ? cart.subtotal
      : lines.reduce((sum, line) => sum + line.unitAmount * line.quantity, 0);
  const count = lines.reduce((sum, line) => sum + line.quantity, 0);

  const add = useCallback(
    (line: StoreCartLine) => {
      const item = pluginCartAddItem(line);
      const existing = cart?.items?.find((candidate) =>
        cartLinesMatch(candidate, item)
      );
      const identity = {
        product: line.productId,
        variant: line.skuId,
        mode: line.mode,
        campaign: line.campaignId
      };
      return run(
        {
          kind: "add",
          item: identity,
          quantity: (existing?.quantity ?? 0) + line.quantity
        },
        () => addItem(pluginCartAddItem(line) as never, line.quantity)
      );
    },
    [addItem, cart?.items, run]
  );

  const remove = useCallback(
    (line: StoreCartLine) =>
      line.itemId
        ? run({ kind: "item", itemID: line.itemId, quantity: 0 }, () =>
            removeItem(line.itemId!)
          )
        : Promise.resolve(false),
    [removeItem, run]
  );

  const clear = useCallback(
    () =>
      cart?.items?.length
        ? run({ kind: "clear" }, () => clearCart())
        : Promise.resolve(false),
    [cart?.items?.length, clearCart, run]
  );
  const increment = useCallback(
    (line: StoreCartLine) =>
      line.itemId
        ? run(
            { kind: "item", itemID: line.itemId, quantity: line.quantity + 1 },
            () => incrementItem(line.itemId!)
          )
        : Promise.resolve(false),
    [incrementItem, run]
  );
  const decrement = useCallback(
    (line: StoreCartLine) =>
      line.itemId
        ? run(
            {
              kind: "item",
              itemID: line.itemId,
              quantity: Math.max(0, line.quantity - 1)
            },
            () => decrementItem(line.itemId!)
          )
        : Promise.resolve(false),
    [decrementItem, run]
  );

  return {
    lines,
    add,
    remove,
    clear,
    increment,
    decrement,
    total,
    count,
    isLoading: isLoading || pending || unconfirmed,
    isBlocked,
    pending,
    unconfirmed
  };
}
