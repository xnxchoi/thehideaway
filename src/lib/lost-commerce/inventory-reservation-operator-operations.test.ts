import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const tracked = vi.hoisted(() => ({
  claim: vi.fn(),
  complete: vi.fn(),
  lockOrder: vi.fn(),
  paymentLock: vi.fn(),
  loadState: vi.fn(),
  listQueue: vi.fn(),
  transactionTimestamp: vi.fn(),
  release: vi.fn(),
  expire: vi.fn(),
  reconcile: vi.fn(),
  authorizeAudit: vi.fn()
}));

vi.mock("./commerce-commands", async (importOriginal) => ({
  ...(await importOriginal<typeof import("./commerce-commands")>()),
  claimCommerceCommand: tracked.claim,
  completeCommerceCommand: tracked.complete
}));
vi.mock("./inventory-reservation-locks", () => ({
  lockOrderInventoryReservationsInTransaction: tracked.lockOrder
}));
vi.mock("@/lib/db/sequences", () => ({
  paymentWebhookLock: tracked.paymentLock
}));
vi.mock("./inventory-reservation-operator-queries", async (importOriginal) => ({
  ...(await importOriginal<
    typeof import("./inventory-reservation-operator-queries")
  >()),
  loadInventoryReservationOperatorOrderState: tracked.loadState,
  listInventoryReservationOperatorQueue: tracked.listQueue
}));
vi.mock("./order-inventory-reservations", () => ({
  releaseOrderInventoryReservationsInTransaction: tracked.release
}));
vi.mock("./inventory-reservation-expiry", async (importOriginal) => ({
  ...(await importOriginal<typeof import("./inventory-reservation-expiry")>()),
  expireInventoryReservationOrder: tracked.expire
}));
vi.mock("./inventory-reservation-store", async (importOriginal) => ({
  ...(await importOriginal<typeof import("./inventory-reservation-store")>()),
  reservationTransactionTimestamp: tracked.transactionTimestamp
}));
vi.mock("./inventory-reservation-paid-review", () => ({
  reconcilePaidInventoryReviewInTransaction: tracked.reconcile
}));
vi.mock(
  "@/payload/collections/(consumption)/InventoryReservationOperatorEvents/authorizeInventoryReservationOperatorEvent",
  () => ({
    authorizeInventoryReservationOperatorEventRequest: tracked.authorizeAudit
  })
);

import { runInventoryReservationOperatorCommand } from "./inventory-reservation-operator-operations";
import { throwWithInventoryReservationOperatorFailureEvidence } from "./inventory-reservation-operator-evidence";

const command = {
  action: "release",
  orderId: "order-1",
  expectedStateHash: "a".repeat(64),
  reasonCode: "order-canceled",
  evidenceReference: "support:case-1"
} as const;

function payload() {
  return {
    db: {
      beginTransaction: vi.fn(async () => "tx-1"),
      commitTransaction: vi.fn(async () => undefined),
      rollbackTransaction: vi.fn(async () => undefined)
    },
    create: vi.fn(async () => ({ id: "event-1" }))
  } as never;
}

