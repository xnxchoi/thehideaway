import { randomUUID } from "node:crypto";
import { sql } from "@payloadcms/db-postgres";
import {
  afterEach,
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
  vi
} from "vitest";

import { hashCommerceCommandInput } from "./commerce-commands";
import {
  expireInventoryReservationInTransaction,
  reserveOrderInventoryInTransaction
} from "./inventory-reservations";
import {
  createReservationPostgresHarness,
  reservationTestDatabaseUri,
  type ReservationFixture,
  type ReservationPostgresHarness
} from "./inventory-reservations.postgres.fixtures";
import { releaseOrderInventoryReservationsInTransaction } from "./order-inventory-reservations";
import { cancelUnpaidProductOrder } from "./orders";

const getPortOnePayment = vi.hoisted(() => vi.fn());

vi.mock("./verify-payment", async (importOriginal) => {
  const actual = await importOriginal<typeof import("./verify-payment")>();
  return { ...actual, getPortOnePayment };
});

import { syncProductPayment } from "./product-payment";

const testDatabaseUri = reservationTestDatabaseUri;
const describeWithPostgres = testDatabaseUri ? describe : describe.skip;

type TransactionRequest = { transactionID?: string | number };
type QueryResult<Row = Record<string, unknown>> = { rows: Row[] };
type LifecycleRow = Record<string, unknown>;

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

function databaseFor(payload: any, req?: TransactionRequest) {
  if (req?.transactionID !== undefined) {
    const session = payload.db.sessions[String(req.transactionID)];
    if (!session) throw new Error("lifecycle-test-session-missing");
    return session.db;
  }
  return payload.db.drizzle;
}

async function orderRows(
  payload: any,
  req: TransactionRequest | undefined,
  condition: ReturnType<typeof sql>
): Promise<LifecycleRow[]> {
  const result = (await databaseFor(payload, req).execute(sql`
    SELECT id, order_ref, user_id AS user, storefront, order_mode, status,
      payment_status, fulfillment_status, currency,
      subtotal_amount::double precision AS subtotal_amount,
      total_amount::double precision AS total_amount,
      lines, paid_at, expires_at
    FROM product_orders
    WHERE ${condition}
    ORDER BY id
  `)) as QueryResult<LifecycleRow>;
  return result.rows;
}

async function paymentRows(
  payload: any,
  req: TransactionRequest | undefined,
  condition: ReturnType<typeof sql>
): Promise<LifecycleRow[]> {
  const result = (await databaseFor(payload, req).execute(sql`
    SELECT id, payment_ref, order_id AS "order", user_id AS "user",
      provider, status, amount::double precision AS amount, currency,
      portone_order_ref, portone_transaction_ref, paid_at
    FROM product_payments
    WHERE ${condition}
    ORDER BY id
  `)) as QueryResult<LifecycleRow>;
  return result.rows;
}

