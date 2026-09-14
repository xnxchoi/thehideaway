import { createHash } from "node:crypto";
import type { Payload } from "payload";
import type { AccessArgs } from "payload";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { commerceCommandLock } from "@/lib/db/sequences";
import { CommerceCommands } from "@/payload/collections/(consumption)/CommerceCommands";
import {
  claimCommerceCommand,
  completeCommerceCommand,
  hashCommerceCommandInput,
  validateCommerceCommandKey
} from "./commerce-commands";

vi.mock("@/lib/db/sequences", () => ({
  commerceCommandLock: vi.fn(async () => undefined)
}));

beforeEach(() => {
  vi.clearAllMocks();
});

const VALID_KEY = "checkout-command-0001";
const INPUT = {
  customer: { userId: "user-1" },
  items: [{ quantity: 1, sku: "lost-50" }]
};

function makePayload(docs: Record<string, unknown>[] = []) {
  return {
    collections: { "commerce-commands": {} },
    find: vi.fn(async () => ({ docs })),
    create: vi.fn(async ({ data }) => ({ id: "command-row-1", ...data })),
    update: vi.fn(async ({ data }) => ({ id: "command-row-1", ...data })),
    db: {
      beginTransaction: vi.fn(async () => "tx-claim"),
      commitTransaction: vi.fn(async () => undefined),
      rollbackTransaction: vi.fn(async () => undefined)
    }
  } as unknown as Payload & {
    find: ReturnType<typeof vi.fn>;
    create: ReturnType<typeof vi.fn>;
    update: ReturnType<typeof vi.fn>;
    db: {
      beginTransaction: ReturnType<typeof vi.fn>;
      commitTransaction: ReturnType<typeof vi.fn>;
      rollbackTransaction: ReturnType<typeof vi.fn>;
    };
  };
}

function hashLeaseToken(token: string): string {
  return createHash("sha256").update(token, "utf8").digest("hex");
}

describe("commerce command request hashing", () => {
  it("produces the same SHA-256 hash for the same validated JSON shape", () => {
    const first = hashCommerceCommandInput({
      z: [3, { b: true, a: "value" }],
      a: 1
    });
    const second = hashCommerceCommandInput({
      a: 1,
      z: [3, { a: "value", b: true }]
    });

    expect(first).toBe(second);
    expect(first).toMatch(/^[a-f0-9]{64}$/);
  });

  it("rejects non-JSON and ambiguous input values", () => {
    expect(() => hashCommerceCommandInput({ value: undefined })).toThrow(
      "invalid-commerce-command-input"
    );
    expect(() => hashCommerceCommandInput({ value: Number.NaN })).toThrow(
      "invalid-commerce-command-input"
    );
    expect(() => hashCommerceCommandInput(new Date())).toThrow(
      "invalid-commerce-command-input"
    );
  });
});

describe("commerce command keys", () => {
  it("requires a bounded opaque idempotency key", () => {
    expect(validateCommerceCommandKey(VALID_KEY)).toBe(VALID_KEY);
    expect(() => validateCommerceCommandKey(undefined)).toThrow(
      "commerce-command-key-required"
    );
    expect(() => validateCommerceCommandKey("too-short")).toThrow(
      "invalid-commerce-command-key"
    );
    expect(() => validateCommerceCommandKey("invalid key with spaces")).toThrow(
      "invalid-commerce-command-key"
    );
  });
});

