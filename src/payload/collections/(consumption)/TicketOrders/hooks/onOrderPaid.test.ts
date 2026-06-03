import { describe, expect, it, vi } from "vitest";

import { onOrderPaid } from "./onOrderPaid";

describe("onOrderPaid", () => {
  it("activates sibling tickets exactly on the order paid edge", async () => {
    const find = vi.fn(async ({ collection }) => {
      if (collection === "tickets") {
        return {
          docs: [
            { id: "ticket-1", paid: false, status: "pending" },
            { id: "ticket-2", paid: false, status: "pending" }
          ]
        };
      }
      throw new Error(`Unexpected collection: ${collection}`);
    });
    const update = vi.fn(async ({ id, data }) => ({ id, ...data }));
    const findByID = vi.fn(async () => ({ name: "Day n Night" }));
    const create = vi.fn(async () => ({ id: "notification-1" }));
    const logger = {
      info: vi.fn(),
      warn: vi.fn(),
      error: vi.fn()
    };

    await onOrderPaid({
      doc: {
        id: "order-1",
        paid: true,
        purchaser: "buyer-user",
        event: "event-1"
      },
      previousDoc: { id: "order-1", paid: false },
      req: {
        payload: { find, update, findByID, create, logger }
      }
    } as never);

    expect(find).toHaveBeenCalledWith(
      expect.objectContaining({
        collection: "tickets",
        where: {
          and: [
            { order: { equals: "order-1" } },
            { paid: { not_equals: true } }
          ]
        },
        overrideAccess: true
      })
    );
    expect(update).toHaveBeenCalledTimes(2);
    expect(update).toHaveBeenCalledWith(
      expect.objectContaining({
        collection: "tickets",
        id: "ticket-1",
        overrideAccess: true,
        data: { paid: true, status: "active" }
      })
    );
    expect(update).toHaveBeenCalledWith(
      expect.objectContaining({
        collection: "tickets",
        id: "ticket-2",
        overrideAccess: true,
        data: { paid: true, status: "active" }
      })
    );
    expect(create).toHaveBeenCalledWith(
      expect.objectContaining({
        collection: "notifications",
        data: expect.objectContaining({
          recipient: "buyer-user"
        })
      })
    );
  });

  it("does not reactivate sibling tickets on non-edge paid saves", async () => {
    const find = vi.fn();
    const update = vi.fn();
    const create = vi.fn();

    await onOrderPaid({
      doc: { id: "order-1", paid: true },
      previousDoc: { id: "order-1", paid: true },
      req: {
        payload: {
          find,
          update,
          create,
          logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn() }
        }
      }
    } as never);

    expect(find).not.toHaveBeenCalled();
    expect(update).not.toHaveBeenCalled();
    expect(create).not.toHaveBeenCalled();
  });

  it("does not swallow sibling activation failures", async () => {
    const find = vi.fn(async ({ collection }) => {
      if (collection === "tickets") {
        return { docs: [{ id: "ticket-1", paid: false, status: "pending" }] };
      }
      throw new Error(`Unexpected collection: ${collection}`);
    });
    const update = vi.fn(async () => {
      throw new Error("ticket update failed");
    });

    await expect(
      onOrderPaid({
        doc: {
          id: "order-1",
          paid: true,
          purchaser: "buyer-user",
          event: "event-1"
        },
        previousDoc: { id: "order-1", paid: false },
        req: {
          payload: {
            find,
            update,
            create: vi.fn(),
            findByID: vi.fn(),
            logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn() }
          }
        }
      } as never)
    ).rejects.toThrow("ticket update failed");
  });
});
