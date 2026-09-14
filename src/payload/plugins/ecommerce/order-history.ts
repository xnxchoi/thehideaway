import type { Payload } from "payload";
import { checkoutRelationID } from "./checkout-snapshot";
import { hasPurchaseAccess } from "./purchase-access";

type Data = Record<string, unknown>;
type Database = Pick<Payload, "find">;
const record = (value: unknown): Data =>
  value && typeof value === "object" && !Array.isArray(value)
    ? (value as Data)
    : {};
const text = (value: unknown) => (typeof value === "string" ? value : null);
const amount = (value: unknown) =>
  Number.isSafeInteger(value) ? (value as number) : null;

export function orderHistoryPage(value: unknown = "1"): number {
  if (
    typeof value !== "string" ||
    !/^[1-9]\d{0,4}$/.test(value) ||
    Number(value) > 10000
  )
    throw new Error("invalid-order-page");
  return Number(value);
}

function summary(order: Data) {
  const snapshot = record(order.checkout_snapshot);
  return {
    orderRef: String(order.order_ref),
    createdAt: text(order.createdAt),
    lifecycleStatus: text(order.lifecycle_status) ?? text(order.status),
    paymentStatus: text(order.payment_status),
    fulfillmentStatus: text(order.fulfillment_status),
    currency: text(snapshot.currency) ?? text(order.currency),
    amount: amount(snapshot.amount ?? order.amount)
  };
}

function address(value: unknown) {
  const source = record(value);
  return Object.fromEntries(
    [
      "firstName",
      "lastName",
      "company",
      "addressLine1",
      "addressLine2",
      "city",
      "state",
      "postalCode",
      "country",
      "phone",
      "title"
    ].flatMap((key) =>
      typeof source[key] === "string" ? [[key, source[key] as string]] : []
    )
  );
}

/** Explicit projection keeps provider records, secrets and mutable catalog data off the wire. */
function detail(order: Data) {
  const snapshot = record(order.checkout_snapshot);
  const lines = Array.isArray(snapshot.items)
    ? snapshot.items
    : Array.isArray(order.items)
      ? order.items
      : [];
  return {
    ...summary(order),
    items: lines.map((value, index) => {
      const line = record(value);
      return {
        key: `${String(order.order_ref)}:${index}`,
        productName: text(line.product_name),
        sku: text(line.sku),
        skuLabel: text(line.sku_label),
        quantity: amount(line.quantity),
        unitAmount: amount(line.unit_amount),
        lineAmount: amount(line.line_amount),
        options: (Array.isArray(line.options) ? line.options : []).map(
          (value) => {
            const option = record(value);
            return { label: text(option.label), value: text(option.value) };
          }
        )
      };
    }),
    shippingAddress: address(snapshot.shippingAddress),
    billingAddress: address(snapshot.billingAddress),
    deliveryNote: text(snapshot.deliveryNote),
    shippingAmount: amount(snapshot.shippingAmount),
    taxAmount: amount(snapshot.taxAmount)
  };
}

export type CustomerOrder = ReturnType<typeof detail>;
export type CustomerOrderSummary = ReturnType<typeof summary>;

/** Caller supplies the Better Auth identity; staff roles and email never broaden this filter. */
export async function listCustomerOrders(
  payload: Database,
  customerID?: string,
  pageValue?: unknown
) {
  if (!customerID) throw new Error("order-auth-required");
  const page = orderHistoryPage(pageValue);
  const result = await payload.find({
    collection: "orders",
    depth: 0,
    limit: 20,
    page,
    sort: ["-createdAt", "-id"],
    overrideAccess: true,
    where: { customer: { equals: customerID } },
    select: {
      order_ref: true,
      createdAt: true,
      lifecycle_status: true,
      status: true,
      payment_status: true,
      fulfillment_status: true,
      amount: true,
      currency: true
    }
  });
  return {
    orders: result.docs.map((order) => summary(order as unknown as Data)),
    page,
    totalPages: result.totalPages,
    totalDocs: result.totalDocs,
    hasNextPage: result.hasNextPage,
    hasPrevPage: result.hasPrevPage
  };
}

export async function getCustomerOrder(
  payload: Database,
  {
    orderRef,
    customerID,
    purchaseAccessToken
  }: {
    orderRef: string;
    customerID?: string;
    purchaseAccessToken?: string;
  }
): Promise<CustomerOrder | null> {
  if (
    !orderRef ||
    orderRef.length > 100 ||
    (!customerID && !purchaseAccessToken)
  )
    return null;
  const result = await payload.find({
    collection: "orders",
    depth: 0,
    limit: 1,
    overrideAccess: true,
    showHiddenFields: true,
    where: {
      and: [
        { order_ref: { equals: orderRef } },
        ...(customerID && !purchaseAccessToken
          ? [{ customer: { equals: customerID } }]
          : [])
      ]
    }
  });
  const order = result.docs[0] as unknown as Data | undefined;
  if (!order) return null;
  const owner = checkoutRelationID(order.customer);
  if (
    !(owner
      ? owner === customerID
      : hasPurchaseAccess(purchaseAccessToken, order.guest_access_digest))
  )
    return null;
  return detail(order);
}
