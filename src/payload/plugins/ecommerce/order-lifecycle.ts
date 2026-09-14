import { consumeManualFulfillmentWrite } from "./manual-fulfillment-protection";
import type {
  CollectionAfterChangeHook,
  CollectionBeforeChangeHook
} from "payload";
import { isDeepStrictEqual } from "node:util";

import {
  authorizeCommerceLifecycleRequest,
  protectOrderLifecycle
} from "@/lib/lost-commerce/lifecycle-authorization";
import {
  assertOrderTransition,
  isCommerceOrderState,
  type CommerceOrderState,
  ORDER_STATES
} from "@/lib/lost-commerce/transitions";

export const PLUGIN_ORDER_LIFECYCLE_FIELD = "lifecycle_status";
const authorizedOrderRequests = new WeakSet<object>();
type GuestCreationReceipt = { orderID: string; transactionID: unknown };
const guestCreationReceipts = new WeakMap<object, GuestCreationReceipt>();
const guestInitializationReceipts = new WeakMap<object, GuestCreationReceipt>();

export const recordPluginOrderCreated: CollectionAfterChangeHook = ({
  doc,
  operation,
  req
}) => {
  if (
    operation === "create" &&
    authorizedOrderRequests.has(req) &&
    req.transactionID &&
    !doc.customer &&
    doc.guest_access_digest == null
  ) {
    guestCreationReceipts.set(req, {
      orderID: String(doc.id),
      transactionID: req.transactionID
    });
  }
  return doc;
};

export function authorizePluginGuestAccessInitialization(
  req: object,
  orderID: string
): void {
  const receipt = guestCreationReceipts.get(req);
  if (
    !receipt ||
    !authorizedOrderRequests.has(req) ||
    receipt.orderID !== orderID ||
    receipt.transactionID !== (req as { transactionID?: unknown }).transactionID
  ) {
    throw new Error("commerce-guest-initialization-forbidden");
  }
  guestCreationReceipts.delete(req);
  guestInitializationReceipts.set(req, receipt);
}

function consumeGuestInitialization(
  req: object,
  original: Record<string, unknown> | undefined,
  digest: unknown
): boolean {
  const receipt = guestInitializationReceipts.get(req);
  guestInitializationReceipts.delete(req);
  return Boolean(
    receipt &&
    receipt.orderID === String(original?.id) &&
    receipt.transactionID ===
      (req as { transactionID?: unknown }).transactionID &&
    !original?.customer &&
    original?.guest_access_digest == null &&
    typeof digest === "string" &&
    /^[a-f0-9]{64}$/.test(digest)
  );
}

export function pluginStatusFromLifecycle(
  lifecycle: CommerceOrderState
): "pending" | "processing" | "completed" | "cancelled" | "refunded" {
  if (
    ["draft", "quote_requested", "quote_ready", "pending_payment"].includes(
      lifecycle
    )
  )
    return "pending";
  if (lifecycle === "refunded") return "refunded";
  if (lifecycle === "canceled" || lifecycle === "failed") return "cancelled";
  if (lifecycle === "confirmed" || lifecycle === "converted")
    return "completed";
  return "processing";
}

function lifecycleOf(value: unknown): CommerceOrderState | undefined {
  return isCommerceOrderState(value) ? value : undefined;
}

export const protectPluginOrderLifecycle: CollectionBeforeChangeHook = async (
  args
) => {
  const manualFulfillment = consumeManualFulfillmentWrite(args);
  const data = { ...(args.data as Record<string, unknown>) };
  if (args.operation === "create" && data.lifecycle_status === undefined)
    data.lifecycle_status = "pending_payment";
  const original = args.originalDoc as Record<string, unknown> | undefined;
  if (
    args.operation === "create" &&
    !authorizedOrderRequests.has(args.req) &&
    ([
      "checkout_cart",
      "checkout_snapshot",
      "checkout_fingerprint",
      "guest_access_digest",
      "settlement_transaction",
      "settlement_effects"
    ].some((field) => data[field] != null) ||
      data.reconciliation_required === true)
  )
    throw new Error("commerce-lifecycle-create-forbidden");
  if (args.operation === "update") {
    const initializesGuestDigest =
      Object.hasOwn(data, "guest_access_digest") &&
      consumeGuestInitialization(args.req, original, data.guest_access_digest);
    if (
      [
        "checkout_cart",
        "checkout_snapshot",
        "checkout_fingerprint",
        "guest_access_digest",
        "customerEmail"
      ].some(
        (field) =>
          Object.hasOwn(data, field) &&
          !(field === "guest_access_digest" && initializesGuestDigest) &&
          !isDeepStrictEqual(data[field], original?.[field])
      )
    )
      throw new Error("commerce-snapshot-update-forbidden");
    if (
      !authorizedOrderRequests.has(args.req) &&
      [
        "status",
        "settlement_transaction",
        "settlement_effects",
        "reconciliation_required"
      ].some(
        (field) =>
          Object.hasOwn(data, field) &&
          !isDeepStrictEqual(data[field], original?.[field])
      )
    )
      throw new Error("commerce-lifecycle-update-forbidden");
  }
  const proxied = {
    ...args,
    data: {
      ...data,
      status: data.lifecycle_status ?? original?.lifecycle_status,
      ...(manualFulfillment ? { fulfillment_status: original?.fulfillment_status } : {}),
      ...(Object.hasOwn(data, "items") ? { lines: data.items } : {}),
      ...(Object.hasOwn(data, "customer") ? { user: data.customer } : {}),
      ...(Object.hasOwn(data, "amount") ? { total_amount: data.amount } : {}),
      ...(Object.hasOwn(data, "shippingAddress")
        ? { shipping: data.shippingAddress }
        : {})
    },
    originalDoc: original
      ? {
          ...original,
          status: original.lifecycle_status,
          lines: original.items,
          user: original.customer,
          total_amount: original.amount,
          shipping: original.shippingAddress
        }
      : original
  };
  await protectOrderLifecycle(proxied as never);

  if (args.operation === "update") {
    const from = lifecycleOf(original?.lifecycle_status);
    const to = lifecycleOf(data.lifecycle_status) ?? from;
    if (from && to && from !== to) {
      const user = (
        args.req as { user?: { id?: string; role?: string } | null }
      ).user;
      const actor = authorizedOrderRequests.has(args.req)
        ? { kind: "system" as const, id: "portone" }
        : user?.role === "admin" || user?.role === "cofounder"
          ? { kind: "staff" as const, id: user.id ?? "staff", role: user.role }
          : user?.id
            ? { kind: "customer" as const, id: user.id }
            : { kind: "system" as const, id: "portone" };
      assertOrderTransition({ from, to, actor });
    }
  }

  const nextLifecycle = lifecycleOf(data.lifecycle_status);
  if (nextLifecycle) {
    data.status = pluginStatusFromLifecycle(nextLifecycle);
  }
  return data;
};

export function authorizePluginOrderWrite(req: object): void {
  authorizedOrderRequests.add(req);
  authorizeCommerceLifecycleRequest(req);
}

export const pluginOrderLifecycleOptions = [...ORDER_STATES];
