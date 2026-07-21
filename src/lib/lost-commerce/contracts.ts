import type {
  LostCartLineSnapshot,
  LostCurrency,
  LostPrivateQuoteLineSnapshot
} from "./types";

const COMMERCE_CURRENCIES = [
  "KRW",
  "USD",
  "JPY",
  "EUR"
] as const satisfies readonly LostCurrency[];

const commerceCurrencySet = new Set<string>(COMMERCE_CURRENCIES);

export type CommerceMoney = Readonly<{
  amount: number;
  currency: LostCurrency;
}>;

export type CommerceTotalsInput = {
  currency: LostCurrency;
  subtotalAmount: number;
  discountAmount: number;
  shippingAmount: number;
  taxAmount: number;
  totalAmount: number;
};

export type CommerceTotalsSnapshot = Readonly<CommerceTotalsInput>;

function assertCommerceAmount(amount: number): void {
  if (!Number.isSafeInteger(amount) || amount < 0) {
    throw new Error("invalid-commerce-amount");
  }
}

function assertCommerceCurrency(
  currency: string
): asserts currency is LostCurrency {
  if (!commerceCurrencySet.has(currency)) {
    throw new Error("invalid-commerce-currency");
  }
}

export function createCommerceMoney(
  amount: number,
  currency: LostCurrency
): CommerceMoney {
  assertCommerceAmount(amount);
  assertCommerceCurrency(currency);

  return Object.freeze({ amount, currency });
}

export function createCommerceTotalsSnapshot(
  input: CommerceTotalsInput
): CommerceTotalsSnapshot {
  assertCommerceCurrency(input.currency);
  assertCommerceAmount(input.subtotalAmount);
  assertCommerceAmount(input.discountAmount);
  assertCommerceAmount(input.shippingAmount);
  assertCommerceAmount(input.taxAmount);
  assertCommerceAmount(input.totalAmount);

  const calculatedTotal =
    input.subtotalAmount -
    input.discountAmount +
    input.shippingAmount +
    input.taxAmount;

  if (calculatedTotal !== input.totalAmount) {
    throw new Error("commerce-totals-mismatch");
  }

  return Object.freeze({
    currency: input.currency,
    subtotalAmount: input.subtotalAmount,
    discountAmount: input.discountAmount,
    shippingAmount: input.shippingAmount,
    taxAmount: input.taxAmount,
    totalAmount: input.totalAmount
  });
}

export function createPrivateQuoteLineSnapshot(
  line: LostCartLineSnapshot
): LostPrivateQuoteLineSnapshot {
  if (line.mode !== "private_order") {
    throw new Error("private-quote-line-required");
  }
  if (line.campaignId !== undefined) {
    throw new Error("campaign-not-allowed");
  }
  if (!Number.isSafeInteger(line.quantity) || line.quantity < 1) {
    throw new Error("invalid-private-quote-amount");
  }
  assertCommerceAmount(line.unitAmount);
  assertCommerceAmount(line.lineAmount);

  const { campaignId: _campaignId, ...privateLine } = line;
  if (line.unitAmount === 0 && line.lineAmount === 0) {
    return Object.freeze({
      ...privateLine,
      mode: "private_order" as const,
      unitAmount: null,
      lineAmount: null
    });
  }
  if (
    line.unitAmount === 0 ||
    line.lineAmount !== line.unitAmount * line.quantity
  ) {
    throw new Error("invalid-private-quote-amount");
  }

  return Object.freeze({
    ...privateLine,
    mode: "private_order" as const,
    unitAmount: line.unitAmount,
    lineAmount: line.lineAmount
  });
}
