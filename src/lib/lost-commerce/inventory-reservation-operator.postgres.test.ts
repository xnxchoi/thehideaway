import { randomUUID } from "node:crypto";
import {
  afterAll,
  afterEach,
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
  vi
} from "vitest";
import { sql } from "@payloadcms/db-postgres";

const portOne = vi.hoisted(() => ({ getPayment: vi.fn() }));

vi.mock("./verify-payment", async (importOriginal) => ({
  ...(await importOriginal<typeof import("./verify-payment")>()),
  getPortOnePayment: portOne.getPayment
}));

import { hashCommerceCommandInput } from "./commerce-commands";
import { expireDueInventoryReservationOrders } from "./inventory-reservation-expiry";
import { runInventoryReservationOperatorCommand } from "./inventory-reservation-operator-operations";
import {
  listInventoryReservationOperatorQueue,
  loadInventoryReservationOperatorOrderState
} from "./inventory-reservation-operator-queries";
import { recoverPaidInventoryReservationsInTransaction } from "./inventory-reservation-recovery";
import {
  expireInventoryReservationInTransaction,
  reserveOrderInventoryInTransaction
} from "./inventory-reservations";
import { syncProductPayment } from "./product-payment";
import {
  createReservationPostgresHarness,
  type ReservationFixture,
  type ReservationPostgresHarness
} from "./inventory-reservations.postgres.fixtures";

const databaseUri = process.env.PR6A_SCENARIO_TEST_DATABASE_URI;
const originalDatabaseUri = process.env.DATABASE_URI;
const describeWithPostgres = databaseUri ? describe : describe.skip;
const issuedCommandKeys = new Set<string>();

const at = (offsetMinutes: number) =>
  new Date(Date.now() + offsetMinutes * 60_000).toISOString();

const policy = (fixture: ReservationFixture) => ({
  enabled: true as const,
  ttlMinutes: 15,
  locationCode: fixture.locationCode,
  safetyStock: 0,
  consumePoint: "payment_confirmed" as const,
  expiryBoundary: "at_or_after" as const,
  paymentTimeSource: "provider_paid_at" as const,
  latePaymentPolicy: "manual_review" as const,
  backorderMode: "disabled" as const
});

function commandKey(label: string, fixture: ReservationFixture): string {
  const key = hashCommerceCommandInput({ label, fixture: fixture.suffix });
  issuedCommandKeys.add(key);
  return key;
}

async function cleanupIssuedCommerceCommands(
  harness: ReservationPostgresHarness
): Promise<void> {
  const commandKeys = [...issuedCommandKeys];
  if (commandKeys.length === 0) return;
  await harness.payload.db.drizzle.execute(sql`
    DELETE FROM commerce_commands
    WHERE command_key IN (${sql.join(
      commandKeys.map((key) => sql`${key}`),
      sql`, `
    )})
  `);
  issuedCommandKeys.clear();
}

function operatorRequest(
  harness: ReservationPostgresHarness,
  fixture: ReservationFixture
) {
  return {
    payload: harness.payload,
    context: {},
    user: { id: fixture.actorId, role: "admin" }
  } as never;
}

async function reserve(input: {
  harness: ReservationPostgresHarness;
  fixture: ReservationFixture;
  orderId: string;
  skuIds?: readonly string[];
  expiresAt?: string;
}) {
  const effectiveAt = at(-10);
  return input.harness.inTransaction(input.fixture, (req) =>
    reserveOrderInventoryInTransaction({
      payload: input.harness.payload,
      req,
      policy: policy(input.fixture),
      requests: (input.skuIds ?? [input.fixture.skuIds[0]]).map(
        (skuId, index) => ({
          idempotencyKey: commandKey(
            `reserve-${input.orderId}-${index}`,
            input.fixture
          ),
          operation: "reserve" as const,
          orderId: input.orderId,
          skuId,
          locationId: input.fixture.locationId,
          quantity: 1,
          effectiveAt,
          expiresAt: input.expiresAt ?? at(5)
        })
      )
    })
  );
}

