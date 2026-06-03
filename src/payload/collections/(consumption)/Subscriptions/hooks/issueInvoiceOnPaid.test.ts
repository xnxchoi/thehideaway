import { describe, expect, it, vi } from "vitest";

import { issueInvoiceOnPaid } from "./issueInvoiceOnPaid";

vi.mock("@/lib/db/sequences", () => ({
  nextInvoiceNumber: vi.fn(async () => 42)
}));

describe("issueInvoiceOnPaid", () => {
  it("uses the subscription money snapshot instead of the current Price row", async () => {
    const find = vi.fn(async ({ collection }) => {
      if (collection === "invoices") return { totalDocs: 0, docs: [] };
      return { totalDocs: 0, docs: [] };
    });
    const findByID = vi.fn(async ({ collection }) => {
      if (collection === "prices") {
        return {
          id: "price-1",
          unit_amount: 99000,
          currency: "currency-edited"
        };
      }
      return null;
    });
    const create = vi.fn(async ({ data }) => ({ id: "invoice-1", ...data }));

    await issueInvoiceOnPaid({
      doc: {
        id: "sub-1",
        paid: true,
        subscription_status: "active",
        user: "user-1",
        plan: "plan-1",
        price: "price-1",
        amount: 33000,
        currency: "currency-krw",
        start_date: "2026-06-01T00:00:00.000Z",
        request_method: "bank_transfer"
      },
      previousDoc: {
        id: "sub-1",
        paid: false,
        subscription_status: "pending"
      },
      req: {
        payload: {
          find,
          findByID,
          create,
          logger: { info: vi.fn(), error: vi.fn() }
        }
      }
    } as never);

    expect(findByID).not.toHaveBeenCalledWith(
      expect.objectContaining({ collection: "prices" })
    );
    expect(create).toHaveBeenCalledWith(
      expect.objectContaining({
        collection: "invoices",
        data: expect.objectContaining({
          amount: 33000,
          currency: "currency-krw",
          payment_method: [
            expect.objectContaining({
              amount: 33000,
              currency: "currency-krw"
            })
          ]
        })
      })
    );
  });
});
