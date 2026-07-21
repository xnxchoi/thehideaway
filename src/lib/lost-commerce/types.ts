export type LostOrderMode =
  "standard_purchase" | "request_to_order" | "private_order";

export type LostCurrency = "KRW" | "USD" | "JPY" | "EUR";

export type LostCartLineInput = {
  productId: string;
  skuId?: string;
  variantId?: string;
  mode: LostOrderMode;
  quantity: number;
  campaignId?: string;
};

export type LostCartLineSnapshot = LostCartLineInput & {
  schemaVersion: 2;
  productName: string;
  productSlug: string;
  skuId: string;
  variantId: string;
  sku: string;
  skuLabel: string | null;
  options: readonly Readonly<{ key: string; value: string }>[];
  currency: LostCurrency;
  unitAmount: number;
  lineAmount: number;
  weightGrams: number | null;
  dimensions: Readonly<{
    lengthMm: number | null;
    widthMm: number | null;
    heightMm: number | null;
  }> | null;
  taxCategory: string | null;
};

type LostPrivateQuoteLineBase = Omit<
  LostCartLineSnapshot,
  "campaignId" | "lineAmount" | "mode" | "unitAmount"
> & {
  mode: "private_order";
  campaignId?: never;
};

export type LostPrivateQuoteLineSnapshot = LostPrivateQuoteLineBase &
  (
    | { unitAmount: number; lineAmount: number }
    | { unitAmount: null; lineAmount: null }
  );

export type LostCheckoutInput = {
  lines: LostCartLineInput[];
  paymentProvider: "portone" | "manual";
  paymentChannel?: string;
  paymentMethod?: string;
  shipping?: Record<string, unknown>;
  contact?: Record<string, unknown>;
};

export type LostPrivateQuoteInput = {
  productId: string;
  skuId?: string;
  variantId?: string;
  quantity: number;
  note?: string;
  shipping?: Record<string, unknown>;
  contact?: Record<string, unknown>;
};

export type LostResolvedCheckout = {
  mode: LostOrderMode;
  campaignId?: string;
  currency: LostCurrency;
  subtotalAmount: number;
  totalAmount: number;
  lines: LostCartLineSnapshot[];
};