async function expireOriginals(
  harness: ReservationPostgresHarness,
  fixture: ReservationFixture,
  orderId: string
) {
  const reservations = (await harness.reservations(fixture)).filter(
    (row) => row.order_id === orderId && row.status === "active"
  );
  await harness.inTransaction(fixture, async (req) => {
    for (const reservation of reservations) {
      await expireInventoryReservationInTransaction({
        payload: harness.payload,
        req,
        request: {
          idempotencyKey: commandKey(`expire-${reservation.id}`, fixture),
          operation: "expire",
          orderId,
          reservationId: reservation.id,
          skuId: reservation.sku_id,
          locationId: reservation.location_id,
          quantity: reservation.quantity,
          effectiveAt: at(10)
        }
      });
    }
  });
}

async function createPaidPayment(
  harness: ReservationPostgresHarness,
  fixture: ReservationFixture,
  orderId: string,
  label = "paid"
): Promise<string> {
  const payment = (await harness.payload.create({
    collection: "product-payments" as never,
    overrideAccess: true,
    data: {
      payment_ref: `payment-${label}-${fixture.suffix}-${orderId}`,
      order: orderId,
      user: fixture.userId,
      provider: "portone",
      status: "paid",
      amount: 1,
      currency: "KRW",
      portone_order_ref: `portone-order-${label}-${fixture.suffix}`,
      portone_transaction_ref: `portone-transaction-${label}-${fixture.suffix}`,
      paid_at: at(0)
    } as never
  })) as unknown as { id: string };
  await harness.payload.update({
    collection: "product-orders" as never,
    id: orderId,
    overrideAccess: true,
    data: { status: "paid_inventory_review", payment_status: "paid" } as never
  });
  return String(payment.id);
}

async function createPendingPayment(
  harness: ReservationPostgresHarness,
  fixture: ReservationFixture,
  orderId: string,
  label: string
): Promise<string> {
  const payment = (await harness.payload.create({
    collection: "product-payments" as never,
    overrideAccess: true,
    data: {
      payment_ref: `payment-${label}-${fixture.suffix}-${orderId}`,
      order: orderId,
      user: fixture.userId,
      provider: "portone",
      status: "pending",
      amount: 1,
      currency: "KRW",
      portone_order_ref: `portone-order-${label}-${fixture.suffix}`
    } as never
  })) as unknown as { id: string };
  return String(payment.id);
}

