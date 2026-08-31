import { createLocalReq, type Payload } from "payload";

import type {
  CommerceOrderRecord,
  CommerceProductRecord,
  CommerceRepository,
  NewCommerceOrder
} from "./create-order";
import { authorizeCommerceOrderMutation } from "./order-protection";

type PayloadCommerceProduct = {
  id: string;
  name?: string | null;
  slug?: string | null;
  active?: boolean | null;
  unit_amount?: number | null;
  max_quantity?: number | null;
};

type PayloadCommerceOrder = {
  id: string;
  ref: string;
  user?: unknown;
  product?: unknown;
  product_name_snapshot: string;
  product_slug_snapshot: string;
  quantity: number;
  unit_amount_snapshot: number;
  total_amount: number;
  payment_method: string;
  payment_status: string;
  status: string;
  contact: unknown;
  shipping: unknown;
  idempotency_key: string;
  request_hash: string;
  provider_payment_id?: string | null;
  provider_transaction_id?: string | null;
  bank_transfer_reference?: string | null;
  tracking_number?: string | null;
  paid_at?: string | null;
  shipped_at?: string | null;
  completed_at?: string | null;
};

function relationId(value: unknown): string {
  if (typeof value === "string") return value;
  if (typeof value === "number") return String(value);
  if (value && typeof value === "object" && "id" in value) {
    return String((value as { id: unknown }).id);
  }
  return "";
}

function mapProduct(doc: PayloadCommerceProduct): CommerceProductRecord {
  return Object.freeze({
    id: String(doc.id),
    name: String(doc.name ?? ""),
    slug: String(doc.slug ?? ""),
    active: doc.active === true,
    currency: "KRW",
    unitAmount: Number(doc.unit_amount),
    maxQuantity: Number(doc.max_quantity)
  });
}

function mapOrder(doc: PayloadCommerceOrder): CommerceOrderRecord {
  return Object.freeze({
    id: String(doc.id),
    ref: String(doc.ref),
    userId: relationId(doc.user),
    productId: relationId(doc.product),
    productName: String(doc.product_name_snapshot),
    productSlug: String(doc.product_slug_snapshot),
    quantity: Number(doc.quantity),
    unitAmount: Number(doc.unit_amount_snapshot),
    totalAmount: Number(doc.total_amount),
    currency: "KRW",
    paymentMethod: doc.payment_method as CommerceOrderRecord["paymentMethod"],
    paymentStatus: doc.payment_status as CommerceOrderRecord["paymentStatus"],
    status: doc.status as CommerceOrderRecord["status"],
    idempotencyKey: String(doc.idempotency_key),
    requestHash: String(doc.request_hash),
    providerPaymentId:
      typeof doc.provider_payment_id === "string"
        ? doc.provider_payment_id
        : undefined,
    providerTransactionId:
      typeof doc.provider_transaction_id === "string"
        ? doc.provider_transaction_id
        : undefined,
    bankTransferReference:
      typeof doc.bank_transfer_reference === "string"
        ? doc.bank_transfer_reference
        : undefined
  });
}

export function createPayloadCommerceRepository(
  payload: Payload
): CommerceRepository {
  const repository: CommerceRepository = {
    async findActiveProduct(id) {
      const doc = await payload.findByID({
        collection: "commerce-products" as never,
        id,
        depth: 0,
        disableErrors: true,
        overrideAccess: true
      });
      return doc?.active === true ? mapProduct(doc) : null;
    },

    async findOrderByIdempotencyKey(key) {
      const result = await payload.find({
        collection: "commerce-orders" as never,
        depth: 0,
        limit: 1,
        overrideAccess: true,
        where: { idempotency_key: { equals: key } }
      });
      const doc = result.docs[0];
      return doc ? mapOrder(doc) : null;
    },

    async findOrderByRef(ref) {
      const result = await payload.find({
        collection: "commerce-orders" as never,
        depth: 0,
        limit: 1,
        overrideAccess: true,
        where: { ref: { equals: ref } }
      });
      const doc = result.docs[0];
      return doc ? mapOrder(doc) : null;
    },

    async findOrderByProviderPaymentId(paymentId) {
      const result = await payload.find({
        collection: "commerce-orders" as never,
        depth: 0,
        limit: 1,
        overrideAccess: true,
        where: { provider_payment_id: { equals: paymentId } }
      });
      const doc = result.docs[0];
      return doc ? mapOrder(doc) : null;
    },

    async createOrder(input: NewCommerceOrder) {
      const doc = await payload.create({
        collection: "commerce-orders" as never,
        overrideAccess: true,
        data: {
          ref: input.ref,
          user: input.userId,
          product: input.productId,
          product_name_snapshot: input.productName,
          product_slug_snapshot: input.productSlug,
          quantity: input.quantity,
          unit_amount_snapshot: input.unitAmount,
          total_amount: input.totalAmount,
          currency: input.currency,
          payment_method: input.paymentMethod,
          payment_status: input.paymentStatus,
          status: input.status,
          contact: input.contact,
          shipping: input.shipping,
          idempotency_key: input.idempotencyKey,
          request_hash: input.requestHash,
          provider_payment_id: input.providerPaymentId,
          bank_transfer_reference: input.bankTransferReference
        }
      });
      return mapOrder(doc);
    },

    async updateOrderLifecycle(id, change) {
      const req = await createLocalReq({}, payload);
      authorizeCommerceOrderMutation(req);
      const data = {
        ...(change.paymentStatus !== undefined
          ? { payment_status: change.paymentStatus }
          : {}),
        ...(change.status !== undefined ? { status: change.status } : {}),
        ...(change.providerTransactionId !== undefined
          ? { provider_transaction_id: change.providerTransactionId }
          : {}),
        ...(change.trackingNumber !== undefined
          ? { tracking_number: change.trackingNumber }
          : {}),
        ...(change.paidAt !== undefined ? { paid_at: change.paidAt } : {}),
        ...(change.shippedAt !== undefined
          ? { shipped_at: change.shippedAt }
          : {}),
        ...(change.completedAt !== undefined
          ? { completed_at: change.completedAt }
          : {})
      };
      const doc = await payload.update({
        collection: "commerce-orders" as never,
        id,
        overrideAccess: true,
        req,
        data
      });
      return mapOrder(doc);
    }
  };
  return Object.freeze(repository);
}