describe("claimCommerceCommand", () => {
  it("creates a durable command and claims a short lease transaction", async () => {
    const payload = makePayload();
    const createBusinessKey = vi.fn(() => "lis_order_0001");

    const result = await claimCommerceCommand({
      payload,
      commandKey: VALID_KEY,
      validatedInput: INPUT,
      createBusinessKey,
      now: new Date("2026-07-21T00:00:00.000Z"),
      leaseMs: 30_000
    });

    expect(result).toEqual({
      kind: "claimed",
      businessKey: "lis_order_0001",
      requestHash: hashCommerceCommandInput(INPUT),
      leaseToken: expect.any(String),
      leaseExpiresAt: "2026-07-21T00:00:30.000Z"
    });
    expect(createBusinessKey).toHaveBeenCalledTimes(1);
    expect(vi.mocked(commerceCommandLock).mock.calls).toEqual([
      [payload, "tx-claim", `key:${VALID_KEY}`],
      [payload, "tx-claim", "business:lis_order_0001"]
    ]);
    expect(payload.create).toHaveBeenCalledWith(
      expect.objectContaining({
        collection: "commerce-commands",
        overrideAccess: true,
        req: expect.objectContaining({ transactionID: "tx-claim" }),
        data: expect.objectContaining({
          command_key: VALID_KEY,
          business_key: "lis_order_0001",
          request_hash: hashCommerceCommandInput(INPUT),
          status: "in_progress",
          attempt_count: 1,
          lease_token_hash: expect.stringMatching(/^[a-f0-9]{64}$/),
          lease_expires_at: "2026-07-21T00:00:30.000Z"
        })
      })
    );
    if (result.kind !== "claimed") throw new Error("expected claimed result");
    const createdData = payload.create.mock.calls[0]?.[0].data;
    expect(createdData.lease_token_hash).not.toBe(result.leaseToken);
    expect(JSON.stringify(payload.create.mock.calls)).not.toContain("user-1");
    expect(payload.db.commitTransaction).toHaveBeenCalledWith("tx-claim");
  });

  it("returns in-progress while an existing lease is active", async () => {
    const payload = makePayload([
      {
        id: "command-row-1",
        command_key: VALID_KEY,
        business_key: "lis_order_0001",
        request_hash: hashCommerceCommandInput(INPUT),
        status: "in_progress",
        attempt_count: 1,
        lease_token_hash: hashLeaseToken("active-token"),
        lease_expires_at: "2026-07-21T00:01:00.000Z"
      }
    ]);

    const result = await claimCommerceCommand({
      payload,
      commandKey: VALID_KEY,
      validatedInput: INPUT,
      businessKey: "unused-business-key",
      now: new Date("2026-07-21T00:00:30.000Z")
    });

    expect(result).toEqual({
      kind: "in_progress",
      businessKey: "lis_order_0001",
      retryAfterMs: 30_000
    });
    expect(payload.update).not.toHaveBeenCalled();
  });

  it("reclaims an expired lease without changing its business key", async () => {
    const payload = makePayload([
      {
        id: "command-row-1",
        business_key: "lis_order_original",
        request_hash: hashCommerceCommandInput(INPUT),
        status: "in_progress",
        attempt_count: 2,
        lease_token_hash: hashLeaseToken("expired-token"),
        lease_expires_at: "2026-07-20T23:59:59.000Z"
      }
    ]);
    const createBusinessKey = vi.fn(() => "lis_order_replacement");

    const result = await claimCommerceCommand({
      payload,
      commandKey: VALID_KEY,
      validatedInput: INPUT,
      createBusinessKey,
      now: new Date("2026-07-21T00:00:00.000Z"),
      leaseMs: 20_000
    });

    expect(result).toEqual({
      kind: "claimed",
      businessKey: "lis_order_original",
      requestHash: hashCommerceCommandInput(INPUT),
      leaseToken: expect.not.stringMatching("expired-token"),
      leaseExpiresAt: "2026-07-21T00:00:20.000Z"
    });
    expect(createBusinessKey).not.toHaveBeenCalled();
    expect(payload.update).toHaveBeenCalledWith(
      expect.objectContaining({
        id: "command-row-1",
        req: expect.objectContaining({ transactionID: "tx-claim" }),
        data: expect.not.objectContaining({ business_key: expect.anything() })
      })
    );
    expect(payload.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          attempt_count: 3,
          lease_token_hash: expect.stringMatching(/^[a-f0-9]{64}$/)
        })
      })
    );
  });

  it("conflicts when the permanent key has a different request hash", async () => {
    const payload = makePayload([
      {
        id: "command-row-1",
        business_key: "lis_order_0001",
        request_hash: hashCommerceCommandInput({ different: true }),
        status: "in_progress",
        attempt_count: 1,
        lease_token_hash: hashLeaseToken("active-token"),
        lease_expires_at: "2026-07-21T00:01:00.000Z"
      }
    ]);

    const result = await claimCommerceCommand({
      payload,
      commandKey: VALID_KEY,
      validatedInput: INPUT,
      businessKey: "lis_order_0001",
      now: new Date("2026-07-21T00:00:00.000Z")
    });

    expect(result).toEqual({ kind: "conflict" });
    expect(payload.update).not.toHaveBeenCalled();
  });

  it("replays the safe response from a succeeded command", async () => {
    const payload = makePayload([
      {
        id: "command-row-1",
        business_key: "lis_order_0001",
        request_hash: hashCommerceCommandInput(INPUT),
        status: "succeeded",
        safe_response: { orderRef: "lis_order_0001", status: "pending" }
      }
    ]);

    const result = await claimCommerceCommand({
      payload,
      commandKey: VALID_KEY,
      validatedInput: INPUT,
      businessKey: "unused-business-key"
    });

    expect(result).toEqual({
      kind: "replay",
      businessKey: "lis_order_0001",
      response: { orderRef: "lis_order_0001", status: "pending" }
    });
  });

  it("conflicts when another command permanently owns the business key", async () => {
    const payload = makePayload();
    payload.find
      .mockResolvedValueOnce({ docs: [] })
      .mockResolvedValueOnce({ docs: [{ id: "other-command" }] });

    const result = await claimCommerceCommand({
      payload,
      commandKey: VALID_KEY,
      validatedInput: INPUT,
      businessKey: "lis_order_0001"
    });

    expect(result).toEqual({ kind: "conflict" });
    expect(payload.create).not.toHaveBeenCalled();
  });

  it("rolls back the short claim transaction on persistence failure", async () => {
    const payload = makePayload();
    payload.create.mockRejectedValueOnce(new Error("database-unavailable"));

    await expect(
      claimCommerceCommand({
        payload,
        commandKey: VALID_KEY,
        validatedInput: INPUT,
        businessKey: "lis_order_0001"
      })
    ).rejects.toThrow("database-unavailable");

    expect(payload.db.rollbackTransaction).toHaveBeenCalledWith("tx-claim");
    expect(payload.db.commitTransaction).not.toHaveBeenCalled();
  });
});

