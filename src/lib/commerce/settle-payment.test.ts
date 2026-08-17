import { describe, expect, it, vi } from "vitest";

import type { CommerceOrderRecord, CommerceRepository } from "./create-order";
import {
  settleBankTransfer,
  settleCardPayment,
  type CardPaymentGateway
} from "./settle-payment";

const pendingCard: CommerceOrderRecord = {
  id: "order-1",
  ref: "ORD-12345678",
  userId: "owner-1",
  productId: "product-1",
  productName: "Product",
  productSlug: "product",
  quantity: 2,
  unitAmount: 10_000,
  totalAmount: 20_000,
  currency: "KRW",
  paymentMethod: "card",
  paymentStatus: "pending",
  status: "awaiting_payment",
  idempotencyKey: "idem-123456789012",
  requestHash: "hash",
  providerPaymentId: "PAY-123"
};

function repository(order: CommerceOrderRecord): CommerceRepository {
  return {
    findActiveProduct: vi.fn(),
    findOrderByIdempotencyKey: vi.fn(),
    findOrderByRef: vi.fn().mockResolvedValue(order),
    findOrderByProviderPaymentId: vi.fn().mockResolvedValue(order),
    createOrder: vi.fn(),
    updateOrderLifecycle: vi.fn().mockImplementation(async (_id, change) => ({
      ...order,
      ...change
    }))
  };
}

const paidGateway: CardPaymentGateway = {
  getPayment: vi.fn().mockResolvedValue({
    status: "PAID",
    amount: { total: 20_000, paid: 20_000 },
    currency: "KRW",
    channel: { type: "TEST" },
    transactionId: "txn-1",
    paidAt: "2026-08-15T00:00:00.000Z"
  }),
  requireLiveChannel: false
};

describe("minimal commerce payment settlement", () => {
  it("marks an authoritatively verified card order paid", async () => {
    const repo = repository(pendingCard);
    const result = await settleCardPayment({
      repository: repo,
      gateway: paidGateway,
      paymentId: "PAY-123"
    });

    expect(repo.updateOrderLifecycle).toHaveBeenCalledWith("order-1", {
      paymentStatus: "paid",
      status: "paid",
      providerTransactionId: "txn-1",
      paidAt: "2026-08-15T00:00:00.000Z"
    });
    expect(result.status).toBe("paid");
  });

  it("rejects amount mismatches without updating", async () => {
    const repo = repository(pendingCard);
    const gateway: CardPaymentGateway = {
      ...paidGateway,
      getPayment: vi.fn().mockResolvedValue({
        status: "PAID",
        amount: { total: 1, paid: 1 },
        currency: "KRW",
        channel: { type: "TEST" }
      })
    };

    await expect(
      settleCardPayment({ repository: repo, gateway, paymentId: "PAY-123" })
    ).rejects.toThrow("amount-mismatch");
    expect(repo.updateOrderLifecycle).not.toHaveBeenCalled();
  });

  it("is idempotent after payment is already paid", async () => {
    const paid = {
      ...pendingCard,
      paymentStatus: "paid" as const,
      status: "paid" as const
    };
    const repo = repository(paid);

    const result = await settleCardPayment({
      repository: repo,
      gateway: paidGateway,
      paymentId: "PAY-123"
    });

    expect(result.status).toBe("paid");
    expect(repo.updateOrderLifecycle).not.toHaveBeenCalled();
  });

  it("settles bank transfer only with an evidence reference", async () => {
    const bank = {
      ...pendingCard,
      paymentMethod: "bank_transfer" as const,
      providerPaymentId: undefined,
      bankTransferReference: "ORD-12345678"
    };
    const repo = repository(bank);

    await settleBankTransfer({
      repository: repo,
      orderRef: bank.ref,
      evidenceReference: "BANK-20260815-1"
    });

    expect(repo.updateOrderLifecycle).toHaveBeenCalledWith("order-1", {
      paymentStatus: "paid",
      status: "paid",
      providerTransactionId: "BANK-20260815-1",
      paidAt: expect.any(String)
    });
  });

  it("rejects bank settlement without evidence", async () => {
    const repo = repository({ ...pendingCard, paymentMethod: "bank_transfer" });
    await expect(
      settleBankTransfer({
        repository: repo,
        orderRef: pendingCard.ref,
        evidenceReference: ""
      })
    ).rejects.toThrow("bank-evidence-required");
    expect(repo.updateOrderLifecycle).not.toHaveBeenCalled();
  });
});
