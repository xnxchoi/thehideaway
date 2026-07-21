import type { Payload, PayloadRequest } from "payload";
import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  executeClaimedInventoryOperation,
  operationDisposition
} from "./inventory-operation-runtime";

const tracked = vi.hoisted(() => ({
  claim: vi.fn(),
  complete: vi.fn()
}));

vi.mock("./commerce-commands", () => ({
  claimCommerceCommand: tracked.claim,
  completeCommerceCommand: tracked.complete,
  validateCommerceCommandKey: (value: unknown) => {
    if (typeof value !== "string") throw new Error("invalid-command-key");
    return value;
  }
}));

const CLAIMED_AT = new Date("2026-07-22T09:30:00.000Z");
const EXPIRED_AT = new Date("2026-07-22T09:31:01.000Z");

function makePayload(): Payload {
  return {
    db: {
      beginTransaction: vi.fn(async () => "tx-operation"),
      commitTransaction: vi.fn(async () => undefined),
      rollbackTransaction: vi.fn(async () => undefined)
    }
  } as unknown as Payload;
}

const adminReq = {
  user: { id: "admin-1", role: "admin" },
  context: {}
} as unknown as PayloadRequest;

beforeEach(() => {
  vi.clearAllMocks();
  tracked.claim.mockResolvedValue({
    kind: "claimed",
    businessKey: "inventory:test",
    requestHash: "a".repeat(64),
    leaseToken: "lease-token-1",
    leaseExpiresAt: "2026-07-22T09:30:30.000Z"
  });
});

describe("inventory operation command lease", () => {
  it("rejects coercible non-string disposition values", () => {
    expect(() => operationDisposition(new String("available"))).toThrow(
      "invalid-inventory-disposition"
    );
    expect(() => operationDisposition({ toString: () => "available" })).toThrow(
      "invalid-inventory-disposition"
    );
  });

  it("claims a five-minute lease for bounded inventory batches", async () => {
    tracked.complete.mockResolvedValueOnce({ businessKey: "inventory:test" });
    const payload = makePayload();

    await executeClaimedInventoryOperation(
      {
        payload,
        req: adminReq,
        commandKey: "inventory-command-lease-0001",
        clock: () => CLAIMED_AT
      },
      "test-operation",
      {},
      async () => ({
        resourceId: "resource-lease-1",
        resourceType: "inventory-test",
        status: "applied"
      })
    );

    expect(tracked.claim).toHaveBeenCalledWith(
      expect.objectContaining({ leaseMs: 5 * 60_000 })
    );
  });

  it("uses a fresh completion time so an expired and reclaimed lease cannot commit", async () => {
    const clock = vi
      .fn<() => Date>()
      .mockReturnValueOnce(CLAIMED_AT)
      .mockReturnValue(EXPIRED_AT);
    let currentLeaseToken = "lease-token-1";
    tracked.complete.mockImplementationOnce(async ({ leaseToken, now }) => {
      if (leaseToken !== currentLeaseToken || now >= EXPIRED_AT) {
        throw new Error("commerce-command-lease-lost");
      }
      return { businessKey: "inventory:test" };
    });
    const payload = makePayload();

    await expect(
      executeClaimedInventoryOperation(
        {
          payload,
          req: adminReq,
          commandKey: "inventory-command-0001",
          clock
        },
        "test-operation",
        {},
        async () => {
          currentLeaseToken = "lease-token-2";
          return {
            resourceId: "resource-1",
            resourceType: "inventory-test",
            status: "applied"
          };
        }
      )
    ).rejects.toThrow("commerce-command-lease-lost");

    expect(clock).toHaveBeenCalledTimes(2);
    expect(tracked.complete).toHaveBeenCalledWith(
      expect.objectContaining({ now: EXPIRED_AT })
    );
    expect(payload.db.rollbackTransaction).toHaveBeenCalledWith("tx-operation");
    expect(payload.db.commitTransaction).not.toHaveBeenCalled();
  });

  it("preserves the original error when rollback succeeds", async () => {
    const original = new Error("inventory-operation-failed");
    const payload = makePayload();

    await expect(
      executeClaimedInventoryOperation(
        {
          payload,
          req: adminReq,
          commandKey: "inventory-command-0002",
          clock: () => CLAIMED_AT
        },
        "test-operation",
        {},
        async () => {
          throw original;
        }
      )
    ).rejects.toBe(original);

    expect(payload.db.rollbackTransaction).toHaveBeenCalledWith("tx-operation");
    expect(payload.db.commitTransaction).not.toHaveBeenCalled();
  });

  it("preserves both the primary and rollback errors when rollback fails", async () => {
    const original = new Error("inventory-operation-failed");
    const rollback = new Error("inventory-operation-rollback-failed");
    const payload = makePayload();
    vi.mocked(payload.db.rollbackTransaction).mockRejectedValueOnce(rollback);

    const caught = await executeClaimedInventoryOperation(
      {
        payload,
        req: adminReq,
        commandKey: "inventory-command-0003",
        clock: () => CLAIMED_AT
      },
      "test-operation",
      {},
      async () => {
        throw original;
      }
    ).catch((error: unknown) => error);

    expect(caught).toBeInstanceOf(AggregateError);
    expect((caught as AggregateError).errors).toEqual([original, rollback]);
    expect(payload.db.rollbackTransaction).toHaveBeenCalledWith("tx-operation");
    expect(payload.db.commitTransaction).not.toHaveBeenCalled();
  });
});