describe("inventory reservation operator operations", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubEnv("LOST_INVENTORY_RESERVATION_OPERATOR_MUTATIONS_LIVE", "true");
    tracked.transactionTimestamp.mockResolvedValue("2026-07-23T00:00:00.000Z");
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("does not allow an internal context value to bypass the mutation gate", async () => {
    vi.stubEnv("LOST_INVENTORY_RESERVATION_OPERATOR_MUTATIONS_LIVE", "false");

    await expect(
      runInventoryReservationOperatorCommand(command, {
        payload: payload(),
        req: { user: { id: "admin-1", role: "admin" } } as never,
        commandKey: "a".repeat(32),
        mutationsEnabled: true
      } as never)
    ).rejects.toThrow("inventory-reservation-operator-mutations-disabled");
    expect(tracked.claim).not.toHaveBeenCalled();
  });

  it("returns a durable replay without starting another transaction", async () => {
    tracked.claim.mockResolvedValue({
      kind: "replay",
      businessKey: "business-1",
      response: { resourceId: "order-1", status: "released", affectedCount: 1 }
    });
    const instance = payload() as unknown as {
      db: { beginTransaction: ReturnType<typeof vi.fn> };
    };

    await expect(
      runInventoryReservationOperatorCommand(command, {
        payload: instance as never,
        req: {
          user: { id: "admin-1", role: "admin" },
          payload: instance
        } as never,
        commandKey: "a".repeat(32)
      })
    ).resolves.toMatchObject({ kind: "replay" });
    expect(instance.db.beginTransaction).not.toHaveBeenCalled();
  });

  it("rolls back a stale state before applying a terminal action", async () => {
    tracked.claim.mockResolvedValue({
      kind: "claimed",
      businessKey: "business-1",
      requestHash: "b".repeat(64),
      leaseToken: "lease-1",
      leaseExpiresAt: "2026-07-23T01:00:00.000Z"
    });
    tracked.loadState.mockResolvedValue({
      stateHash: "c".repeat(64),
      order: { id: "order-1", orderRef: "order-ref-1" },
      payment: null,
      reservations: []
    });
    const instance = payload() as unknown as {
      db: { rollbackTransaction: ReturnType<typeof vi.fn> };
    };

    await expect(
      runInventoryReservationOperatorCommand(command, {
        payload: instance as never,
        req: {
          user: { id: "admin-1", role: "admin" },
          payload: instance
        } as never,
        commandKey: "a".repeat(32)
      })
    ).rejects.toThrow("inventory-reservation-operator-state-conflict");
    expect(tracked.release).not.toHaveBeenCalled();
    expect(instance.db.rollbackTransaction).toHaveBeenCalledWith("tx-1");
    expect(
      (instance as never as { create: ReturnType<typeof vi.fn> }).create
    ).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          order: "order-1",
          expected_state_hash: command.expectedStateHash,
          observed_state_hash: "c".repeat(64)
        })
      })
    );
  });

  it("claims and commits a release with immutable operator metadata", async () => {
    tracked.claim.mockResolvedValue({
      kind: "claimed",
      businessKey: "business-1",
      requestHash: "b".repeat(64),
      leaseToken: "lease-1",
      leaseExpiresAt: "2026-07-23T01:00:00.000Z"
    });
    const state = {
      stateHash: command.expectedStateHash,
      order: {
        id: "order-1",
        orderRef: "order-ref-1",
        status: "canceled",
        paymentStatus: "unpaid"
      },
      payment: null,
      reservations: []
    };
    tracked.loadState
      .mockResolvedValueOnce(state)
      .mockResolvedValueOnce(state)
      .mockResolvedValueOnce({ ...state, stateHash: "d".repeat(64) });
    tracked.release.mockResolvedValue([{ kind: "created" }]);
    const instance = payload() as unknown as {
      create: ReturnType<typeof vi.fn>;
      db: { commitTransaction: ReturnType<typeof vi.fn> };
    };

    await expect(
      runInventoryReservationOperatorCommand(command, {
        payload: instance as never,
        req: {
          user: { id: "admin-1", role: "admin" },
          payload: instance
        } as never,
        commandKey: "a".repeat(32)
      })
    ).resolves.toMatchObject({
      kind: "succeeded",
      status: "released",
      affectedCount: 1
    });
    expect(tracked.claim).toHaveBeenCalledWith(
      expect.objectContaining({
        businessKey: expect.stringMatching(
          /^inventory-reservation-operator:[a-f0-9]{64}$/
        )
      })
    );
    expect(instance.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          source: "manual_operator",
          correlation_key: "a".repeat(32),
          causation_key: "a".repeat(32)
        })
      })
    );
    expect(instance.db.commitTransaction).toHaveBeenCalledWith("tx-1");
  });

  it("records one PII-safe failure event per claimed zero-effect release attempt", async () => {
    tracked.claim
      .mockResolvedValueOnce({
        kind: "claimed",
        businessKey: "business-1",
        requestHash: "b".repeat(64),
        leaseToken: "lease-1",
        leaseExpiresAt: "2026-07-23T01:00:00.000Z"
      })
      .mockResolvedValueOnce({
        kind: "claimed",
        businessKey: "business-1",
        requestHash: "b".repeat(64),
        leaseToken: "lease-2",
        leaseExpiresAt: "2026-07-23T02:00:00.000Z"
      });
    const state = {
      stateHash: command.expectedStateHash,
      order: {
        id: "order-1",
        orderRef: "order-ref-1",
        status: "canceled",
        paymentStatus: "unpaid",
        doc: { customer_email: "buyer@example.invalid" }
      },
      payment: null,
      reservations: [
        {
          id: "reservation-1",
          status: "released",
          expiresAt: "2026-07-23T00:15:00.000Z",
          updatedAt: "2026-07-23T00:00:00.000Z",
          terminalAt: "2026-07-23T00:00:00.000Z"
        }
      ]
    };
    tracked.loadState.mockResolvedValue(state);
    tracked.release.mockResolvedValue([]);
    const instance = payload() as unknown as {
      create: ReturnType<typeof vi.fn>;
      db: {
        beginTransaction: ReturnType<typeof vi.fn>;
        commitTransaction: ReturnType<typeof vi.fn>;
        rollbackTransaction: ReturnType<typeof vi.fn>;
      };
    };
    instance.db.beginTransaction
      .mockResolvedValueOnce("work-1")
      .mockResolvedValueOnce("evidence-1")
      .mockResolvedValueOnce("work-2")
      .mockResolvedValueOnce("evidence-2");

    for (let attempt = 0; attempt < 2; attempt += 1) {
      await expect(
        runInventoryReservationOperatorCommand(command, {
          payload: instance as never,
          req: {
            user: { id: "admin-1", role: "admin" },
            payload: instance
          } as never,
          commandKey: "a".repeat(32)
        })
      ).rejects.toThrow("inventory-reservation-release-no-effect");
    }

    expect(instance.db.rollbackTransaction).toHaveBeenNthCalledWith(
      1,
      "work-1"
    );
    expect(instance.db.rollbackTransaction).toHaveBeenNthCalledWith(
      2,
      "work-2"
    );
    expect(instance.db.commitTransaction).toHaveBeenNthCalledWith(
      1,
      "evidence-1"
    );
    expect(instance.db.commitTransaction).toHaveBeenNthCalledWith(
      2,
      "evidence-2"
    );
    expect(instance.create).toHaveBeenCalledTimes(2);
    const failureEvents = instance.create.mock.calls.map(
      ([call]) => call.data as Record<string, unknown>
    );
    expect(failureEvents).toEqual([
      expect.objectContaining({
        command_key: "a".repeat(32),
        source: "manual_operator",
        correlation_key: "a".repeat(32),
        causation_key: "a".repeat(32),
        action: "release",
        outcome_code: "inventory-reservation-release-no-effect",
        actor: "admin-1",
        order: "order-1",
        affected_count: 0,
        expected_state_hash: command.expectedStateHash,
        observed_state_hash: state.stateHash
      }),
      expect.objectContaining({
        command_key: "a".repeat(32),
        outcome_code: "inventory-reservation-release-no-effect",
        affected_count: 0
      })
    ]);
    expect(failureEvents.map((event) => event.event_key)).toEqual([
      expect.stringMatching(/^[a-f0-9]{64}$/),
      expect.stringMatching(/^[a-f0-9]{64}$/)
    ]);
    expect(failureEvents[0]?.event_key).not.toBe(failureEvents[1]?.event_key);
    expect(JSON.stringify(failureEvents)).not.toContain(
      "buyer@example.invalid"
    );
    expect(failureEvents).not.toEqual(
      expect.arrayContaining([
        expect.objectContaining({ error: expect.anything() })
      ])
    );
    expect(tracked.complete).not.toHaveBeenCalled();
  });

  it("records a missing-order failure without an invalid order relationship", async () => {
    tracked.claim.mockResolvedValue({
      kind: "claimed",
      businessKey: "business-1",
      requestHash: "b".repeat(64),
      leaseToken: "lease-1",
      leaseExpiresAt: "2026-07-23T01:00:00.000Z"
    });
    tracked.loadState.mockRejectedValue(
      new Error("inventory-reservation-operator-order-not-found")
    );
    const instance = payload() as unknown as {
      create: ReturnType<typeof vi.fn>;
      db: { beginTransaction: ReturnType<typeof vi.fn> };
    };
    instance.db.beginTransaction
      .mockResolvedValueOnce("work-1")
      .mockResolvedValueOnce("evidence-1");

    await expect(
      runInventoryReservationOperatorCommand(
        { ...command, orderId: "missing-order" },
        {
          payload: instance as never,
          req: {
            user: { id: "admin-1", role: "admin" },
            payload: instance
          } as never,
          commandKey: "a".repeat(32)
        }
      )
    ).rejects.toThrow("inventory-reservation-operator-order-not-found");

    expect(instance.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.not.objectContaining({ order: expect.anything() })
      })
    );
    const evidence = instance.create.mock.calls[0]?.[0].data;
    expect(evidence.observed_state_hash).not.toBe(command.expectedStateHash);
  });

  it("passes the locked state into paid-review reconciliation", async () => {
    tracked.claim.mockResolvedValue({
      kind: "claimed",
      businessKey: "business-1",
      requestHash: "b".repeat(64),
      leaseToken: "lease-1",
      leaseExpiresAt: "2026-07-23T01:00:00.000Z"
    });
    const state = {
      stateHash: command.expectedStateHash,
      order: { id: "order-1", orderRef: "order-ref-1" },
      payment: { id: "payment-1" },
      reservations: []
    };
    tracked.loadState
      .mockResolvedValueOnce(state)
      .mockResolvedValueOnce(state)
      .mockResolvedValueOnce({ ...state, stateHash: "e".repeat(64) });
    tracked.reconcile.mockResolvedValue({
      status: "confirmed",
      affectedCount: 1,
      paymentId: "payment-1"
    });

    await runInventoryReservationOperatorCommand(
      { ...command, action: "reconcile" },
      {
        payload: payload(),
        req: {
          user: { id: "admin-1", role: "admin" }
        } as never,
        commandKey: "a".repeat(32)
      }
    );

    expect(tracked.reconcile).toHaveBeenCalledWith(
      expect.objectContaining({ state })
    );
  });

  it("expires the current stuck queue and commits its post-state", async () => {
    tracked.claim.mockResolvedValue({
      kind: "claimed",
      businessKey: "business-1",
      requestHash: "b".repeat(64),
      leaseToken: "lease-1",
      leaseExpiresAt: "2026-07-23T01:00:00.000Z"
    });
    tracked.listQueue
      .mockResolvedValueOnce({
        stateHash: "a".repeat(64),
        items: [{ orderId: "order-1" }, { orderId: "order-2" }]
      })
      .mockResolvedValueOnce({ stateHash: "d".repeat(64), items: [] });
    tracked.expire.mockResolvedValueOnce(1).mockResolvedValueOnce(2);
    const instance = payload() as unknown as {
      create: ReturnType<typeof vi.fn>;
      db: { commitTransaction: ReturnType<typeof vi.fn> };
    };

    await expect(
      runInventoryReservationOperatorCommand(
        {
          action: "run_expiry",
          expectedStateHash: "a".repeat(64),
          reasonCode: "scheduled-check",
          evidenceReference: "ops:expiry-1",
          batchSize: 2
        },
        {
          payload: instance as never,
          req: {
            user: { id: "admin-1", role: "admin" },
            payload: instance
          } as never,
          commandKey: "a".repeat(32)
        }
      )
    ).resolves.toMatchObject({
      kind: "succeeded",
      status: "expiry-run-completed",
      affectedCount: 3,
      stateHash: "d".repeat(64)
    });
    expect(tracked.expire).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({ orderId: "order-1", locksHeld: true })
    );
    expect(tracked.expire).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({ orderId: "order-2", locksHeld: true })
    );
    expect(instance.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          action: "run_expiry",
          affected_count: 3,
          observed_state_hash: "d".repeat(64)
        })
      })
    );
    expect(instance.db.commitTransaction).toHaveBeenCalledWith("tx-1");
  });

  it("rolls back an expiry command when the queue state is stale", async () => {
    tracked.claim.mockResolvedValue({
      kind: "claimed",
      businessKey: "business-1",
      requestHash: "b".repeat(64),
      leaseToken: "lease-1",
      leaseExpiresAt: "2026-07-23T01:00:00.000Z"
    });
    tracked.listQueue.mockResolvedValue({
      stateHash: "c".repeat(64),
      items: [{ orderId: "order-1" }]
    });
    const instance = payload() as unknown as {
      create: ReturnType<typeof vi.fn>;
      db: {
        beginTransaction: ReturnType<typeof vi.fn>;
        rollbackTransaction: ReturnType<typeof vi.fn>;
      };
    };
    instance.db.beginTransaction
      .mockResolvedValueOnce("work-1")
      .mockResolvedValueOnce("evidence-1");

    await expect(
      runInventoryReservationOperatorCommand(
        {
          action: "run_expiry",
          expectedStateHash: "a".repeat(64),
          reasonCode: "scheduled-check",
          evidenceReference: "ops:expiry-1",
          batchSize: 1
        },
        {
          payload: instance as never,
          req: {
            user: { id: "admin-1", role: "admin" },
            payload: instance
          } as never,
          commandKey: "a".repeat(32)
        }
      )
    ).rejects.toThrow("inventory-reservation-operator-state-conflict");
    expect(tracked.expire).not.toHaveBeenCalled();
    expect(instance.db.rollbackTransaction).toHaveBeenCalledWith("work-1");
    expect(instance.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          action: "run_expiry",
          expected_state_hash: "a".repeat(64),
          observed_state_hash: "c".repeat(64)
        })
      })
    );
  });

  it("fails closed when failure evidence cannot start a transaction", async () => {
    const instance = payload() as unknown as {
      db: { beginTransaction: ReturnType<typeof vi.fn> };
    };
    instance.db.beginTransaction.mockResolvedValue(undefined);
    const operationError = new Error(
      "inventory-reservation-operator-state-conflict"
    );

    await expect(
      throwWithInventoryReservationOperatorFailureEvidence({
        payload: instance as never,
        req: { user: { id: "admin-1", role: "admin" } } as never,
        command,
        commandKey: "a".repeat(32),
        actorId: "admin-1",
        claim: {
          kind: "claimed",
          businessKey: "business-1",
          requestHash: "b".repeat(64),
          leaseToken: "lease-1",
          leaseExpiresAt: "2026-07-23T01:00:00.000Z"
        },
        error: operationError,
        observedStateHash: "c".repeat(64)
      })
    ).rejects.toMatchObject({
      message: "inventory-reservation-operator-failure-evidence-failed",
      errors: expect.arrayContaining([operationError])
    });
  });

  it("rolls back and preserves both failures when an evidence write fails", async () => {
    const instance = payload() as unknown as {
      create: ReturnType<typeof vi.fn>;
      db: {
        beginTransaction: ReturnType<typeof vi.fn>;
        rollbackTransaction: ReturnType<typeof vi.fn>;
      };
    };
    const operationError = new Error(
      "inventory-reservation-operator-state-conflict"
    );
    instance.create.mockRejectedValue(new Error("audit-write-failed"));
    instance.db.beginTransaction.mockResolvedValue("evidence-1");

    await expect(
      throwWithInventoryReservationOperatorFailureEvidence({
        payload: instance as never,
        req: { user: { id: "admin-1", role: "admin" } } as never,
        command,
        commandKey: "a".repeat(32),
        actorId: "admin-1",
        claim: {
          kind: "claimed",
          businessKey: "business-1",
          requestHash: "b".repeat(64),
          leaseToken: "lease-1",
          leaseExpiresAt: "2026-07-23T01:00:00.000Z"
        },
        error: operationError,
        observedStateHash: "c".repeat(64)
      })
    ).rejects.toMatchObject({
      message: "inventory-reservation-operator-failure-evidence-failed",
      errors: expect.arrayContaining([operationError])
    });
    expect(instance.db.rollbackTransaction).toHaveBeenCalledWith("evidence-1");
  });
});
