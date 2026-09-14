"use client";

import { useCallback, useMemo } from "react";
import { useCart } from "@payloadcms/plugin-ecommerce/client/react";

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
    (line: StoreCartLine) =>
      addItem(pluginCartAddItem(line) as never, line.quantity),
    [addItem]
  );

  const remove = useCallback(
    (line: StoreCartLine) =>
      line.itemId ? removeItem(line.itemId) : Promise.resolve(),
    [removeItem]
  );

  const clear = useCallback(() => clearCart(), [clearCart]);
  const increment = useCallback(
    (line: StoreCartLine) =>
      line.itemId ? incrementItem(line.itemId) : Promise.resolve(),
    [incrementItem]
  );
  const decrement = useCallback(
    (line: StoreCartLine) =>
      line.itemId ? decrementItem(line.itemId) : Promise.resolve(),
    [decrementItem]
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
    isLoading
  };
}