describeWithPostgres.sequential("PR6A reservation operator scenarios", () => {
  let harness: ReservationPostgresHarness;

  beforeAll(async () => {
    harness = await createReservationPostgresHarness(databaseUri!);
  }, 60_000);

  afterAll(async () => {
    try {
      if (harness) {
        try {
          await harness.cleanup();
        } finally {
          await cleanupIssuedCommerceCommands(harness);
        }
      }
    } finally {
      await harness?.payload.destroy();
      if (originalDatabaseUri === undefined) delete process.env.DATABASE_URI;
      else process.env.DATABASE_URI = originalDatabaseUri;
    }
  });

  beforeEach(() => {
    vi.stubEnv("LOST_INVENTORY_RESERVATION_OPERATOR_MUTATIONS_LIVE", "true");
    portOne.getPayment.mockReset().mockResolvedValue({
      status: "PAID",
      amount: { total: 1, paid: 1 },
      currency: "KRW",
      channel: { type: "TEST" },
      paidAt: at(0),
      transactionId: "portone-transaction-postgres"
    });
  });

  afterEach(async () => {
    vi.restoreAllMocks();
    vi.unstubAllEnvs();
    try {
      await harness.cleanup();
    } finally {
      await cleanupIssuedCommerceCommands(harness);
    }
  });

  it("claims, audits, replays, and conflicts a manual release", async () => {
    const fixture = await harness.createFixture();
    await harness.seedInventory(fixture, { quantity: 1 });
    const orderId = fixture.orderIds[0];
    await reserve({ harness, fixture, orderId });
    await harness.payload.update({
      collection: "product-orders" as never,
      id: orderId,
      overrideAccess: true,
      data: { status: "canceled", payment_status: "unpaid" } as never
    });
    const req = operatorRequest(harness, fixture);
    const state = await loadInventoryReservationOperatorOrderState({
      payload: harness.payload,
      req,
      orderId
    });
    const key = commandKey("operator-release", fixture);
    const command = {
      action: "release" as const,
      orderId,
      expectedStateHash: state.stateHash,
      reasonCode: "order-canceled",
      evidenceReference: `support:${fixture.suffix}`
    };

    const first = await runInventoryReservationOperatorCommand(command, {
      payload: harness.payload,
      req,
      commandKey: key
    });
    const replay = await runInventoryReservationOperatorCommand(command, {
      payload: harness.payload,
      req,
      commandKey: key
    });
    const conflict = await runInventoryReservationOperatorCommand(
      { ...command, reasonCode: "different-reason" },
      { payload: harness.payload, req, commandKey: key }
    );
    const semanticConflict = await runInventoryReservationOperatorCommand(
      command,
      {
        payload: harness.payload,
        req,
        commandKey: commandKey("operator-release-alternate", fixture)
      }
    );

    expect(first).toMatchObject({ kind: "succeeded", status: "released" });
    expect(replay).toEqual({ ...first, kind: "replay" });
    expect(conflict).toEqual({ kind: "conflict" });
    expect(semanticConflict).toEqual({ kind: "conflict" });
    expect(await harness.reservationEntries(fixture)).toHaveLength(2);
    const events = await harness.payload.find({
      collection: "inventory-reservation-operator-events" as never,
      overrideAccess: true,
      where: { command_key: { equals: key } } as never
    });
    expect(events.docs).toEqual([
      expect.objectContaining({
        source: "manual_operator",
        correlation_key: key,
        causation_key: key,
        outcome_code: "released"
      })
    ]);
  });

  it("keeps release and authoritative payment confirmation balanced when they race", async () => {
    const fixture = await harness.createFixture();
    await harness.seedInventory(fixture, { quantity: 1 });
    const orderId = fixture.orderIds[0];
    await reserve({ harness, fixture, orderId });
    await harness.payload.update({
      collection: "product-orders" as never,
      id: orderId,
      overrideAccess: true,
      data: { status: "canceled", payment_status: "unpaid" } as never
    });
    const order = (await harness.payload.findByID({
      collection: "product-orders" as never,
      id: orderId,
      overrideAccess: true,
      depth: 0
    })) as unknown as { order_ref: string };
    await harness.payload.create({
      collection: "product-payments" as never,
      overrideAccess: true,
      data: {
        payment_ref: `${order.order_ref}_portone`,
        order: orderId,
        user: fixture.userId,
        provider: "portone",
        status: "pending",
        amount: 1,
        currency: "KRW",
        portone_order_ref: order.order_ref
      } as never
    });
    const req = operatorRequest(harness, fixture);
    const state = await loadInventoryReservationOperatorOrderState({
      payload: harness.payload,
      req,
      orderId
    });
    const releaseKey = commandKey("release-payment-race", fixture);

    const [releaseOutcome, paymentOutcome] = await Promise.allSettled([
      runInventoryReservationOperatorCommand(
        {
          action: "release",
          orderId,
          expectedStateHash: state.stateHash,
          reasonCode: "payment-race-review",
          evidenceReference: `incident:${fixture.suffix}`
        },
        { payload: harness.payload, req, commandKey: releaseKey }
      ),
      syncProductPayment({
        payload: harness.payload,
        paymentId: order.order_ref,
        expectedUserId: fixture.userId,
        providerEventRef: `portone:${fixture.suffix}`
      })
    ]);

    expect(paymentOutcome).toEqual(
      expect.objectContaining({
        status: "fulfilled",
        value: expect.objectContaining({ ok: true, status: "paid" })
      })
    );
    if (releaseOutcome.status === "fulfilled") {
      expect(releaseOutcome.value).toMatchObject({
        kind: "succeeded",
        status: "released",
        affectedCount: 1
      });
    } else {
      expect(releaseOutcome.reason).toEqual(
        expect.objectContaining({
          message: expect.stringMatching(
            /inventory-reservation-(?:operator-state-conflict|release-forbidden)/
          )
        })
      );
    }
    let finalOrder = (await harness.payload.findByID({
      collection: "product-orders" as never,
      id: orderId,
      overrideAccess: true,
      depth: 0
    })) as unknown as { payment_status: string; status: string };
    if (finalOrder.status === "paid_inventory_review") {
      const reviewState = await loadInventoryReservationOperatorOrderState({
        payload: harness.payload,
        req,
        orderId
      });
      await expect(
        runInventoryReservationOperatorCommand(
          {
            action: "reconcile",
            orderId,
            expectedStateHash: reviewState.stateHash,
            reasonCode: "payment-race-recovery",
            evidenceReference: `payment:${fixture.suffix}`
          },
          {
            payload: harness.payload,
            req,
            commandKey: commandKey("release-payment-race-recovery", fixture)
          }
        )
      ).resolves.toMatchObject({ status: "confirmed" });
      finalOrder = (await harness.payload.findByID({
        collection: "product-orders" as never,
        id: orderId,
        overrideAccess: true,
        depth: 0
      })) as unknown as { payment_status: string; status: string };
    }
    expect(finalOrder).toMatchObject({
      payment_status: "paid",
      status: "confirmed"
    });
    const reservations = (await harness.reservations(fixture)).filter(
      (row) => row.order_id === orderId
    );
    expect(reservations.some((row) => row.status === "active")).toBe(false);
    expect(
      reservations.filter((row) => row.status === "consumed")
    ).toHaveLength(1);
    expect(
      (await harness.reservationEntries(fixture)).filter(
        (entry) => entry.operation === "consume"
      )
    ).toHaveLength(1);
    expect(await harness.availableQuantity(fixture)).toBe(0);
  });

  it("runs operator reconcile through recovery, audit, and durable completion", async () => {
    const fixture = await harness.createFixture();
    await harness.seedInventory(fixture, { quantity: 2 });
    const orderId = fixture.orderIds[0];
    await reserve({ harness, fixture, orderId, expiresAt: at(-5) });
    await expireOriginals(harness, fixture, orderId);
    const paymentId = await createPaidPayment(harness, fixture, orderId);
    const req = operatorRequest(harness, fixture);
    const state = await loadInventoryReservationOperatorOrderState({
      payload: harness.payload,
      req,
      orderId
    });
    const key = commandKey("operator-reconcile", fixture);

    await expect(
      runInventoryReservationOperatorCommand(
        {
          action: "reconcile",
          orderId,
          expectedStateHash: state.stateHash,
          reasonCode: "paid-inventory-review",
          evidenceReference: `payment:${paymentId}`
        },
        { payload: harness.payload, req, commandKey: key }
      )
    ).resolves.toMatchObject({
      kind: "succeeded",
      status: "confirmed",
      affectedCount: 1
    });
    const events = await harness.payload.find({
      collection: "inventory-reservation-operator-events" as never,
      overrideAccess: true,
      depth: 0,
      where: { command_key: { equals: key } } as never
    });
    expect(events.docs).toEqual([
      expect.objectContaining({
        outcome_code: "confirmed",
        payment: paymentId,
        affected_count: 1
      })
    ]);
    const commands = await harness.payload.find({
      collection: "commerce-commands" as never,
      overrideAccess: true,
      where: { command_key: { equals: key } } as never
    });
    expect(commands.docs).toEqual([
      expect.objectContaining({
        status: "succeeded",
        resource_id: orderId,
        completed_at: expect.any(String)
      })
    ]);
  });

  it("refreshes review state after replenishment and succeeds under a new key", async () => {
    const fixture = await harness.createFixture({ orderCount: 2 });
    await harness.seedInventory(fixture, { quantity: 1 });
    const [reviewOrderId, competingOrderId] = fixture.orderIds;
    await reserve({
      harness,
      fixture,
      orderId: reviewOrderId,
      expiresAt: at(-5)
    });
    await expireOriginals(harness, fixture, reviewOrderId);
    await reserve({ harness, fixture, orderId: competingOrderId });
    const paymentId = await createPaidPayment(harness, fixture, reviewOrderId);
    const req = operatorRequest(harness, fixture);
    const before = await loadInventoryReservationOperatorOrderState({
      payload: harness.payload,
      req,
      orderId: reviewOrderId
    });

    await expect(
      runInventoryReservationOperatorCommand(
        {
          action: "reconcile",
          orderId: reviewOrderId,
          expectedStateHash: before.stateHash,
          reasonCode: "inventory-shortfall",
          evidenceReference: `payment:${paymentId}`
        },
        {
          payload: harness.payload,
          req,
          commandKey: commandKey("review-before-replenishment", fixture)
        }
      )
    ).resolves.toMatchObject({
      kind: "succeeded",
      status: "review_remaining",
      affectedCount: 0
    });

    await harness.seedInventory(fixture, { quantity: 1 });
    const replenished = await loadInventoryReservationOperatorOrderState({
      payload: harness.payload,
      req,
      orderId: reviewOrderId
    });
    expect(replenished.stateHash).not.toBe(before.stateHash);

    await expect(
      runInventoryReservationOperatorCommand(
        {
          action: "reconcile",
          orderId: reviewOrderId,
          expectedStateHash: replenished.stateHash,
          reasonCode: "inventory-replenished",
          evidenceReference: `payment:${paymentId}`
        },
        {
          payload: harness.payload,
          req,
          commandKey: commandKey("review-after-replenishment", fixture)
        }
      )
    ).resolves.toMatchObject({
      kind: "succeeded",
      status: "confirmed",
      affectedCount: 1
    });
  });

  it("uses paid_at to select the same row from competing authoritative paid payments", async () => {
    const fixture = await harness.createFixture();
    await harness.seedInventory(fixture, { quantity: 2 });
    const orderId = fixture.orderIds[0];
    await reserve({ harness, fixture, orderId, expiresAt: at(-5) });
    await expireOriginals(harness, fixture, orderId);
    const olderPaidPaymentId = await createPaidPayment(
      harness,
      fixture,
      orderId,
      "older-authoritative"
    );
    const newerPaidPayment = (await harness.payload.create({
      collection: "product-payments" as never,
      overrideAccess: true,
      data: {
        payment_ref: `payment-newer-authoritative-${fixture.suffix}`,
        order: orderId,
        user: fixture.userId,
        provider: "portone",
        status: "paid",
        amount: 1,
        currency: "KRW",
        portone_order_ref: `newer-authoritative-${fixture.suffix}`,
        portone_transaction_ref: `newer-authoritative-${fixture.suffix}`,
        paid_at: at(5)
      } as never
    })) as unknown as { id: string };
    const authoritativePaymentId = String(newerPaidPayment.id);
    const req = operatorRequest(harness, fixture);
    const queue = await listInventoryReservationOperatorQueue({
      payload: harness.payload,
      req,
      queue: "paid_inventory_review",
      limit: 25
    });
    const state = await loadInventoryReservationOperatorOrderState({
      payload: harness.payload,
      req,
      orderId
    });

    expect(queue.items[0]).toMatchObject({
      orderId,
      paymentId: authoritativePaymentId,
      paymentStatus: "paid",
      stateHash: state.stateHash
    });
    expect(state.payment?.id).toBe(authoritativePaymentId);
    expect(state.payment?.id).not.toBe(olderPaidPaymentId);
    const key = commandKey("multiple-payment-reconcile", fixture);
    await expect(
      runInventoryReservationOperatorCommand(
        {
          action: "reconcile",
          orderId,
          expectedStateHash: state.stateHash,
          reasonCode: "authoritative-payment",
          evidenceReference: `payment:${authoritativePaymentId}`
        },
        { payload: harness.payload, req, commandKey: key }
      )
    ).resolves.toMatchObject({ status: "confirmed", affectedCount: 1 });
    const events = await harness.payload.find({
      collection: "inventory-reservation-operator-events" as never,
      overrideAccess: true,
      depth: 0,
      where: { command_key: { equals: key } } as never
    });
    expect(events.docs).toEqual([
      expect.objectContaining({ payment: authoritativePaymentId })
    ]);
  });

  it("loads an authoritative older paid payment beyond four newer rows", async () => {
    const fixture = await harness.createFixture();
    await harness.seedInventory(fixture, { quantity: 1 });
    const orderId = fixture.orderIds[0];
    await reserve({ harness, fixture, orderId, expiresAt: at(-5) });
    await expireOriginals(harness, fixture, orderId);
    const authoritativePaymentId = await createPaidPayment(
      harness,
      fixture,
      orderId,
      "older-than-page"
    );
    for (let index = 0; index < 4; index += 1) {
      await createPendingPayment(
        harness,
        fixture,
        orderId,
        `newer-than-paid-${index}`
      );
    }

    const state = await loadInventoryReservationOperatorOrderState({
      payload: harness.payload,
      req: operatorRequest(harness, fixture),
      orderId
    });

    expect(state.payment).toMatchObject({
      id: authoritativePaymentId,
      status: "paid",
      transactionReference: expect.stringContaining("older-than-page")
    });
  });

  it("keeps one order from starving another order's authoritative queue payment", async () => {
    const fixture = await harness.createFixture({ orderCount: 2 });
    await harness.seedInventory(fixture, { quantity: 2 });
    const [noisyOrderId, targetOrderId] = fixture.orderIds;
    for (const orderId of fixture.orderIds) {
      await reserve({ harness, fixture, orderId, expiresAt: at(-5) });
      await expireOriginals(harness, fixture, orderId);
    }
    await harness.payload.update({
      collection: "product-orders" as never,
      id: noisyOrderId,
      overrideAccess: true,
      data: { status: "paid_inventory_review", payment_status: "paid" } as never
    });
    for (let index = 0; index < 8; index += 1) {
      await createPendingPayment(
        harness,
        fixture,
        noisyOrderId,
        `noise-before-${index}`
      );
    }
    const targetPaymentId = await createPaidPayment(
      harness,
      fixture,
      targetOrderId,
      "queue-target"
    );
    for (let index = 0; index < 8; index += 1) {
      await createPendingPayment(
        harness,
        fixture,
        noisyOrderId,
        `noise-after-${index}`
      );
    }

    const queue = await listInventoryReservationOperatorQueue({
      payload: harness.payload,
      req: operatorRequest(harness, fixture),
      queue: "paid_inventory_review",
      limit: 2
    });

    expect(
      queue.items.find((item) => item.orderId === targetOrderId)
    ).toMatchObject({
      paymentId: targetPaymentId,
      paymentStatus: "paid"
    });
  });

  it("records immutable failure evidence and leaves zero-effect release retryable", async () => {
    const fixture = await harness.createFixture();
    await harness.seedInventory(fixture, { quantity: 1 });
    const orderId = fixture.orderIds[0];
    await reserve({ harness, fixture, orderId, expiresAt: at(-5) });
    await expireOriginals(harness, fixture, orderId);
    await harness.payload.update({
      collection: "product-orders" as never,
      id: orderId,
      overrideAccess: true,
      data: { status: "canceled", payment_status: "unpaid" } as never
    });
    const req = operatorRequest(harness, fixture);
    const state = await loadInventoryReservationOperatorOrderState({
      payload: harness.payload,
      req,
      orderId
    });
    const key = commandKey("zero-effect-release", fixture);

    await expect(
      runInventoryReservationOperatorCommand(
        {
          action: "release",
          orderId,
          expectedStateHash: state.stateHash,
          reasonCode: "already-terminal",
          evidenceReference: `incident:${fixture.suffix}`
        },
        { payload: harness.payload, req, commandKey: key }
      )
    ).rejects.toThrow("inventory-reservation-release-no-effect");
    const events = await harness.payload.find({
      collection: "inventory-reservation-operator-events" as never,
      overrideAccess: true,
      depth: 0,
      where: { command_key: { equals: key } } as never
    });
    expect(events.docs).toEqual([
      expect.objectContaining({
        event_key: expect.stringMatching(/^[a-f0-9]{64}$/),
        command_key: key,
        source: "manual_operator",
        correlation_key: key,
        causation_key: key,
        action: "release",
        outcome_code: "inventory-reservation-release-no-effect",
        actor: fixture.actorId,
        order: orderId,
        affected_count: 0,
        expected_state_hash: state.stateHash,
        observed_state_hash: state.stateHash
      })
    ]);
    expect(JSON.stringify(events.docs)).not.toMatch(
      /buyer-.*@example\.invalid/
    );
    const eventId = String((events.docs[0] as unknown as { id: string }).id);
    await expect(
      harness.payload.update({
        collection: "inventory-reservation-operator-events" as never,
        id: eventId,
        overrideAccess: true,
        data: { outcome_code: "changed" } as never
      })
    ).rejects.toThrow("inventory-reservation-operator-event-immutable");
    const commands = await harness.payload.find({
      collection: "commerce-commands" as never,
      overrideAccess: true,
      where: { command_key: { equals: key } } as never
    });
    expect(commands.docs).toEqual([
      expect.objectContaining({
        status: "in_progress",
        attempt_count: 1,
        lease_expires_at: expect.any(String),
        completed_at: null
      })
    ]);
  });

  it("records missing-order failure evidence without a dangling relationship", async () => {
    const fixture = await harness.createFixture();
    const missingOrderId = randomUUID();
    const key = commandKey("operator-missing-order", fixture);

    await expect(
      runInventoryReservationOperatorCommand(
        {
          action: "release",
          orderId: missingOrderId,
          expectedStateHash: "a".repeat(64),
          reasonCode: "order-canceled",
          evidenceReference: `support:${fixture.suffix}`
        },
        {
          payload: harness.payload,
          req: operatorRequest(harness, fixture),
          commandKey: key
        }
      )
    ).rejects.toThrow("inventory-reservation-operator-order-not-found");

    const events = await harness.payload.find({
      collection: "inventory-reservation-operator-events" as never,
      overrideAccess: true,
      depth: 0,
      where: { command_key: { equals: key } } as never
    });
    expect(events.docs).toEqual([
      expect.objectContaining({
        command_key: key,
        outcome_code: "inventory-reservation-operator-order-not-found",
        order: null,
        affected_count: 0
      })
    ]);
  });

  it("creates and consumes one paid-review recovery reservation", async () => {
    const fixture = await harness.createFixture();
    await harness.seedInventory(fixture, { quantity: 2 });
    const orderId = fixture.orderIds[0];
    await reserve({ harness, fixture, orderId, expiresAt: at(-5) });
    await expireOriginals(harness, fixture, orderId);
    const paymentId = await createPaidPayment(harness, fixture, orderId);

    const result = await harness.inTransaction(fixture, (req) =>
      recoverPaidInventoryReservationsInTransaction({
        payload: harness.payload,
        req,
        orderId,
        paymentId,
        idempotencyKey: commandKey("paid-recovery", fixture),
        providerEventRef: `portone:${fixture.suffix}`,
        effectiveAt: at(1)
      })
    );

    expect(result).toEqual({ kind: "confirmed", affectedCount: 1 });
    expect(await harness.availableQuantity(fixture)).toBe(1);
    const reservations = (await harness.reservations(fixture)).filter(
      (row) => row.order_id === orderId
    );
    expect(reservations.map((row) => row.status).sort()).toEqual([
      "consumed",
      "expired"
    ]);
    expect(await harness.reservationEntries(fixture)).toHaveLength(4);
  });

  it("keeps paid review open when another order holds the recovered ATP", async () => {
    const fixture = await harness.createFixture({ orderCount: 2 });
    await harness.seedInventory(fixture, { quantity: 1 });
    const [reviewOrderId, competingOrderId] = fixture.orderIds;
    await reserve({
      harness,
      fixture,
      orderId: reviewOrderId,
      expiresAt: at(-5)
    });
    await expireOriginals(harness, fixture, reviewOrderId);
    await reserve({ harness, fixture, orderId: competingOrderId });
    const paymentId = await createPaidPayment(harness, fixture, reviewOrderId);

    const result = await harness.inTransaction(fixture, (req) =>
      recoverPaidInventoryReservationsInTransaction({
        payload: harness.payload,
        req,
        orderId: reviewOrderId,
        paymentId,
        idempotencyKey: commandKey("paid-recovery-insufficient", fixture),
        providerEventRef: `portone:${fixture.suffix}`,
        effectiveAt: at(1)
      })
    );

    expect(result).toEqual({ kind: "review_remaining", affectedCount: 0 });
    expect(
      (await harness.reservations(fixture)).filter(
        (row) => row.order_id === reviewOrderId
      )
    ).toHaveLength(1);
    expect(await harness.availableQuantity(fixture)).toBe(1);
  });

  it("rolls back every recovery when one SKU lacks ATP", async () => {
    const fixture = await harness.createFixture({ orderCount: 2, skuCount: 2 });
    for (const skuId of fixture.skuIds) {
      await harness.seedInventory(fixture, { skuId, quantity: 1 });
    }
    const [reviewOrderId, competingOrderId] = fixture.orderIds;
    await reserve({
      harness,
      fixture,
      orderId: reviewOrderId,
      skuIds: fixture.skuIds,
      expiresAt: at(-5)
    });
    await expireOriginals(harness, fixture, reviewOrderId);
    await reserve({
      harness,
      fixture,
      orderId: competingOrderId,
      skuIds: [fixture.skuIds[1]]
    });
    const paymentId = await createPaidPayment(harness, fixture, reviewOrderId);

    const result = await harness.inTransaction(fixture, (req) =>
      recoverPaidInventoryReservationsInTransaction({
        payload: harness.payload,
        req,
        orderId: reviewOrderId,
        paymentId,
        idempotencyKey: commandKey("paid-recovery-multi-sku", fixture),
        providerEventRef: `portone:${fixture.suffix}`,
        effectiveAt: at(1)
      })
    );

    expect(result).toEqual({ kind: "review_remaining", affectedCount: 0 });
    const reviewReservations = (await harness.reservations(fixture)).filter(
      (row) => row.order_id === reviewOrderId
    );
    expect(reviewReservations).toHaveLength(2);
    expect(reviewReservations.every((row) => row.status === "expired")).toBe(
      true
    );
    expect(
      (await harness.reservationEntries(fixture)).filter((entry) =>
        reviewReservations.some(
          (reservation) => reservation.id === entry.reservation_id
        )
      )
    ).toHaveLength(4);
  });

  it("rolls back expiry work when audit persistence fails, then retries safely", async () => {
    const fixture = await harness.createFixture();
    await harness.seedInventory(fixture, { quantity: 1 });
    const orderId = fixture.orderIds[0];
    await reserve({ harness, fixture, orderId, expiresAt: at(-5) });
    const req = operatorRequest(harness, fixture);
    const queue = await listInventoryReservationOperatorQueue({
      payload: harness.payload,
      req,
      queue: "stuck",
      limit: 25
    });
    const key = commandKey("operator-run-expiry", fixture);
    const command = {
      action: "run_expiry" as const,
      expectedStateHash: queue.stateHash,
      reasonCode: "expiry-job-outage",
      evidenceReference: `incident:${fixture.suffix}`,
      batchSize: 25
    };
    const originalCreate = harness.payload.create.bind(harness.payload);
    vi.spyOn(harness.payload, "create").mockImplementation(async (args) => {
      if (args.collection === "inventory-reservation-operator-events") {
        throw new Error("operator-audit-outage");
      }
      return originalCreate(args as never) as never;
    });

    await expect(
      runInventoryReservationOperatorCommand(command, {
        payload: harness.payload,
        req,
        commandKey: key
      })
    ).rejects.toThrow("inventory-reservation-operator-failure-evidence-failed");
    expect((await harness.reservations(fixture))[0]?.status).toBe("active");
    await harness.payload.db.drizzle.execute(
      // Lease expiry is the durable retry boundary after a process failure.
      sql`
        UPDATE commerce_commands SET lease_expires_at = CURRENT_TIMESTAMP - interval '1 second'
        WHERE command_key = ${key}
      `
    );
    vi.restoreAllMocks();

    await expect(
      runInventoryReservationOperatorCommand(command, {
        payload: harness.payload,
        req,
        commandKey: key
      })
    ).resolves.toMatchObject({
      kind: "succeeded",
      status: "expiry-run-completed",
      affectedCount: 1
    });
    expect((await harness.reservations(fixture))[0]?.status).toBe("expired");
    const attempts = await harness.payload.find({
      collection: "commerce-commands" as never,
      overrideAccess: true,
      depth: 0,
      where: { command_key: { equals: key } } as never
    });
    expect(attempts.docs).toEqual([
      expect.objectContaining({ status: "succeeded", attempt_count: 2 })
    ]);
    const events = await harness.payload.find({
      collection: "inventory-reservation-operator-events" as never,
      overrideAccess: true,
      depth: 0,
      where: { command_key: { equals: key } } as never
    });
    expect(events.docs).toEqual([
      expect.objectContaining({ outcome_code: "expiry-run-completed" })
    ]);
  });

  it("expires once when the operator and worker overlap", async () => {
    const fixture = await harness.createFixture();
    await harness.seedInventory(fixture, { quantity: 1 });
    const orderId = fixture.orderIds[0];
    await reserve({ harness, fixture, orderId, expiresAt: at(-5) });
    const req = operatorRequest(harness, fixture);
    const state = await loadInventoryReservationOperatorOrderState({
      payload: harness.payload,
      req,
      orderId
    });

    const outcomes = await Promise.allSettled([
      runInventoryReservationOperatorCommand(
        {
          action: "expire",
          orderId,
          expectedStateHash: state.stateHash,
          reasonCode: "manual-expiry",
          evidenceReference: `incident:${fixture.suffix}`
        },
        {
          payload: harness.payload,
          req,
          commandKey: commandKey("manual-expiry", fixture)
        }
      ),
      expireDueInventoryReservationOrders({
        payload: harness.payload,
        batchSize: 25
      })
    ]);

    expect(outcomes.some((outcome) => outcome.status === "fulfilled")).toBe(
      true
    );
    expect((await harness.reservations(fixture))[0]?.status).toBe("expired");
    expect(
      (await harness.reservationEntries(fixture)).filter(
        (entry) => entry.operation === "expire"
      )
    ).toHaveLength(1);
    expect(await harness.availableQuantity(fixture)).toBe(1);
  });
});