describe("completeCommerceCommand", () => {
  it("completes under the caller transaction after verifying the lease", async () => {
    const payload = makePayload([
      {
        id: "command-row-1",
        business_key: "lis_order_0001",
        request_hash: hashCommerceCommandInput(INPUT),
        status: "in_progress",
        attempt_count: 1,
        lease_token_hash: hashLeaseToken("winning-token"),
        lease_expires_at: "2026-07-21T00:01:00.000Z"
      }
    ]);
    const req = { payload, transactionID: "tx-domain", context: {} };
    const response = { orderRef: "lis_order_0001", status: "pending" };

    const result = await completeCommerceCommand({
      payload,
      req,
      commandKey: VALID_KEY,
      requestHash: hashCommerceCommandInput(INPUT),
      leaseToken: "winning-token",
      response,
      resource: { type: "product-order", id: "order-row-1" },
      now: new Date("2026-07-21T00:00:00.000Z")
    });

    expect(result).toEqual({
      businessKey: "lis_order_0001",
      response
    });
    expect(vi.mocked(commerceCommandLock).mock.calls).toEqual([
      [payload, "tx-domain", `key:${VALID_KEY}`],
      [payload, "tx-domain", "business:lis_order_0001"]
    ]);
    expect(payload.update).toHaveBeenCalledWith({
      collection: "commerce-commands",
      id: "command-row-1",
      overrideAccess: true,
      req,
      data: {
        status: "succeeded",
        safe_response: response,
        resource_type: "product-order",
        resource_id: "order-row-1",
        lease_token_hash: null,
        lease_expires_at: null,
        completed_at: expect.any(String)
      }
    });
    expect(payload.db.commitTransaction).toHaveBeenCalledTimes(0);
  });

  it("rejects a stale claimant without changing terminal state", async () => {
    const payload = makePayload([
      {
        id: "command-row-1",
        business_key: "lis_order_0001",
        request_hash: hashCommerceCommandInput(INPUT),
        status: "in_progress",
        attempt_count: 2,
        lease_token_hash: hashLeaseToken("new-token"),
        lease_expires_at: "2026-07-21T00:01:00.000Z"
      }
    ]);

    await expect(
      completeCommerceCommand({
        payload,
        req: { payload, transactionID: "tx-domain", context: {} },
        commandKey: VALID_KEY,
        requestHash: hashCommerceCommandInput(INPUT),
        leaseToken: "stale-token",
        response: { orderRef: "lis_order_0001" },
        resource: { type: "product-order", id: "order-row-1" }
      })
    ).rejects.toThrow("commerce-command-lease-lost");

    expect(payload.update).not.toHaveBeenCalled();
  });

  it("rejects an expired lease even when its token still matches", async () => {
    const payload = makePayload([
      {
        id: "command-row-1",
        business_key: "lis_order_0001",
        request_hash: hashCommerceCommandInput(INPUT),
        status: "in_progress",
        attempt_count: 1,
        lease_token_hash: hashLeaseToken("expired-token"),
        lease_expires_at: "2026-07-20T23:59:59.000Z"
      }
    ]);

    await expect(
      completeCommerceCommand({
        payload,
        req: { payload, transactionID: "tx-domain", context: {} },
        commandKey: VALID_KEY,
        requestHash: hashCommerceCommandInput(INPUT),
        leaseToken: "expired-token",
        response: { orderRef: "lis_order_0001" },
        resource: { type: "product-order", id: "order-row-1" },
        now: new Date("2026-07-21T00:00:00.000Z")
      })
    ).rejects.toThrow("commerce-command-lease-lost");

    expect(payload.update).not.toHaveBeenCalled();
  });

  it("requires the caller's active transaction", async () => {
    const payload = makePayload();

    await expect(
      completeCommerceCommand({
        payload,
        req: { payload, context: {} },
        commandKey: VALID_KEY,
        requestHash: hashCommerceCommandInput(INPUT),
        leaseToken: "lease-token",
        response: { orderRef: "lis_order_0001" },
        resource: { type: "product-order", id: "order-row-1" }
      })
    ).rejects.toThrow("commerce-command-transaction-required");

    expect(payload.find).not.toHaveBeenCalled();
  });
});

