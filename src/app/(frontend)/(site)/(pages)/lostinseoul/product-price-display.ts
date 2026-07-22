import type { LostOrderMode } from "@/lib/lost-commerce/types";
import type { LostCurrency } from "@/lib/lost-commerce/types";
import { formatLostMoney } from "@/lib/lost-commerce/format";

type LostActionableSku = {
  id: string;
  sku?: string | null;
  amount?: number | null;
  inventory?: number | null;
  stockState?: string | null;
  actionableModes?: readonly LostOrderMode[];
};

function hasPositiveAmount(value: unknown): value is number {
  return Number.isSafeInteger(value) && Number(value) >= 1;
}

export function didLostPrivateQuoteSucceed(
  response: Pick<Response, "ok">
): boolean {
  return response.ok;
}

export function getLostProductVariantsForMode<T extends LostActionableSku>(
  variants: readonly T[],
  mode: LostOrderMode | null
): T[] {
  if (!mode) return [];
  return variants.filter((variant) => variant.actionableModes?.includes(mode));
}

export function canUseLostProductActions({
  mode,
  modes,
  privatePresetPriceEnabled,
  privateUnitAmount,
  selectedSku
}: {
  mode: LostOrderMode | null;
  modes: readonly LostOrderMode[];
  privatePresetPriceEnabled?: boolean;
  privateUnitAmount?: number | null;
  selectedSku: LostActionableSku | null | undefined;
}): boolean {
  if (
    !selectedSku?.id.trim() ||
    !selectedSku.sku?.trim() ||
    mode === null ||
    !modes.includes(mode) ||
    !selectedSku.actionableModes?.includes(mode)
  ) {
    return false;
  }

  if (mode === "standard_purchase") {
    return hasPositiveAmount(selectedSku.amount);
  }

  if (mode === "request_to_order") {
    return hasPositiveAmount(selectedSku.amount);
  }

  return privatePresetPriceEnabled === true
    ? hasLostPrivatePresetPrice(true, privateUnitAmount)
    : true;
}

export function hasLostPrivatePresetPrice(
  enabled: boolean | undefined,
  unitAmount: number | null | undefined
): unitAmount is number {
  return (
    enabled === true &&
    typeof unitAmount === "number" &&
    Number.isSafeInteger(unitAmount) &&
    unitAmount >= 1
  );
}

export function getLostProductListingPrice(
  displayPrice: string | null,
  requestQuoteLabel: string,
  modes: readonly LostOrderMode[]
): string {
  const isQuoteOnly = modes.length === 1 && modes[0] === "private_order";
  return displayPrice ?? (isQuoteOnly ? requestQuoteLabel : "");
}

export function getLostProductVariantPrice(
  variants: readonly LostActionableSku[],
  currency: LostCurrency
): string | null {
  const amounts = variants.flatMap((variant) =>
    hasPositiveAmount(variant.amount) ? [variant.amount] : []
  );
  const distinctAmounts = [...new Set(amounts)].sort((a, b) => a - b);
  if (distinctAmounts.length === 0) return null;
  if (distinctAmounts.length === 1) {
    return formatLostMoney(distinctAmounts[0], currency);
  }
  return `${formatLostMoney(distinctAmounts[0], currency)}–${formatLostMoney(
    distinctAmounts[distinctAmounts.length - 1],
    currency
  )}`;
}

export function getLostProductDetailPrice({
  quoteOnly,
  requestQuoteLabel,
  selectedPrice
}: {
  quoteOnly: boolean;
  requestQuoteLabel: string;
  selectedPrice: string | null;
}): string | null {
  return quoteOnly ? requestQuoteLabel : selectedPrice;
}
