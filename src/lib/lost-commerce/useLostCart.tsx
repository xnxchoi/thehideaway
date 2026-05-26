"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { LostCartLineInput } from "./types";

const STORAGE_KEY = "lostinseoul.cart.v1";

export type LostCartLineClient = LostCartLineInput & {
  productName: string;
  productSlug: string;
  price: string;
  unitAmount: number;
  currency: "KRW" | "USD" | "JPY" | "EUR";
  imageUrl?: string | null;
};

function keyFor(line: LostCartLineInput): string {
  return [
    line.productId,
    line.variantId ?? "",
    line.mode,
    line.campaignId ?? ""
  ].join(":");
}

function readCart(): LostCartLineClient[] {
  if (typeof window === "undefined") return [];
  try {
    const parsed = JSON.parse(window.localStorage.getItem(STORAGE_KEY) ?? "[]");
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeCart(lines: LostCartLineClient[]) {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(lines));
  window.dispatchEvent(new CustomEvent("lostinseoul-cart"));
}

async function syncCart(lines: LostCartLineClient[]) {
  await fetch("/api/lost/cart", {
    method: "PATCH",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      lines: lines.map(({ productName, productSlug, price, unitAmount, currency, imageUrl, ...line }) => line)
    })
  }).catch(() => undefined);
}

export function useLostCart() {
  const [lines, setLines] = useState<LostCartLineClient[]>([]);

  useEffect(() => {
    setLines(readCart());
    const onStorage = () => setLines(readCart());
    window.addEventListener("storage", onStorage);
    window.addEventListener("lostinseoul-cart", onStorage);
    return () => {
      window.removeEventListener("storage", onStorage);
      window.removeEventListener("lostinseoul-cart", onStorage);
    };
  }, []);

  const replace = useCallback((next: LostCartLineClient[]) => {
    writeCart(next);
    setLines(next);
    void syncCart(next);
  }, []);

  const add = useCallback(
    (line: LostCartLineClient) => {
      const current = readCart();
      const existing = current.findIndex((item) => keyFor(item) === keyFor(line));
      const next =
        existing >= 0
          ? current.map((item, index) =>
              index === existing
                ? { ...item, quantity: item.quantity + line.quantity }
                : item
            )
          : [...current, line];
      replace(next);
    },
    [replace]
  );

  const remove = useCallback(
    (line: LostCartLineClient) => {
      replace(readCart().filter((item) => keyFor(item) !== keyFor(line)));
    },
    [replace]
  );

  const clear = useCallback(() => replace([]), [replace]);

  const total = useMemo(
    () => lines.reduce((sum, line) => sum + line.unitAmount * line.quantity, 0),
    [lines]
  );

  return { lines, add, remove, clear, total, count: lines.length };
}