function createLifecyclePayload(basePayload: any) {
  const callBase = async (
    operation: (args: any) => Promise<unknown>,
    args: any
  ) => {
    try {
      return await operation(args);
    } catch (error) {
      throw (error as Error & { cause?: Error }).cause ?? error;
    } finally {
      if (args.req) args.req.payload = lifecyclePayload;
    }
  };
  const lifecyclePayload: any = {
    ...basePayload,
    db: basePayload.db,
    logger: basePayload.logger,
    find: async (args: any) => {
      if (args.collection === "product-orders") {
        const orderRef = args.where?.order_ref?.equals;
        const id = args.where?.id?.equals;
        const docs = await orderRows(
          basePayload,
          args.req,
          orderRef
            ? sql`order_ref = ${orderRef}`
            : id
              ? sql`id = ${id}`
              : sql`TRUE`
        );
        return { docs, totalDocs: docs.length };
      }
      if (args.collection === "product-payments") {
        const paymentRef = args.where?.payment_ref?.equals;
        const orderId = args.where?.order?.equals;
        const docs = await paymentRows(
          basePayload,
          args.req,
          paymentRef
            ? sql`payment_ref = ${paymentRef}`
            : orderId
              ? sql`order_id = ${orderId}`
              : sql`TRUE`
        );
        return { docs, totalDocs: docs.length };
      }
      return callBase(basePayload.find.bind(basePayload), args);
    },
    findByID: async (args: any) => {
      if (args.collection === "product-orders") {
        return (
          await orderRows(basePayload, args.req, sql`id = ${args.id}`)
        )[0];
      }
      if (args.collection === "product-payments") {
        return (
          await paymentRows(basePayload, args.req, sql`id = ${args.id}`)
        )[0];
      }
      return callBase(basePayload.findByID.bind(basePayload), args);
    },
    update: async (args: any) => {
      if (args.collection === "product-orders") {
        const data = args.data ?? {};
        const result = (await databaseFor(basePayload, args.req).execute(sql`
          UPDATE product_orders
          SET
            status = COALESCE(${data.status ?? null}::enum_product_orders_status, status),
            payment_status = COALESCE(${data.payment_status ?? null}::enum_product_orders_payment_status, payment_status),
            fulfillment_status = COALESCE(${data.fulfillment_status ?? null}::enum_product_orders_fulfillment_status, fulfillment_status),
            paid_at = COALESCE(${data.paid_at ?? null}::timestamptz, paid_at),
            updated_at = now()
          WHERE id = ${args.id}
          RETURNING id
        `)) as QueryResult<LifecycleRow>;
        return result.rows[0];
      }
      if (args.collection === "product-payments") {
        const data = args.data ?? {};
        const result = (await databaseFor(basePayload, args.req).execute(sql`
          UPDATE product_payments
          SET
            status = COALESCE(${data.status ?? null}::enum_product_payments_status, status),
            portone_transaction_ref = COALESCE(${data.portone_transaction_ref ?? null}, portone_transaction_ref),
            paid_at = COALESCE(${data.paid_at ?? null}::timestamptz, paid_at),
            updated_at = now()
          WHERE id = ${args.id}
          RETURNING id
        `)) as QueryResult<LifecycleRow>;
        return result.rows[0];
      }
      return callBase(basePayload.update.bind(basePayload), args);
    },
    create: (args: any) => callBase(basePayload.create.bind(basePayload), args)
  };
  return lifecyclePayload;
}

type Scenario = {
  fixture: ReservationFixture;
  order: LifecycleRow;
  orderId: string;
  paymentId: string;
  paymentRef: string;
  reservationId: string;
};

type MultiSkuScenario = Omit<Scenario, "reservationId"> & {
  reservationIds: string[];
};