describe("CommerceCommands collection", () => {
  it("is immutable to public and admin APIs", () => {
    const accessArgs = { req: {} } as AccessArgs;

    expect(CommerceCommands.access?.create?.(accessArgs)).toBe(false);
    expect(CommerceCommands.access?.update?.(accessArgs)).toBe(false);
    expect(CommerceCommands.access?.delete?.(accessArgs)).toBe(false);
  });

  it("keeps command and business keys permanently unique", () => {
    const commandKey = CommerceCommands.fields.find(
      (field) => "name" in field && field.name === "command_key"
    );
    const businessKey = CommerceCommands.fields.find(
      (field) => "name" in field && field.name === "business_key"
    );

    expect(commandKey).toMatchObject({ required: true, unique: true });
    expect(businessKey).toMatchObject({ required: true, unique: true });
  });

  it("stores only a hashed, nullable lease capability", () => {
    const rawToken = CommerceCommands.fields.find(
      (field) => "name" in field && field.name === "lease_token"
    );
    const tokenHash = CommerceCommands.fields.find(
      (field) => "name" in field && field.name === "lease_token_hash"
    );

    expect(rawToken).toBeUndefined();
    expect(tokenHash).toMatchObject({ type: "text", required: false });
  });
});

describe("commerce journal fail-closed binding", () => {
  it("refuses an unregistered collection before opening a transaction", async () => {
    const payload = makePayload();
    payload.collections = {};
    await expect(
      claimCommerceCommand({
        payload,
        commandKey: VALID_KEY,
        validatedInput: INPUT,
        businessKey: "order-1"
      })
    ).rejects.toThrow("commerce-command-collection-unavailable");
    expect(payload.db.beginTransaction).not.toHaveBeenCalled();
  });
  it("refuses completion with an absent collection before a write", async () => {
    const payload = makePayload();
    payload.collections = {};
    await expect(
      completeCommerceCommand({
        payload,
        req: { payload, transactionID: "tx" } as never,
        commandKey: VALID_KEY,
        requestHash: hashCommerceCommandInput(INPUT),
        leaseToken: "token",
        response: {},
        resource: { type: "orders", id: "order-1" }
      })
    ).rejects.toThrow("commerce-command-collection-unavailable");
    expect(payload.update).not.toHaveBeenCalled();
  });
  it("does not let an unbound caller replay a bound command", async () => {
    const payload = makePayload([
      {
        id: "command-1",
        business_key: "order-1",
        request_hash: hashCommerceCommandInput(INPUT),
        actor_id: "admin-1",
        operation: "mark_processing",
        target_type: "orders",
        target_id: "order-1",
        reason_code: "operator_update",
        audit_source: "operator",
        status: "succeeded",
        safe_response: { status: "processing" }
      }
    ]);
    expect(
      await claimCommerceCommand({
        payload,
        commandKey: VALID_KEY,
        validatedInput: INPUT,
        businessKey: "order-1"
      })
    ).toEqual({ kind: "conflict" });
  });
});
