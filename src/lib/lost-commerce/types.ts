export type LostOrderMode =
  | "standard_purchase"
  | "request_to_order"
  | "private_order";

export type LostCurrency = "KRW" | "USD" | "JPY" | "EUR";

export type LostCartLineInput = {
  productId: string;
  variantId?: string;
  mode: LostOrderMode;
  quantity: number;
  campaignId?: string;
};

export type LostCartLineSnapshot = LostCartLineInput & {
  productName: string;
  productSlug: string;
  variantLabel?: string;
  currency: LostCurrency;
  unitAmount: number;
  lineAmount: number;
};

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
