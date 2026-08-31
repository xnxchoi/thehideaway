"use client";

import { useCallback, useMemo } from "react";
import { useCart } from "@payloadcms/plugin-ecommerce/client/react";

import type { LostCartLineInput } from "./types";
import {
  mapPluginCartLines,
  pluginCartAddItem
} from "@/payload/plugins/ecommerce/client/map-cart-lines";

export type LostCartLineClient = LostCartLineInput & {
  itemId?: string;
  productName: string;
  productSlug: string;
  variantLabel?: string;
  price: string;
  unitAmount: number;
  currency: "KRW" | "USD" | "JPY" | "EUR";
  imageUrl?: string | null;
};

export function serializeLostCartLines(
  lines: LostCartLineClient[]
): LostCartLineInput[] {
  return lines.map((line) => ({
    productId: line.productId,
    skuId: line.skuId,
    mode: line.mode,
    quantity: line.quantity,
    campaignId: line.campaignId
  }));
}

export function useLostCart() {
  const { addItem, cart, clearCart, isLoading, removeItem } = useCart();
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
    (line: LostCartLineClient) =>
      addItem(pluginCartAddItem(line) as never, line.quantity),
    [addItem]
  );

  const remove = useCallback(
    (line: LostCartLineClient) =>
      line.itemId ? removeItem(line.itemId) : Promise.resolve(),
    [removeItem]
  );

  const clear = useCallback(() => clearCart(), [clearCart]);

  return { lines, add, remove, clear, total, count, isLoading };
}