describeWithPostgres.sequential(
  "product payment and reservation lifecycle with PostgreSQL",
  () => {
    let harness: ReservationPostgresHarness;
    let payload: any;
    let paymentIds: string[] = [];

    beforeAll(async () => {
      harness = await createReservationPostgresHarness(
        testDatabaseUri as string
      );
      payload = createLifecyclePayload(harness.payload);
    }, 60_000);

    beforeEach(() => {
      paymentIds = [];
      getPortOnePayment.mockReset();
    });

    afterEach(async () => {
      await harness.cleanup();
      for (const paymentId of paymentIds) {
        await harness.payload.db.drizzle.execute(
          sql`DELETE FROM product_payments WHERE id = ${paymentId}`
        );
      }
      paymentIds = [];
    });

    async function createScenario(input?: {
      effectiveAt?: string;
      expiresAt?: string;
    }): Promise<Scenario> {
      const fixture = await harness.createFixture();
      await harness.seedInventory(fixture, { quantity: 1 });
      const orderId = fixture.orderIds[0];
      const effectiveAt = input?.effectiveAt ?? at(-5);
      const expiresAt = input?.expiresAt ?? at(10);
      await harness.inTransaction(fixture, (req) =>
        reserveOrderInventoryInTransaction({
          payload: harness.payload,
          req,
          policy: policy(fixture),
          requests: [
            {
              idempotencyKey: hashCommerceCommandInput({
                operation: "reserve",
                orderId
              }),
              operation: "reserve",
              orderId,
              skuId: fixture.skuIds[0],
              locationId: fixture.locationId,
              quantity: 1,
              effectiveAt,
              expiresAt
            }
          ]
        })
      );
      const order = (
        await orderRows(harness.payload, undefined, sql`id = ${orderId}`)
      )[0];
      if (!order) throw new Error("lifecycle-test-order-missing");
      const paymentId = randomUUID();
      const paymentRef = `${String(order.order_ref)}_portone`;
      await harness.payload.db.drizzle.execute(sql`
        INSERT INTO product_payments (
          id, payment_ref, order_id, user_id, provider, status, amount,
          currency, portone_order_ref
        ) VALUES (
          ${paymentId}, ${paymentRef}, ${orderId}, ${fixture.userId},
          'portone', 'pending', ${Number(order.total_amount)}, 'KRW',
          ${String(order.order_ref)}
        )
      `);
      paymentIds = [...paymentIds, paymentId];
      const reservation = (await harness.reservations(fixture))[0];
      if (!reservation) throw new Error("lifecycle-test-reservation-missing");
      return {
        fixture,
        order,
        orderId,
        paymentId,
        paymentRef,
        reservationId: reservation.id
      };
    }

    async function createPaymentForOrder(
      fixture: ReservationFixture,
      orderId: string
    ) {
      const order = (
        await orderRows(harness.payload, undefined, sql`id = ${orderId}`)
      )[0];
      if (!order) throw new Error("lifecycle-test-order-missing");
      const paymentId = randomUUID();
      const paymentRef = `${String(order.order_ref)}_portone`;
      await harness.payload.db.drizzle.execute(sql`
        INSERT INTO product_payments (
          id, payment_ref, order_id, user_id, provider, status, amount,
          currency, portone_order_ref
        ) VALUES (
          ${paymentId}, ${paymentRef}, ${orderId}, ${fixture.userId},
          'portone', 'pending', ${Number(order.total_amount)}, 'KRW',
          ${String(order.order_ref)}
        )
      `);
      paymentIds = [...paymentIds, paymentId];
      return { order, paymentId, paymentRef };
    }

    async function createMultiSkuScenario(): Promise<MultiSkuScenario> {
      const fixture = await harness.createFixture({ skuCount: 2 });
      await Promise.all(
        fixture.skuIds.map((skuId) =>
          harness.seedInventory(fixture, { skuId, quantity: 1 })
        )
      );
      const orderId = fixture.orderIds[0];
      await harness.inTransaction(fixture, (req) =>
        reserveOrderInventoryInTransaction({
          payload: harness.payload,
          req,
          policy: policy(fixture),
          requests: fixture.skuIds.map((skuId, index) => ({
            idempotencyKey: hashCommerceCommandInput({
              operation: "reserve-multi-sku",
              orderId,
              index
            }),
            operation: "reserve" as const,
            orderId,
            skuId,
            locationId: fixture.locationId,
            quantity: 1,
            effectiveAt: at(-5),
            expiresAt: at(10)
          }))
        })
      );
      const payment = await createPaymentForOrder(fixture, orderId);
      return {
        fixture,
        orderId,
        ...payment,
        reservationIds: (await harness.reservations(fixture)).map(
          (reservation) => reservation.id
        )
      };
    }

    function authoritativePaid(paymentRef: string, paidAt: string, amount = 1) {
      getPortOnePayment.mockResolvedValue({
        id: paymentRef,
        status: "PAID",
        amount: { total: amount, paid: amount },
        currency: "KRW",
        channel: { type: "LIVE" },
        paidAt,
        transactionId: `txn-${paymentRef}`
      });
    }

    async function storedOrder(orderId: string) {
      return (
        await orderRows(harness.payload, undefined, sql`id = ${orderId}`)
      )[0];
    }

    async function storedPayment(paymentId: string) {
      return (
        await paymentRows(harness.payload, undefined, sql`id = ${paymentId}`)
      )[0];
    }

    async function lifecycleEntries(reservationId: string) {
      const result = (await harness.payload.db.drizzle.execute(sql`
        SELECT operation, provider_event_ref, evidence_code, actor
        FROM inventory_reservation_entries
        WHERE reservation_id = ${reservationId}
        ORDER BY created_at, id
      `)) as QueryResult<{
        operation: string;
        actor: string | null;
        provider_event_ref: string | null;
        evidence_code: string | null;
      }>;
      return result.rows;
    }

    async function reservationMovements(reservationIds: string[]) {
      const result = (await harness.payload.db.drizzle.execute(sql`
        SELECT source_ref
        FROM inventory_movements
        WHERE source_type::text = 'inventory_reservation'
          AND source_ref IN (${sql.join(
            reservationIds.map((reservationId) => sql`${reservationId}`),
            sql`, `
          )})
        ORDER BY source_ref
      `)) as QueryResult<{ source_ref: string }>;
      return result.rows;
    }

    async function setReserveEntryQuantityForFailure(
      reservationId: string,
      quantity: number
    ) {
      const transactionID = await harness.payload.db.beginTransaction();
      if (!transactionID) throw new Error("lifecycle-test-transaction-missing");
      const database = databaseFor(harness.payload, { transactionID });
      try {
        await database.execute(
          sql`SET LOCAL session_replication_role = replica`
        );
        await database.execute(sql`
          UPDATE inventory_reservation_entries SET quantity = ${quantity}
          WHERE reservation_id = ${reservationId} AND operation = 'reserve'
        `);
        await harness.payload.db.commitTransaction(transactionID);
      } catch (error) {
        await harness.payload.db.rollbackTransaction(transactionID);
        throw error;
      }
    }

    it.each([
      ["request_to_order", "pending_payment", "paid"],
      ["private_order", "pending_payment", "confirmed"],
      ["request_to_order", "failed", "paid_inventory_review"],
      ["private_order", "canceled", "paid_inventory_review"]
    ] as const)(
      "reconciles paid %s orders from %s without inventory reservations",
      async (orderMode, initialStatus, expectedStatus) => {
        const fixture = await harness.createFixture();
        const orderId = fixture.orderIds[0];
        await harness.payload.db.drizzle.execute(sql`
          UPDATE product_orders
          SET order_mode = ${orderMode}, status = ${initialStatus}
          WHERE id = ${orderId}
        `);
        const payment = await createPaymentForOrder(fixture, orderId);
        authoritativePaid(String(payment.order.order_ref), at(0));

        await expect(
          syncProductPayment({
            payload,
            paymentId: String(payment.order.order_ref),
            providerEventRef: `event-non-stocked-${orderMode}-${fixture.suffix}`
          })
        ).resolves.toMatchObject({
          ok: true,
          status: "paid",
          alreadyProcessed: false
        });

        expect(await storedOrder(orderId)).toMatchObject({
          order_mode: orderMode,
          payment_status: "paid",
          status: expectedStatus
        });
        expect(await harness.reservations(fixture)).toEqual([]);
      }
    );

    it("serializes authoritative paid confirmation against expiry", async () => {
      const scenario = await createScenario({
        effectiveAt: at(-20),
        expiresAt: at(-1)
      });
      authoritativePaid(String(scenario.order.order_ref), at(-2));
      const providerEventRef = `event-paid-expiry-${scenario.fixture.suffix}`;

      const [paid, expiry] = await Promise.allSettled([
        syncProductPayment({
          payload,
          paymentId: String(scenario.order.order_ref),
          providerEventRef
        }),
        harness.inTransaction(scenario.fixture, (req) =>
          expireInventoryReservationInTransaction({
            payload: harness.payload,
            req,
            request: {
              idempotencyKey: hashCommerceCommandInput({
                operation: "expiry-race",
                reservationId: scenario.reservationId
              }),
              operation: "expire",
              orderId: scenario.orderId,
              skuId: scenario.fixture.skuIds[0],
              locationId: scenario.fixture.locationId,
              reservationId: scenario.reservationId,
              quantity: 1,
              effectiveAt: at(0)
            }
          })
        )
      ]);

      expect(paid).toMatchObject({
        status: "fulfilled",
        value: { ok: true, status: "paid" }
      });
      expect(["fulfilled", "rejected"]).toContain(expiry.status);
      const order = await storedOrder(scenario.orderId);
      const reservation = (await harness.reservations(scenario.fixture))[0];
      expect(await storedPayment(scenario.paymentId)).toMatchObject({
        status: "paid"
      });
      expect([
        ["confirmed", "consumed", 0],
        ["paid_inventory_review", "expired", 1]
      ]).toContainEqual([
        order?.status,
        reservation?.status,
        await harness.availableQuantity(scenario.fixture)
      ]);
      expect(await lifecycleEntries(scenario.reservationId)).toContainEqual(
        expect.objectContaining({ provider_event_ref: providerEventRef })
      );
    });

    it("serializes authoritative paid confirmation against cancellation", async () => {
      const scenario = await createScenario();
      authoritativePaid(String(scenario.order.order_ref), at(0));
      const providerEventRef = `event-paid-cancel-${scenario.fixture.suffix}`;

      const [paid, canceled] = await Promise.all([
        syncProductPayment({
          payload,
          paymentId: String(scenario.order.order_ref),
          providerEventRef
        }),
        cancelUnpaidProductOrder({ payload, order: scenario.order })
      ]);

      expect(paid).toMatchObject({ ok: true, status: "paid" });
      expect(canceled.ok).toBe(true);
      const order = await storedOrder(scenario.orderId);
      const reservation = (await harness.reservations(scenario.fixture))[0];
      expect(await storedPayment(scenario.paymentId)).toMatchObject({
        status: "paid"
      });
      expect([
        ["confirmed", "consumed", 0],
        ["paid_inventory_review", "released", 1]
      ]).toContainEqual([
        order?.status,
        reservation?.status,
        await harness.availableQuantity(scenario.fixture)
      ]);
      expect(await lifecycleEntries(scenario.reservationId)).toContainEqual(
        expect.objectContaining({ provider_event_ref: providerEventRef })
      );
    });

    it("consumes once when duplicate paid reconciliation runs concurrently", async () => {
      const scenario = await createScenario();
      authoritativePaid(String(scenario.order.order_ref), at(0));
      const providerEventRef = `event-duplicate-paid-${scenario.fixture.suffix}`;

      const results = await Promise.all([
        syncProductPayment({
          payload,
          paymentId: String(scenario.order.order_ref),
          providerEventRef
        }),
        syncProductPayment({
          payload,
          paymentId: String(scenario.order.order_ref),
          providerEventRef
        })
      ]);

      expect(results).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ ok: true, alreadyProcessed: false }),
          expect.objectContaining({ ok: true, alreadyProcessed: true })
        ])
      );
      const entries = await lifecycleEntries(scenario.reservationId);
      expect(entries.filter((entry) => entry.operation === "consume")).toEqual([
        expect.objectContaining({
          actor: "system:inventory-reservation",
          provider_event_ref: providerEventRef
        })
      ]);
      expect((await harness.reservations(scenario.fixture))[0]).toMatchObject({
        status: "consumed"
      });
      expect(await harness.availableQuantity(scenario.fixture)).toBe(0);
    });

    it.each([
      [-1, "confirmed", "consumed", false],
      [0, "paid_inventory_review", "active", true],
      [1, "paid_inventory_review", "active", true]
    ] as const)(
      "applies the provider payment timestamp at expiry %+dms",
      async (offsetMs, orderStatus, reservationStatus, expectsReview) => {
        const expiresAt = at(10);
        const scenario = await createScenario({ expiresAt });
        const paidAt = new Date(Date.parse(expiresAt) + offsetMs).toISOString();
        const providerEventRef = `event-expiry-boundary-${offsetMs}-${scenario.fixture.suffix}`;
        authoritativePaid(String(scenario.order.order_ref), paidAt);

        await expect(
          syncProductPayment({
            payload,
            paymentId: String(scenario.order.order_ref),
            providerEventRef
          })
        ).resolves.toMatchObject({ ok: true, alreadyProcessed: false });
        expect(await storedOrder(scenario.orderId)).toMatchObject({
          status: orderStatus,
          payment_status: "paid"
        });
        expect((await harness.reservations(scenario.fixture))[0]).toMatchObject(
          {
            status: reservationStatus
          }
        );
        const reviewEntries = (
          await lifecycleEntries(scenario.reservationId)
        ).filter((entry) => entry.operation === "late_payment_detected");
        expect(reviewEntries).toHaveLength(expectsReview ? 1 : 0);
      }
    );

    it("atomically consumes every SKU in a paid order and replays without duplicate movements", async () => {
      const scenario = await createMultiSkuScenario();
      authoritativePaid(String(scenario.order.order_ref), at(0), 2);
      const providerEventRef = `event-multi-sku-${scenario.fixture.suffix}`;

      await expect(
        syncProductPayment({
          payload,
          paymentId: String(scenario.order.order_ref),
          providerEventRef
        })
      ).resolves.toMatchObject({ ok: true, alreadyProcessed: false });
      await expect(
        syncProductPayment({
          payload,
          paymentId: String(scenario.order.order_ref),
          providerEventRef
        })
      ).resolves.toMatchObject({ ok: true, alreadyProcessed: true });

      expect(await harness.reservations(scenario.fixture)).toEqual([
        expect.objectContaining({ status: "consumed" }),
        expect.objectContaining({ status: "consumed" })
      ]);
      for (const skuId of scenario.fixture.skuIds) {
        expect(await harness.availableQuantity(scenario.fixture, skuId)).toBe(
          0
        );
      }
      const entries = await Promise.all(
        scenario.reservationIds.map((reservationId) =>
          lifecycleEntries(reservationId)
        )
      );
      expect(
        entries.flat().filter((entry) => entry.operation === "consume")
      ).toEqual([
        expect.objectContaining({ provider_event_ref: providerEventRef }),
        expect.objectContaining({ provider_event_ref: providerEventRef })
      ]);
      expect(await reservationMovements(scenario.reservationIds)).toEqual(
        scenario.reservationIds
          .map((source_ref) => ({ source_ref }))
          .sort((left, right) =>
            left.source_ref.localeCompare(right.source_ref)
          )
      );
    });

    it("rolls back an earlier SKU consume when a later reservation fails, then succeeds on retry", async () => {
      const scenario = await createMultiSkuScenario();
      const secondReservationId = scenario.reservationIds[1];
      if (!secondReservationId) {
        throw new Error("lifecycle-test-second-reservation-missing");
      }
      await setReserveEntryQuantityForFailure(secondReservationId, 2);
      authoritativePaid(String(scenario.order.order_ref), at(0), 2);

      await expect(
        syncProductPayment({
          payload,
          paymentId: String(scenario.order.order_ref),
          providerEventRef: `event-multi-failure-${scenario.fixture.suffix}`
        })
      ).resolves.toEqual({
        ok: false,
        status: 503,
        reason: "verify-unavailable"
      });

      expect(await storedPayment(scenario.paymentId)).toMatchObject({
        status: "pending",
        paid_at: null
      });
      expect(await storedOrder(scenario.orderId)).toMatchObject({
        status: "pending_payment",
        payment_status: "pending"
      });
      expect((await harness.reservations(scenario.fixture))[0]).toMatchObject({
        status: "active"
      });
      expect(
        (await lifecycleEntries(scenario.reservationIds[0]!)).filter(
          (entry) => entry.operation === "consume"
        )
      ).toEqual([]);
      expect(await reservationMovements(scenario.reservationIds)).toEqual([]);
      expect(
        await harness.availableQuantity(
          scenario.fixture,
          scenario.fixture.skuIds[0]
        )
      ).toBe(1);

      await setReserveEntryQuantityForFailure(secondReservationId, 1);
      await expect(
        syncProductPayment({
          payload,
          paymentId: String(scenario.order.order_ref),
          providerEventRef: `event-multi-retry-${scenario.fixture.suffix}`
        })
      ).resolves.toMatchObject({ ok: true, alreadyProcessed: false });
      expect(await harness.reservations(scenario.fixture)).toEqual([
        expect.objectContaining({ status: "consumed" }),
        expect.objectContaining({ status: "consumed" })
      ]);
      expect(await reservationMovements(scenario.reservationIds)).toHaveLength(
        2
      );
    });

    it("consumes available lines and records one durable review for a later physical shortfall", async () => {
      const scenario = await createMultiSkuScenario();
      const secondSkuId = scenario.fixture.skuIds[1];
      const secondReservationId = scenario.reservationIds[1];
      if (!secondSkuId || !secondReservationId) {
        throw new Error("lifecycle-test-second-sku-missing");
      }
      await harness.payload.db.drizzle.execute(sql`
        UPDATE inventory_levels
        SET quantity = 0
        WHERE sku_id = ${secondSkuId}
          AND location_id = ${scenario.fixture.locationId}
          AND disposition = 'available'
      `);
      authoritativePaid(String(scenario.order.order_ref), at(0), 2);
      const providerEventRef = `event-multi-review-${scenario.fixture.suffix}`;

      await expect(
        syncProductPayment({
          payload,
          paymentId: String(scenario.order.order_ref),
          providerEventRef
        })
      ).resolves.toMatchObject({ ok: true, alreadyProcessed: false });
      await expect(
        syncProductPayment({
          payload,
          paymentId: String(scenario.order.order_ref),
          providerEventRef
        })
      ).resolves.toMatchObject({ ok: true, alreadyProcessed: true });

      expect(await storedPayment(scenario.paymentId)).toMatchObject({
        status: "paid"
      });
      expect(await storedOrder(scenario.orderId)).toMatchObject({
        status: "paid_inventory_review",
        payment_status: "paid"
      });
      expect(await harness.reservations(scenario.fixture)).toEqual([
        expect.objectContaining({ status: "consumed" }),
        expect.objectContaining({ status: "active" })
      ]);
      expect(
        (await lifecycleEntries(scenario.reservationIds[0]!)).filter(
          (entry) => entry.operation === "consume"
        )
      ).toEqual([
        expect.objectContaining({ provider_event_ref: providerEventRef })
      ]);
      expect(
        (await lifecycleEntries(secondReservationId)).filter(
          (entry) => entry.operation === "late_payment_detected"
        )
      ).toEqual([
        expect.objectContaining({
          evidence_code: "physical_inventory_unavailable",
          provider_event_ref: providerEventRef
        })
      ]);
      expect(await reservationMovements(scenario.reservationIds)).toHaveLength(
        1
      );
    });

    it("serializes paid consume against a competing checkout reservation on the same aggregate", async () => {
      const fixture = await harness.createFixture({ orderCount: 2 });
      await harness.seedInventory(fixture, { quantity: 1 });
      const [paidOrderId, competingOrderId] = fixture.orderIds;
      if (!paidOrderId || !competingOrderId) {
        throw new Error("lifecycle-test-competing-orders-missing");
      }
      await harness.inTransaction(fixture, (req) =>
        reserveOrderInventoryInTransaction({
          payload: harness.payload,
          req,
          policy: policy(fixture),
          requests: [
            {
              idempotencyKey: hashCommerceCommandInput({
                operation: "reserve-before-competing-paid",
                orderId: paidOrderId
              }),
              operation: "reserve",
              orderId: paidOrderId,
              skuId: fixture.skuIds[0],
              locationId: fixture.locationId,
              quantity: 1,
              effectiveAt: at(-5),
              expiresAt: at(10)
            }
          ]
        })
      );
      const payment = await createPaymentForOrder(fixture, paidOrderId);
      authoritativePaid(String(payment.order.order_ref), at(0));

      const [paid, competing] = await Promise.allSettled([
        syncProductPayment({
          payload,
          paymentId: String(payment.order.order_ref),
          providerEventRef: `event-competing-consume-${fixture.suffix}`
        }),
        harness.inTransaction(fixture, (req) =>
          reserveOrderInventoryInTransaction({
            payload: harness.payload,
            req,
            policy: policy(fixture),
            requests: [
              {
                idempotencyKey: hashCommerceCommandInput({
                  operation: "competing-reserve",
                  orderId: competingOrderId
                }),
                operation: "reserve",
                orderId: competingOrderId,
                skuId: fixture.skuIds[0],
                locationId: fixture.locationId,
                quantity: 1,
                effectiveAt: at(0),
                expiresAt: at(10)
              }
            ]
          })
        )
      ]);

      expect(paid).toMatchObject({
        status: "fulfilled",
        value: { ok: true, alreadyProcessed: false }
      });
      expect(competing).toMatchObject({
        status: "rejected",
        reason: expect.objectContaining({
          message: "insufficient-available-to-promise"
        })
      });
      expect(await storedOrder(paidOrderId)).toMatchObject({
        status: "confirmed",
        payment_status: "paid"
      });
      expect(await harness.reservations(fixture)).toEqual([
        expect.objectContaining({
          order_id: paidOrderId,
          status: "consumed"
        })
      ]);
      expect(await harness.availableQuantity(fixture)).toBe(0);
    });

    it("routes a provider timestamp before reservation to paid inventory review", async () => {
      const scenario = await createScenario({
        effectiveAt: at(0),
        expiresAt: at(10)
      });
      const providerEventRef = `event-early-${scenario.fixture.suffix}`;
      authoritativePaid(String(scenario.order.order_ref), at(-1));

      await expect(
        syncProductPayment({
          payload,
          paymentId: String(scenario.order.order_ref),
          providerEventRef
        })
      ).resolves.toMatchObject({ ok: true, status: "paid" });

      expect(await storedOrder(scenario.orderId)).toMatchObject({
        payment_status: "paid",
        status: "paid_inventory_review"
      });
      expect((await harness.reservations(scenario.fixture))[0]).toMatchObject({
        status: "active"
      });
      expect(await harness.availableQuantity(scenario.fixture)).toBe(1);
      expect(await lifecycleEntries(scenario.reservationId)).toContainEqual(
        expect.objectContaining({
          operation: "late_payment_detected",
          provider_event_ref: providerEventRef,
          evidence_code: "provider_timestamp_before_reservation"
        })
      );
    });

    it.each(["release", "expire"] as const)(
      "routes payment after %s to paid inventory review without reacquiring stock",
      async (terminal) => {
        const scenario = await createScenario({
          effectiveAt: at(-20),
          expiresAt: terminal === "expire" ? at(-1) : at(10)
        });
        if (terminal === "release") {
          await harness.inTransaction(scenario.fixture, (req) =>
            releaseOrderInventoryReservationsInTransaction({
              payload: harness.payload,
              req,
              orderId: scenario.orderId,
              idempotencyKey: hashCommerceCommandInput({
                operation: "release-before-paid",
                orderId: scenario.orderId
              }),
              effectiveAt: at(0)
            })
          );
        } else {
          await harness.inTransaction(scenario.fixture, (req) =>
            expireInventoryReservationInTransaction({
              payload: harness.payload,
              req,
              request: {
                idempotencyKey: hashCommerceCommandInput({
                  operation: "expire-before-paid",
                  reservationId: scenario.reservationId
                }),
                operation: "expire",
                orderId: scenario.orderId,
                skuId: scenario.fixture.skuIds[0],
                locationId: scenario.fixture.locationId,
                reservationId: scenario.reservationId,
                quantity: 1,
                effectiveAt: at(0)
              }
            })
          );
        }
        authoritativePaid(String(scenario.order.order_ref), at(0));
        const providerEventRef = `event-late-${terminal}-${scenario.fixture.suffix}`;

        await expect(
          syncProductPayment({
            payload,
            paymentId: String(scenario.order.order_ref),
            providerEventRef
          })
        ).resolves.toMatchObject({ ok: true, alreadyProcessed: false });

        expect(await storedOrder(scenario.orderId)).toMatchObject({
          payment_status: "paid",
          status: "paid_inventory_review"
        });
        expect((await harness.reservations(scenario.fixture))[0]).toMatchObject(
          {
            status: terminal === "release" ? "released" : "expired"
          }
        );
        expect(await harness.availableQuantity(scenario.fixture)).toBe(1);
        expect(await lifecycleEntries(scenario.reservationId)).toContainEqual(
          expect.objectContaining({
            operation: "late_payment_detected",
            provider_event_ref: providerEventRef,
            evidence_code: "provider_payment_late"
          })
        );
      }
    );

    it("rolls back payment, consume, movement, and reservation when the order transition fails", async () => {
      const scenario = await createScenario();
      await harness.payload.db.drizzle.execute(sql`
        UPDATE product_orders
        SET status = 'converted'
        WHERE id = ${scenario.orderId}
      `);
      authoritativePaid(String(scenario.order.order_ref), at(0));

      await expect(
        syncProductPayment({
          payload,
          paymentId: String(scenario.order.order_ref),
          providerEventRef: `event-rollback-${scenario.fixture.suffix}`
        })
      ).resolves.toEqual({ ok: false, status: 409, reason: "order-final" });

      expect(await storedOrder(scenario.orderId)).toMatchObject({
        status: "converted",
        payment_status: "pending"
      });
      expect(await storedPayment(scenario.paymentId)).toMatchObject({
        status: "pending",
        paid_at: null
      });
      expect((await harness.reservations(scenario.fixture))[0]).toMatchObject({
        status: "active"
      });
      expect(await lifecycleEntries(scenario.reservationId)).toEqual([
        expect.objectContaining({ operation: "reserve" })
      ]);
      expect(await harness.availableQuantity(scenario.fixture)).toBe(1);
    });
  }
);
