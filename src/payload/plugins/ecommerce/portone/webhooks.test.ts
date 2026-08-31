import { describe, expect, it, vi } from "vitest";
import type { PayloadRequest } from "payload";

import { createPortOneWebhookEndpoint } from "./webhooks";

function headers(init: Record<string, string>) {
  return new Headers(init);
}

function reqStub(input: {
  text: string;
  headers: Headers;
  confirm: ReturnType<typeof vi.fn>;
  recordEvent?: ReturnType<typeof vi.fn>;
}): PayloadRequest {
  return {
    payload: {
      find: vi.fn(),
      logger: { error: vi.fn(), warn: vi.fn() }
    },
    headers: input.headers,
    text: async () => input.text,
    data: {}
  } as unknown as PayloadRequest;
}

describe("createPortOneWebhookEndpoint", () => {
  it("rejects unsigned or invalid signatures", async () => {
    const confirm = vi.fn();
    const endpoint = createPortOneWebhookEndpoint({
      webhookSecret: () => "whsec_abcdefghijklmnopqrstuvwxyz123456",
      verifyWebhook: async () => {
        throw new Error("bad-signature");
      },
      confirmOrder: confirm
    });

    const missing = await endpoint.handler(
      reqStub({
        text: '{"data":{"paymentId":"pay_1"}}',
        headers: headers({}),
        confirm
      })
    );
    expect(missing.status).toBe(401);
    expect(confirm).not.toHaveBeenCalled();

    const invalid = await endpoint.handler(
      reqStub({
        text: '{"data":{"paymentId":"pay_1"}}',
        headers: headers({
          "webhook-id": "evt_1",
          "webhook-signature": "v1,bad",
          "webhook-timestamp": "1"
        }),
        confirm
      })
    );
    expect(invalid.status).toBe(400);
  });

  it("confirms from the PortOne payment id after a valid signature", async () => {
    const confirm = vi.fn(async () => ({
      message: "Order confirmed successfully",
      orderID: "order-1",
      transactionID: "txn-1"
    }));
    const recordEvent = vi.fn(async () => ({
      recorded: true,
      duplicate: false,
      conflict: false,
      eventId: "evt-row"
    }));
    const endpoint = createPortOneWebhookEndpoint({
      webhookSecret: () => "whsec_abcdefghijklmnopqrstuvwxyz123456",
      verifyWebhook: async () => undefined,
      confirmOrder: confirm,
      recordEvent
    });

    const response = await endpoint.handler(
      reqStub({
        text: JSON.stringify({
          type: "Transaction.Paid",
          data: { paymentId: "pay_1" }
        }),
        headers: headers({
          "webhook-id": "evt_1",
          "webhook-signature": "v1,ok",
          "webhook-timestamp": "1"
        }),
        confirm
      })
    );
    expect(response.status).toBe(200);
    expect(confirm).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ paymentId: "pay_1" })
      })
    );
    expect(recordEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        paymentId: "pay_1",
        event: expect.objectContaining({ provider_event_id: "evt_1" })
      })
    );
  });

  it("acknowledges non-paid webhook types without confirming", async () => {
    const confirm = vi.fn();
    const endpoint = createPortOneWebhookEndpoint({
      webhookSecret: () => "whsec_abcdefghijklmnopqrstuvwxyz123456",
      verifyWebhook: async () => undefined,
      confirmOrder: confirm
    });
    const response = await endpoint.handler(
      reqStub({
        text: JSON.stringify({
          type: "Transaction.Failed",
          data: { paymentId: "pay_1" }
        }),
        headers: headers({
          "webhook-id": "evt_1",
          "webhook-signature": "v1,ok",
          "webhook-timestamp": "1"
        }),
        confirm
      })
    );
    expect(response.status).toBe(200);
    expect(confirm).not.toHaveBeenCalled();
  });

  it("returns success without confirming again when the provider event is a duplicate", async () => {
    const confirm = vi.fn();
    const endpoint = createPortOneWebhookEndpoint({
      webhookSecret: () => "whsec_abcdefghijklmnopqrstuvwxyz123456",
      verifyWebhook: async () => undefined,
      confirmOrder: confirm,
      recordEvent: async () => ({
        recorded: false,
        duplicate: true,
        conflict: false,
        eventId: "evt-row"
      })
    });

    const response = await endpoint.handler(
      reqStub({
        text: JSON.stringify({
          type: "Transaction.Paid",
          webhook_id: "evt_1",
          data: { paymentId: "pay_1" }
        }),
        headers: headers({
          "webhook-id": "evt_1",
          "webhook-signature": "v1,ok",
          "webhook-timestamp": "1"
        }),
        confirm
      })
    );
    expect(response.status).toBe(200);
    expect(confirm).not.toHaveBeenCalled();
  });
});
