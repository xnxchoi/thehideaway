import { createHash } from "node:crypto";
import { nanoid } from "nanoid";

import {
  createMoneySnapshot,
  parseCreateOrderCommand,
  type CommercePaymentMethod,
  type CreateOrderCommand
} from "./contracts";
import type { CommerceOrderStatus } from "./order-transitions";

export type CommerceProductRecord = Readonly<{
  id: string;
  name: string;
  slug: string;
  active: boolean;
  currency: "KRW";
  unitAmount: number;
  maxQuantity: number;
}>;

export type CommercePaymentStatus = "pending" | "paid" | "failed" | "canceled";

export type CommerceOrderRecord = Readonly<{
  id: string;
  ref: string;
  userId: string;
  productId: string;
  productName: string;
  productSlug: string;
  quantity: number;
  unitAmount: number;
  totalAmount: number;
  currency: "KRW";
  paymentMethod: CommercePaymentMethod;
  paymentStatus: CommercePaymentStatus;
  status: CommerceOrderStatus;
  idempotencyKey: string;
  requestHash: string;
  providerPaymentId?: string;
  providerTransactionId?: string;
  bankTransferReference?: string;
}>;

export type NewCommerceOrder = Omit<CommerceOrderRecord, "id"> &
  Readonly<{
    contact: Readonly<Record<string, string>>;
    shipping: Readonly<Record<string, string>>;
  }>;

export interface CommerceRepository {
  findActiveProduct(id: string): Promise<CommerceProductRecord | null>;
  findOrderByIdempotencyKey(key: string): Promise<CommerceOrderRecord | null>;
  findOrderByRef(ref: string): Promise<CommerceOrderRecord | null>;
  findOrderByProviderPaymentId(
    paymentId: string
  ): Promise<CommerceOrderRecord | null>;
  createOrder(input: NewCommerceOrder): Promise<CommerceOrderRecord>;
  updateOrderLifecycle(
    id: string,
    change: Readonly<{
      paymentStatus?: CommercePaymentStatus;
      status?: CommerceOrderStatus;
      providerTransactionId?: string;
      trackingNumber?: string;
      paidAt?: string;
      shippedAt?: string;
      completedAt?: string;
    }>
  ): Promise<CommerceOrderRecord>;
}

export type CommerceOrderProjection = Readonly<{
  ref: string;
  product: Readonly<{ id: string; name: string; slug: string }>;
  quantity: number;
  money: Readonly<{
    currency: "KRW";
    unitAmount: number;
    totalAmount: number;
  }>;
  paymentMethod: CommercePaymentMethod;
  paymentStatus: CommercePaymentStatus;
  status: CommerceOrderStatus;
}>;

export type CreateCommerceOrderResult = Readonly<{
  order: CommerceOrderProjection;
  nextAction:
    | Readonly<{ type: "card"; paymentId: string }>
    | Readonly<{ type: "bank_transfer"; reference: string }>;
}>;

type CreateOrderRequest = Readonly<{
  userId: string;
  command: CreateOrderCommand;
  contact: Readonly<Record<string, string>>;
  shipping: Readonly<Record<string, string>>;
}>;

function canonicalize(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(canonicalize);
  if (!value || typeof value !== "object") return value;
  return Object.fromEntries(
    Object.entries(value as Record<string, unknown>)
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([key, child]) => [key, canonicalize(child)])
  );
}

export function hashCreateOrderRequest(input: CreateOrderRequest): string {
  return createHash("sha256")
    .update(JSON.stringify(canonicalize(input)))
    .digest("hex");
}

function validateIdempotencyKey(value: string): string {
  const key = value.trim();
  if (key.length < 16 || key.length > 128 || !/^[A-Za-z0-9._:-]+$/.test(key)) {
    throw new Error("invalid-idempotency-key");
  }
  return key;
}

export function projectCommerceOrder(
  order: CommerceOrderRecord
): CommerceOrderProjection {
  return Object.freeze({
    ref: order.ref,
    product: Object.freeze({
      id: order.productId,
      name: order.productName,
      slug: order.productSlug
    }),
    quantity: order.quantity,
    money: Object.freeze({
      currency: order.currency,
      unitAmount: order.unitAmount,
      totalAmount: order.totalAmount
    }),
    paymentMethod: order.paymentMethod,
    paymentStatus: order.paymentStatus,
    status: order.status
  });
}

function resultFor(order: CommerceOrderRecord): CreateCommerceOrderResult {
  const nextAction =
    order.paymentMethod === "card"
      ? Object.freeze({
          type: "card" as const,
          paymentId: order.providerPaymentId ?? ""
        })
      : Object.freeze({
          type: "bank_transfer" as const,
          reference: order.bankTransferReference ?? order.ref
        });
  if (nextAction.type === "card" && !nextAction.paymentId) {
    throw new Error("card-payment-id-missing");
  }
  return Object.freeze({ order: projectCommerceOrder(order), nextAction });
}

export async function createCommerceOrder(
  input: CreateOrderRequest & {
    repository: CommerceRepository;
    idempotencyKey: string;
  }
): Promise<CreateCommerceOrderResult> {
  const command = parseCreateOrderCommand(input.command);
  const idempotencyKey = validateIdempotencyKey(input.idempotencyKey);
  const requestHash = hashCreateOrderRequest({
    userId: input.userId,
    command,
    contact: input.contact,
    shipping: input.shipping
  });
  const existing =
    await input.repository.findOrderByIdempotencyKey(idempotencyKey);
  if (existing) {
    if (existing.requestHash !== requestHash) {
      throw new Error("idempotency-conflict");
    }
    return resultFor(existing);
  }

  const product = await input.repository.findActiveProduct(command.productId);
  if (!product?.active || product.currency !== "KRW") {
    throw new Error("product-unavailable");
  }
  if (command.quantity > product.maxQuantity) {
    throw new Error("quantity-unavailable");
  }
  const money = createMoneySnapshot({
    unitAmount: product.unitAmount,
    quantity: command.quantity
  });
  const ref = `ORD-${nanoid(16)}`;
  const newOrder: NewCommerceOrder = Object.freeze({
    ref,
    userId: input.userId,
    productId: product.id,
    productName: product.name,
    productSlug: product.slug,
    quantity: command.quantity,
    unitAmount: money.unitAmount,
    totalAmount: money.totalAmount,
    currency: money.currency,
    paymentMethod: command.paymentMethod,
    paymentStatus: "pending",
    status: "awaiting_payment",
    idempotencyKey,
    requestHash,
    providerPaymentId: command.paymentMethod === "card" ? ref : undefined,
    bankTransferReference:
      command.paymentMethod === "bank_transfer" ? ref : undefined,
    contact: Object.freeze({ ...input.contact }),
    shipping: Object.freeze({ ...input.shipping })
  });

  try {
    return resultFor(await input.repository.createOrder(newOrder));
  } catch (error) {
    const raced =
      await input.repository.findOrderByIdempotencyKey(idempotencyKey);
    if (raced?.requestHash === requestHash) return resultFor(raced);
    throw error;
  }
}
