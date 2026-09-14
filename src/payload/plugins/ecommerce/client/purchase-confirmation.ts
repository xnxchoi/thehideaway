import { LOST_PENDING_PAYMENT_STORAGE_KEY } from "@/lib/lost-commerce/payment-recovery";
import {
  pluginConfirmOrderRef,
  pluginPortOnePaymentId
} from "./portone-checkout";

export type PurchasePayment = {
  orderRef: string;
  paymentId: string;
  cartID: string;
  customerID?: string;
  purchaseAccessToken?: string;
  retryPayment?: boolean;
};
type Storage = Pick<globalThis.Storage, "getItem" | "setItem" | "removeItem">;
type OfficialConfirm = (
  provider: string,
  options: { additionalData: Record<string, unknown> }
) => Promise<unknown>;
export type PurchaseConfirmation = {
  orderRef: string;
  paymentStatus: string;
  reconciliationRequired: boolean;
  attemptStatus?: string;
};
const attemptReceiptKey = (paymentId: string) =>
  `lostinseoul.purchase-attempt.v1:${paymentId}`;
const receiptKey = (orderRef: string) =>
  `lostinseoul.purchase-receipt.v1:${orderRef}`;

function isRecord(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === "object" && !Array.isArray(value);
}
function parsePayment(value: unknown): PurchasePayment | null {
  if (
    !isRecord(value) ||
    typeof value.orderRef !== "string" ||
    !value.orderRef ||
    typeof value.paymentId !== "string" ||
    !value.paymentId ||
    typeof value.cartID !== "string" ||
    !value.cartID
  )
    return null;
  if (
    value.purchaseAccessToken !== undefined &&
    (typeof value.purchaseAccessToken !== "string" ||
      !value.purchaseAccessToken)
  )
    return null;
  return {
    orderRef: value.orderRef,
    paymentId: value.paymentId,
    cartID: value.cartID,
    ...(typeof value.customerID === "string" && value.customerID
      ? { customerID: value.customerID }
      : {}),
    ...(value.retryPayment === true ? { retryPayment: true } : {}),
    ...(value.purchaseAccessToken
      ? { purchaseAccessToken: value.purchaseAccessToken as string }
      : {})
  };
}
export function purchasePaymentFromInitiation(
  value: unknown,
  cartID: string
): PurchasePayment | null {
  if (!isRecord(value)) return null;
  return parsePayment({
    paymentId: pluginPortOnePaymentId(value),
    orderRef: pluginConfirmOrderRef(value),
    cartID: typeof value.cartID === "string" ? value.cartID : cartID,
    purchaseAccessToken: value.purchaseAccessToken,
    customerID: value.customerID
  });
}

/** Session storage is transport for a server-verified capability, never proof of payment. */
export function readPurchasePayment(
  orderRef?: string,
  storage?: Storage
): PurchasePayment | null {
  try {
    const store = storage ?? globalThis.sessionStorage;
    const value = parsePayment(
      JSON.parse(
        store.getItem(
          orderRef ? receiptKey(orderRef) : LOST_PENDING_PAYMENT_STORAGE_KEY
        ) ?? "null"
      )
    );
    if (value && (!orderRef || value.orderRef === orderRef)) return value;
    if (orderRef) {
      const attempt = storedPayment(attemptReceiptKey(orderRef), store);
      if (attempt?.paymentId === orderRef) return attempt;
      const pending = readPurchasePayment(undefined, store);
      return pending?.orderRef === orderRef ? pending : null;
    }
    return null;
  } catch {
    return null;
  }
}
const ownerPendingKey = (customerID?: string | null) =>
  `lostinseoul.pending-purchase.v1:${customerID ?? "guest"}`;
