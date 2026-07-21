import {
  LOST_PENDING_PAYMENT_STORAGE_KEY,
  type PendingProductPayment
} from "@/lib/lost-commerce/payment-recovery";

const STORAGE_KEY = "lostinseoul.checkout.command";
const KEY_PATTERN = /^[A-Za-z0-9_-]{16,128}$/;

type CheckoutCommandStorage = Pick<
  Storage,
  "getItem" | "setItem" | "removeItem"
>;

export type CheckoutIntentSuccess = {
  ok: true;
  order: { id: string; order_ref: string };
  paymentProvider: "portone" | "manual";
  portone: Record<string, unknown> | null;
};

export function checkoutCompletionAction(
  provider: "portone" | "manual"
): "reconcile" | "manual-pending" {
  return provider === "portone" ? "reconcile" : "manual-pending";
}

export function parseCheckoutIntentSuccess(
  body: unknown,
  expectedProvider: "portone" | "manual"
): CheckoutIntentSuccess | null {
  if (!body || typeof body !== "object" || Array.isArray(body)) return null;
  const value = body as Record<string, unknown>;
  if (value.ok !== true || value.paymentProvider !== expectedProvider) {
    return null;
  }
  if (
    !value.order ||
    typeof value.order !== "object" ||
    Array.isArray(value.order)
  ) {
    return null;
  }
  const order = value.order as Record<string, unknown>;
  if (
    typeof order.id !== "string" ||
    order.id.length === 0 ||
    typeof order.order_ref !== "string" ||
    order.order_ref.length === 0
  ) {
    return null;
  }
  const portone = value.portone;
  if (
    expectedProvider === "portone" &&
    (!portone || typeof portone !== "object" || Array.isArray(portone))
  ) {
    return null;
  }
  if (expectedProvider === "manual" && portone !== null) return null;

  return {
    ok: true,
    order: { id: order.id, order_ref: order.order_ref },
    paymentProvider: expectedProvider,
    portone:
      expectedProvider === "portone"
        ? (portone as Record<string, unknown>)
        : null
  };
}

export function checkoutCommandFailureAction(
  status: number,
  body: unknown
): "clear" | "retain" {
  if (status < 400 || status >= 500 || !body || typeof body !== "object") {
    return "retain";
  }
  const error = (body as { error?: unknown }).error;
  if (typeof error !== "string" || error === "idempotency-in-progress") {
    return "retain";
  }
  return "clear";
}

function commandStorage(): CheckoutCommandStorage {
  return globalThis.sessionStorage;
}

async function sha256(value: string): Promise<string> {
  const bytes = new TextEncoder().encode(value);
  const digest = await globalThis.crypto.subtle.digest("SHA-256", bytes);
  return [...new Uint8Array(digest)]
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

function newKey(): string {
  return globalThis.crypto.randomUUID();
}

export async function checkoutIdempotencyKey(
  serializedCommand: string,
  storage: CheckoutCommandStorage = commandStorage()
): Promise<string> {
  const inputHash = await sha256(serializedCommand);
  const stored = storage.getItem(STORAGE_KEY);
  if (stored) {
    try {
      const parsed = JSON.parse(stored) as {
        inputHash?: unknown;
        key?: unknown;
      };
      if (
        parsed.inputHash === inputHash &&
        typeof parsed.key === "string" &&
        KEY_PATTERN.test(parsed.key)
      ) {
        return parsed.key;
      }
    } catch {
      // Replace invalid session data below.
    }
  }

  const key = newKey();
  storage.setItem(STORAGE_KEY, JSON.stringify({ inputHash, key }));
  return key;
}

export function clearCheckoutIdempotencyKey(
  storage: CheckoutCommandStorage = commandStorage()
): void {
  storage.removeItem(STORAGE_KEY);
}

export function replaceCheckoutCommandWithPendingPayment(
  payment: PendingProductPayment,
  storage: CheckoutCommandStorage = commandStorage()
): void {
  storage.setItem(LOST_PENDING_PAYMENT_STORAGE_KEY, JSON.stringify(payment));
  storage.removeItem(STORAGE_KEY);
}
