import { z } from "zod";

export const COMMERCE_PAYMENT_METHODS = ["card", "bank_transfer"] as const;

export type CommercePaymentMethod = (typeof COMMERCE_PAYMENT_METHODS)[number];

const CreateOrderCommandSchema = z
  .object({
    productId: z.string().trim().min(1).max(128),
    quantity: z.number().int().min(1).max(99),
    paymentMethod: z.enum(COMMERCE_PAYMENT_METHODS)
  })
  .strict();

export type CreateOrderCommand = Readonly<
  z.infer<typeof CreateOrderCommandSchema>
>;

export type CommerceMoneySnapshot = Readonly<{
  currency: "KRW";
  unitAmount: number;
  totalAmount: number;
}>;

export function parseCreateOrderCommand(input: unknown): CreateOrderCommand {
  return Object.freeze({ ...CreateOrderCommandSchema.parse(input) });
}

export function createMoneySnapshot(input: {
  unitAmount: number;
  quantity: number;
}): CommerceMoneySnapshot {
  if (!Number.isSafeInteger(input.unitAmount) || input.unitAmount <= 0) {
    throw new Error("invalid-unit-amount");
  }
  if (
    !Number.isSafeInteger(input.quantity) ||
    input.quantity < 1 ||
    input.quantity > 99
  ) {
    throw new Error("invalid-quantity");
  }

  const totalAmount = input.unitAmount * input.quantity;
  if (!Number.isSafeInteger(totalAmount)) {
    throw new Error("invalid-total-amount");
  }

  return Object.freeze({
    currency: "KRW",
    unitAmount: input.unitAmount,
    totalAmount
  });
}