function storedPayment(key: string, storage: Storage): PurchasePayment | null {
  try {
    return parsePayment(JSON.parse(storage.getItem(key) ?? "null"));
  } catch {
    return null;
  }
}
export function canRecoverPurchase(
  payment: PurchasePayment | null,
  viewerID?: string | null
): payment is PurchasePayment {
  return (
    !!payment &&
    (payment.customerID
      ? payment.customerID === viewerID
      : !!payment.purchaseAccessToken)
  );
}
export function readPendingPurchaseForViewer(
  viewerID?: string | null,
  storage?: Storage
): PurchasePayment | null {
  try {
    const store = storage ?? globalThis.sessionStorage;
    const latest = readPurchasePayment(undefined, store);
    if (canRecoverPurchase(latest, viewerID)) return latest;
    const own = viewerID
      ? storedPayment(ownerPendingKey(viewerID), store)
      : null;
    if (canRecoverPurchase(own, viewerID)) return own;
    const guest = storedPayment(ownerPendingKey(), store);
    if (canRecoverPurchase(guest, viewerID)) return guest;
    return null;
  } catch {
    return null;
  }
}
export function rememberPurchaseRecord(
  payment: PurchasePayment,
  storage: Storage = globalThis.sessionStorage
): void {
  storage.setItem(receiptKey(payment.orderRef), JSON.stringify(payment));
  storage.setItem(
    attemptReceiptKey(payment.paymentId),
    JSON.stringify(payment)
  );
}
export function rememberPurchasePayment(
  payment: PurchasePayment,
  storage: Storage = globalThis.sessionStorage
): void {
  rememberPurchaseRecord(payment, storage);
  storage.setItem(ownerPendingKey(payment.customerID), JSON.stringify(payment));
  storage.setItem(LOST_PENDING_PAYMENT_STORAGE_KEY, JSON.stringify(payment));
}
/** A delayed outcome may only change pointers which still identify that exact attempt. */
export function markPurchaseRetryable(
  payment: PurchasePayment,
  storage: Storage = globalThis.sessionStorage
): void {
  const retry = { ...payment, retryPayment: true };
  const record = storedPayment(receiptKey(payment.orderRef), storage);
  if (record?.paymentId === payment.paymentId)
    rememberPurchaseRecord(retry, storage);
  for (const key of [
    LOST_PENDING_PAYMENT_STORAGE_KEY,
    ownerPendingKey(payment.customerID)
  ]) {
    if (storedPayment(key, storage)?.paymentId === payment.paymentId)
      storage.setItem(key, JSON.stringify(retry));
  }
}
export function rememberPurchaseReceipt(
  payment: PurchasePayment,
  storage: Storage = globalThis.sessionStorage
): void {
  const record = storedPayment(receiptKey(payment.orderRef), storage);
  if (!record || record.paymentId === payment.paymentId)
    rememberPurchaseRecord(payment, storage);
  for (const key of [
    LOST_PENDING_PAYMENT_STORAGE_KEY,
    ownerPendingKey(payment.customerID)
  ]) {
    if (storedPayment(key, storage)?.paymentId === payment.paymentId)
      storage.removeItem(key);
  }
}

export async function confirmPurchase(
  payment: PurchasePayment,
  options: {
    currentCartID?: string | number | null;
    officialConfirm?: OfficialConfirm;
    fetcher?: typeof fetch;
  } = {}
): Promise<PurchaseConfirmation> {
  const additionalData = {
    paymentId: payment.paymentId,
    cartID: payment.cartID,
    ...(payment.purchaseAccessToken
      ? { purchaseAccessToken: payment.purchaseAccessToken }
      : {})
  };
  let result: unknown;
  if (options.currentCartID && options.officialConfirm) {
    result = await options.officialConfirm("portone", { additionalData });
  } else {
    // The vendor hook refuses requests after cart removal. This uses its same registered route.
    const response = await (options.fetcher ?? fetch)(
      "/api/payments/portone/confirm-order",
      {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(additionalData),
        cache: "no-store"
      }
    );
    if (!response.ok) throw new Error(await response.text());
    result = await response.json();
  }
  if (
    !isRecord(result) ||
    result.error ||
    pluginConfirmOrderRef(result) !== payment.orderRef ||
    typeof result.paymentStatus !== "string"
  )
    throw new Error("checkout-confirmation-unavailable");
  return {
    orderRef: payment.orderRef,
    paymentStatus: result.paymentStatus,
    reconciliationRequired: result.reconciliationRequired === true,
    ...(typeof result.attemptStatus === "string"
      ? { attemptStatus: result.attemptStatus }
      : {})
  };
}

export function checkoutErrorKey(
  error: unknown
): "failed" | "totalChanged" | "unavailable" | "accessDenied" | "rateLimited" {
  let code = error instanceof Error ? error.message : "";
  try {
    const parsed: unknown = JSON.parse(code);
    if (isRecord(parsed) && typeof parsed.error === "string")
      code = parsed.error;
  } catch {
    /* Vendor errors can already be machine codes. */
  }
  if (code === "checkout-rate-limited") return "rateLimited";
  if (["checkout-total-changed", "checkout-review-required"].includes(code))
    return "totalChanged";
  if (
    [
      "checkout-origin-forbidden",
      "checkout-access-denied",
      "checkout-forbidden",
      "purchase-access-denied"
    ].includes(code)
  )
    return "accessDenied";
  if (
    [
      "checkout-product-unavailable",
      "checkout-variant-unavailable",
      "checkout-price-unavailable"
    ].includes(code)
  )
    return "unavailable";
  return "failed";
}
