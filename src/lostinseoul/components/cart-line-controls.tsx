"use client";

import { useTranslations } from "next-intl";
import { useRef } from "react";
import {
  useStoreCart,
  type StoreCartLine
} from "@/lib/lost-commerce/useStoreCart";

const buttonClass =
  "min-h-[44px] min-w-[44px] rounded-[4px] border border-[var(--lost-cart-line)] px-3 py-2 text-[1.2rem] leading-none text-[var(--lost-cart-muted)] disabled:cursor-not-allowed disabled:opacity-60";

export function CartLineControls({ line }: { line: StoreCartLine }) {
  const { increment, decrement, remove, isLoading, pending, unconfirmed } =
    useStoreCart();
  const t = useTranslations("LOSTINSEOUL.cart");
  const quantityRef = useRef<HTMLOutputElement>(null);
  const disabled = isLoading || unconfirmed || !line.itemId;
  function change(kind: "increase" | "decrease" | "remove") {
    if (disabled) return;
    // The clicked button becomes disabled during the request. Keep keyboard focus
    // within the controls instead of letting the browser move it to the body.
    quantityRef.current?.focus();
    return kind === "increase"
      ? increment(line)
      : kind === "decrease"
        ? decrement(line)
        : remove(line);
  }
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
          ref={quantityRef}
          tabIndex={-1}
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
