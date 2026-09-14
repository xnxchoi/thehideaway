"use client";

import { useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import {
  useStoreCart,
  type StoreCartLine
} from "@/lib/lost-commerce/useStoreCart";

type PendingChange = { expected: number; settled: boolean };
const buttonClass =
  "min-h-[44px] min-w-[44px] rounded-[4px] border border-[var(--lost-cart-line)] px-3 py-2 text-[1.2rem] leading-none text-[var(--lost-cart-muted)] disabled:cursor-not-allowed disabled:opacity-60";

export function CartLineControls({ line }: { line: StoreCartLine }) {
  const { increment, decrement, remove, isLoading } = useStoreCart();
  const t = useTranslations("LOSTINSEOUL.cart");
  const [pending, setPending] = useState<PendingChange | null>(null);
  const [unconfirmed, setUnconfirmed] = useState(false);
  const busy = useRef(false);
  useEffect(() => {
    if (!pending?.settled || isLoading) return;
    // Vendor mutation methods swallow errors. Only rendered server state confirms success.
    setUnconfirmed(line.quantity !== pending.expected);
    setPending(null);
    busy.current = false;
  }, [isLoading, line.quantity, pending]);

  async function change(kind: "increase" | "decrease" | "remove") {
    if (busy.current || isLoading || unconfirmed || !line.itemId) return;
    busy.current = true;
    const expected =
      kind === "remove" ? 0 : line.quantity + (kind === "increase" ? 1 : -1);
    setPending({ expected, settled: false });
    try {
      await (kind === "increase"
        ? increment(line)
        : kind === "decrease"
          ? decrement(line)
          : remove(line));
    } catch {
      setUnconfirmed(true);
    } finally {
      setPending({ expected, settled: true });
    }
  }

  const disabled = !!pending || isLoading || unconfirmed || !line.itemId;
  return (
    <div className="mt-4 grid gap-3" aria-busy={!!pending}>
      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          className={buttonClass}
          disabled={disabled || line.quantity <= 1}
          aria-label={t("decrease", { product: line.productName })}
          onClick={() => void change("decrease")}
        >
          −
        </button>
        <output
          className="min-w-8 text-center font-sans text-[1.2rem] tabular-nums"
          aria-label={t("quantity")}
          aria-live="polite"
        >
          {line.quantity}
        </output>
        <button
          type="button"
          className={buttonClass}
          disabled={disabled}
          aria-label={t("increase", { product: line.productName })}
          onClick={() => void change("increase")}
        >
          +
        </button>
        <button
          type="button"
          className={buttonClass}
          disabled={disabled}
          aria-label={t("removeLabel", { product: line.productName })}
          onClick={() => void change("remove")}
        >
          {t("remove")}
        </button>
      </div>
      {pending ? (
        <p role="status" className="text-[1.2rem]">
          {t("updating")}
        </p>
      ) : null}
      {unconfirmed ? (
        <div className="grid gap-2">
          <p role="alert" className="text-[1.2rem]">
            {t("updateUnconfirmed")}
          </p>
          <button
            type="button"
            className={buttonClass}
            onClick={() => window.location.reload()}
          >
            {t("reload")}
          </button>
        </div>
      ) : null}
    </div>
  );
}
