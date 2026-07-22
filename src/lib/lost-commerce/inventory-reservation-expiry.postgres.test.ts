import { afterEach, beforeAll, describe, expect, it } from "vitest";

import { expireDueInventoryReservationOrders } from "./inventory-reservation-expiry";
import { reserveOrderInventoryInTransaction } from "./inventory-reservations";
import {
  createReservationPostgresHarness,
  reservationTestDatabaseUri,
  type ReservationFixture,
  type ReservationPostgresHarness
} from "./inventory-reservations.postgres.fixtures";

const testDatabaseUri = reservationTestDatabaseUri;
const describeWithPostgres = testDatabaseUri ? describe : describe.skip;

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

describeWithPostgres.sequential(
  "recurring reservation expiry with PostgreSQL",
  () => {
    let harness: ReservationPostgresHarness;

    beforeAll(async () => {
      harness = await createReservationPostgresHarness(
        testDatabaseUri as string
      );
    }, 60_000);

    afterEach(async () => {
      await harness.cleanup();
    });

    it("lets overlapping workers expire an entire order once without changing physical inventory", async () => {
      const fixture = await harness.createFixture({ skuCount: 2 });
      await Promise.all(
        fixture.skuIds.map((skuId) =>
          harness.seedInventory(fixture, { skuId, quantity: 1 })
        )
      );
      const orderId = fixture.orderIds[0];
      const effectiveAt = at(-20);
      const expiresAt = at(-5);
      await harness.inTransaction(fixture, (req) =>
        reserveOrderInventoryInTransaction({
          payload: harness.payload,
          req,
          policy: policy(fixture),
          requests: fixture.skuIds.map((skuId, index) => ({
            idempotencyKey: `scheduled-expiry-seed-${index}-${fixture.suffix}`,
            operation: "reserve" as const,
            orderId,
            skuId,
            locationId: fixture.locationId,
            quantity: 1,
            effectiveAt,
            expiresAt
          }))
        })
      );

      const outcomes = await Promise.all([
        expireDueInventoryReservationOrders({
          payload: harness.payload,
          batchSize: 10
        }),
        expireDueInventoryReservationOrders({
          payload: harness.payload,
          batchSize: 10
        })
      ]);

      expect(
        outcomes.reduce(
          (total, outcome) => total + outcome.reservationsExpired,
          0
        )
      ).toBe(2);
      expect(await harness.reservations(fixture)).toEqual([
        expect.objectContaining({ status: "expired" }),
        expect.objectContaining({ status: "expired" })
      ]);
      expect(
        (await harness.reservationEntries(fixture)).filter(
          (entry) => entry.operation === "expire"
        )
      ).toHaveLength(2);
      await Promise.all(
        fixture.skuIds.map(async (skuId) => {
          expect(await harness.availableQuantity(fixture, skuId)).toBe(1);
        })
      );

      await expect(
        expireDueInventoryReservationOrders({
          payload: harness.payload,
          batchSize: 10
        })
      ).resolves.toEqual({
        ordersExamined: 0,
        ordersExpired: 0,
        ordersFailed: 0,
        reservationsExpired: 0
      });
    });

    it("spends the batch bound on distinct orders instead of sibling reservation rows", async () => {
      const fixture = await harness.createFixture({
        orderCount: 2,
        skuCount: 3
      });
      await Promise.all(
        fixture.skuIds.map((skuId) =>
          harness.seedInventory(fixture, { skuId, quantity: 2 })
        )
      );
      const effectiveAt = at(-20);
      const expiresAt = at(-5);
      await Promise.all(
        fixture.orderIds.map((orderId, orderIndex) =>
          harness.inTransaction(fixture, (req) =>
            reserveOrderInventoryInTransaction({
              payload: harness.payload,
              req,
              policy: policy(fixture),
              requests: fixture.skuIds.map((skuId, skuIndex) => ({
                idempotencyKey: `distinct-order-${orderIndex}-${skuIndex}-${fixture.suffix}`,
                operation: "reserve" as const,
                orderId,
                skuId,
                locationId: fixture.locationId,
                quantity: 1,
                effectiveAt,
                expiresAt
              }))
            })
          )
        )
      );

      await expect(
        expireDueInventoryReservationOrders({
          payload: harness.payload,
          batchSize: 2
        })
      ).resolves.toEqual({
        ordersExamined: 2,
        ordersExpired: 2,
        ordersFailed: 0,
        reservationsExpired: 6
      });
    });

    it("skips an order with a future sibling so a fully due order can use the batch slot", async () => {
      const fixture = await harness.createFixture({
        orderCount: 2,
        skuCount: 2
      });
      await Promise.all(
        fixture.skuIds.map((skuId) =>
          harness.seedInventory(fixture, { skuId, quantity: 2 })
        )
      );
      const [blockedOrderId, dueOrderId] = fixture.orderIds;
      const [firstSkuId, secondSkuId] = fixture.skuIds;
      if (!blockedOrderId || !dueOrderId || !firstSkuId || !secondSkuId) {
        throw new Error("reservation-expiry-fixture-incomplete");
      }

      await harness.inTransaction(fixture, (req) =>
        reserveOrderInventoryInTransaction({
          payload: harness.payload,
          req,
          policy: policy(fixture),
          requests: [
            {
              idempotencyKey: `blocked-due-${fixture.suffix}`,
              operation: "reserve" as const,
              orderId: blockedOrderId,
              skuId: firstSkuId,
              locationId: fixture.locationId,
              quantity: 1,
              effectiveAt: at(-20),
              expiresAt: at(-5)
            },
            {
              idempotencyKey: `blocked-future-${fixture.suffix}`,
              operation: "reserve" as const,
              orderId: blockedOrderId,
              skuId: secondSkuId,
              locationId: fixture.locationId,
              quantity: 1,
              effectiveAt: at(-5),
              expiresAt: at(10)
            }
          ]
        })
      );
      await harness.inTransaction(fixture, (req) =>
        reserveOrderInventoryInTransaction({
          payload: harness.payload,
          req,
          policy: policy(fixture),
          requests: [
            {
              idempotencyKey: `fully-due-${fixture.suffix}`,
              operation: "reserve" as const,
              orderId: dueOrderId,
              skuId: firstSkuId,
              locationId: fixture.locationId,
              quantity: 1,
              effectiveAt: at(-20),
              expiresAt: at(-5)
            }
          ]
        })
      );

      await expect(
        expireDueInventoryReservationOrders({
          payload: harness.payload,
          batchSize: 1
        })
      ).resolves.toEqual({
        ordersExamined: 1,
        ordersExpired: 1,
        ordersFailed: 0,
        reservationsExpired: 1
      });

      expect(
        (await harness.reservations(fixture)).filter(
          (reservation) => reservation.order_id === blockedOrderId
        )
      ).toEqual([
        expect.objectContaining({ status: "active" }),
        expect.objectContaining({ status: "active" })
      ]);
      expect(
        (await harness.reservations(fixture)).filter(
          (reservation) => reservation.order_id === dueOrderId
        )
      ).toEqual([expect.objectContaining({ status: "expired" })]);
    });
  }
);
