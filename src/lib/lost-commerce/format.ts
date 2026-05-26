import type { LostCurrency } from "./types";

export function formatLostMoney(amount: number, currency: LostCurrency): string {
  const locale =
    currency === "KRW" ? "ko-KR" : currency === "JPY" ? "ja-JP" : "en-US";

  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency,
    maximumFractionDigits: currency === "KRW" || currency === "JPY" ? 0 : 2
  }).format(amount);
}

export function makeLostOrderRef(prefix = "lis"): string {
  const random =
    globalThis.crypto?.randomUUID?.().slice(0, 8) ??
    Math.random().toString(36).slice(2, 10);
  return `${prefix}_${Date.now().toString(36)}_${random}`;
}
