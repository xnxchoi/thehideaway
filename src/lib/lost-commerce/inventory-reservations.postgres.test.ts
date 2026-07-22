import { afterEach, beforeAll, describe, expect, it } from "vitest";

import {
  expireInventoryReservationInTransaction,
  releaseOrderInventoryInTransaction,
  reserveOrderInventoryInTransaction
} from "./inventory-reservations";
import { getStorefrontInventoryAvailability } from "./storefront-inventory-availability";
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

const reserveRequest = (input: {
  fixture: ReservationFixture;
  idempotencyKey: string;
  orderId: string;
  skuId?: string;
  expiresAt?: string;
}) => ({
  idempotencyKey: input.idempotencyKey,
  operation: "reserve" as const,
  orderId: input.orderId,
  skuId: input.skuId ?? input.fixture.skuIds[0],
  locationId: input.fixture.locationId,
  quantity: 1,
  expiresAt: input.expiresAt ?? at(15),
  effectiveAt: at(0)
});

function resultKinds(value: unknown): string[] {
  if (!value || typeof value !== "object") return [];
  if ("kind" in value && typeof value.kind === "string") {
    return [value.kind];
  }
  if ("results" in value && Array.isArray(value.results)) {
    return value.results.flatMap(resultKinds);
  }
  return [];
}

describeWithPostgres.sequential(
  "inventory reservations with PostgreSQL",
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

    it("lets only one buyer reserve the last available unit", async () => {
      const fixture = await harness.createFixture({ orderCount: 2 });
      await harness.seedInventory(fixture, { quantity: 1 });
      const attempts = fixture.orderIds.map((orderId, index) =>
        harness.inTransaction(fixture, (req) =>
          reserveOrderInventoryInTransaction({
            payload: harness.payload,
            req,
            requests: [
              reserveRequest({
                fixture,
                idempotencyKey: `reservation-last-unit-${index}-${fixture.suffix}`,
                orderId
              })
            ],
            policy: policy(fixture)
          })
        )
      );

      const outcomes = await Promise.allSettled(attempts);
      expect(
        outcomes.filter((entry) => entry.status === "fulfilled")
      ).toHaveLength(1);
      expect(
        outcomes.filter((entry) => entry.status === "rejected")
      ).toHaveLength(1);
      expect(await harness.reservations(fixture)).toEqual([
        expect.objectContaining({ quantity: 1, status: "active" })
      ]);
      expect(await harness.reservationEntries(fixture)).toEqual([
        expect.objectContaining({ operation: "reserve", quantity: 1 })
      ]);
      expect(await harness.availableQuantity(fixture)).toBe(1);
    });

    it("excludes every non-available disposition from reservable stock", async () => {
      const fixture = await harness.createFixture();
      for (const disposition of [
        "quarantine",
        "damaged",
        "inspection_pending",
        "returned_pending_release",
        "discarded"
      ] as const) {
        await harness.seedInventory(fixture, { disposition, quantity: 10 });
      }
      const request = reserveRequest({
        fixture,
        idempotencyKey: `reservation-dispositions-${fixture.suffix}`,
        orderId: fixture.orderIds[0]
      });

      await expect(
        harness.inTransaction(fixture, (req) =>
          reserveOrderInventoryInTransaction({
            payload: harness.payload,
            req,
            requests: [request],
            policy: policy(fixture)
          })
        )
      ).rejects.toThrow("insufficient-available-to-promise");
      expect(await harness.reservations(fixture)).toEqual([]);
      expect(await harness.reservationEntries(fixture)).toEqual([]);
    });

    it("rolls back every line when one SKU in a reservation batch is unavailable", async () => {
      const fixture = await harness.createFixture({ skuCount: 2 });
      await harness.seedInventory(fixture, {
        skuId: fixture.skuIds[0],
        quantity: 1
      });
      const orderId = fixture.orderIds[0];

      await expect(
        harness.inTransaction(fixture, (req) =>
          reserveOrderInventoryInTransaction({
            payload: harness.payload,
            req,
            requests: fixture.skuIds.map((skuId, index) =>
              reserveRequest({
                fixture,
                idempotencyKey: `reservation-batch-${index}-${fixture.suffix}`,
                orderId,
                skuId
              })
            ),
            policy: policy(fixture)
          })
        )
      ).rejects.toThrow("insufficient-available-to-promise");

      expect(await harness.reservations(fixture)).toEqual([]);
      expect(await harness.reservationEntries(fixture)).toEqual([]);
      expect(await harness.availableQuantity(fixture, fixture.skuIds[0])).toBe(
        1
      );
    });

    it("holds explicit safety stock outside available-to-promise", async () => {
      const fixture = await harness.createFixture();
      await harness.seedInventory(fixture, { quantity: 2 });
      const request = reserveRequest({
        fixture,
        idempotencyKey: `reservation-safety-${fixture.suffix}`,
        orderId: fixture.orderIds[0]
      });

      await expect(
        harness.inTransaction(fixture, (req) =>
          reserveOrderInventoryInTransaction({
            payload: harness.payload,
            req,
            requests: [{ ...request, quantity: 2 }],
            policy: { ...policy(fixture), safetyStock: 1 }
          })
        )
      ).rejects.toThrow("insufficient-available-to-promise");
      await expect(
        harness.inTransaction(fixture, (req) =>
          reserveOrderInventoryInTransaction({
            payload: harness.payload,
            req,
            requests: [request],
            policy: { ...policy(fixture), safetyStock: 1 }
          })
        )
      ).resolves.toMatchObject({ results: [{ kind: "created" }] });
    });

    it("replays an identical reserve and rejects altered reuse of its key", async () => {
      const fixture = await harness.createFixture();
      await harness.seedInventory(fixture, { quantity: 2 });
      const request = reserveRequest({
        fixture,
        idempotencyKey: `reservation-replay-${fixture.suffix}`,
        orderId: fixture.orderIds[0]
      });
      const run = (candidate: typeof request) =>
        harness.inTransaction(fixture, (req) =>
          reserveOrderInventoryInTransaction({
            payload: harness.payload,
            req,
            requests: [candidate],
            policy: policy(fixture)
          })
        );

      const repeated = await Promise.all([run(request), run(request)]);
      expect(repeated.flatMap(resultKinds).sort()).toEqual([
        "created",
        "replay"
      ]);
      await expect(run({ ...request, expiresAt: at(30) })).rejects.toThrow(
        "inventory-reservation-idempotency-conflict"
      );
      expect(await harness.reservations(fixture)).toHaveLength(1);
      expect(await harness.reservationEntries(fixture)).toHaveLength(1);
    });

    it("allows only one terminal winner when release races expiry", async () => {
      const fixture = await harness.createFixture();
      await harness.seedInventory(fixture, { quantity: 1 });
      const orderId = fixture.orderIds[0];
      await harness.inTransaction(fixture, (req) =>
        reserveOrderInventoryInTransaction({
          payload: harness.payload,
          req,
          requests: [
            reserveRequest({
              fixture,
              idempotencyKey: `reservation-terminal-seed-${fixture.suffix}`,
              orderId,
              expiresAt: at(1)
            })
          ],
          policy: policy(fixture)
        })
      );
      const reservation = (await harness.reservations(fixture))[0];
      if (!reservation) throw new Error("reservation-test-seed-missing");
      const terminalBase = {
        orderId,
        reservationId: reservation.id,
        skuId: fixture.skuIds[0],
        locationId: fixture.locationId,
        quantity: 1,
        effectiveAt: at(2)
      };

      const outcomes = await Promise.allSettled([
        harness.inTransaction(fixture, (req) =>
          releaseOrderInventoryInTransaction({
            payload: harness.payload,
            req,
            request: {
              ...terminalBase,
              idempotencyKey: `reservation-release-${fixture.suffix}`,
              operation: "release" as const
            }
          })
        ),
        harness.inTransaction(fixture, (req) =>
          expireInventoryReservationInTransaction({
            payload: harness.payload,
            req,
            request: {
              ...terminalBase,
              idempotencyKey: `reservation-expire-${fixture.suffix}`,
              operation: "expire" as const
            }
          })
        )
      ]);

      expect(
        outcomes.filter((entry) => entry.status === "fulfilled")
      ).toHaveLength(1);
      expect(
        outcomes.filter((entry) => entry.status === "rejected")
      ).toHaveLength(1);
      const stored = (await harness.reservations(fixture))[0];
      expect(["released", "expired"]).toContain(stored?.status);
      const entries = await harness.reservationEntries(fixture);
      expect(
        entries.filter((entry) => entry.operation !== "reserve")
      ).toHaveLength(1);
      expect(await harness.availableQuantity(fixture)).toBe(1);
    });

    it("computes storefront ATP from physical and active reservation projections", async () => {
      const fixture = await harness.createFixture();
      const skuId = fixture.skuIds[0];
      const orderId = fixture.orderIds[0];
      if (!skuId || !orderId)
        throw new Error("reservation-test-fixture-incomplete");
      await harness.seedInventory(fixture, { quantity: 5 });
      await harness.inTransaction(fixture, (req) =>
        reserveOrderInventoryInTransaction({
          payload: harness.payload,
          req,
          policy: policy(fixture),
          requests: [
            {
              idempotencyKey: `storefront-atp-${fixture.suffix}`,
              operation: "reserve" as const,
              orderId,
              skuId,
              locationId: fixture.locationId,
              quantity: 2,
              effectiveAt: at(0),
              expiresAt: at(15)
            }
          ]
        })
      );

      const keys = [
        "LOST_INVENTORY_RESERVATIONS_LIVE",
        "LOST_INVENTORY_RESERVATION_TTL_MINUTES",
        "LOST_INVENTORY_RESERVATION_LOCATION_CODE",
        "LOST_INVENTORY_SAFETY_STOCK",
        "LOST_INVENTORY_RESERVATION_CONSUME_POINT",
        "LOST_INVENTORY_EXPIRY_BOUNDARY",
        "LOST_INVENTORY_PAYMENT_TIME_SOURCE",
        "LOST_INVENTORY_LATE_PAYMENT_POLICY",
        "LOST_INVENTORY_BACKORDER_MODE"
      ] as const;
      const original = Object.fromEntries(
        keys.map((key) => [key, process.env[key]])
      );
      Object.assign(process.env, {
        LOST_INVENTORY_RESERVATIONS_LIVE: "true",
        LOST_INVENTORY_RESERVATION_TTL_MINUTES: "15",
        LOST_INVENTORY_RESERVATION_LOCATION_CODE: fixture.locationCode,
        LOST_INVENTORY_SAFETY_STOCK: "1",
        LOST_INVENTORY_RESERVATION_CONSUME_POINT: "payment_confirmed",
        LOST_INVENTORY_EXPIRY_BOUNDARY: "at_or_after",
        LOST_INVENTORY_PAYMENT_TIME_SOURCE: "provider_paid_at",
        LOST_INVENTORY_LATE_PAYMENT_POLICY: "manual_review",
        LOST_INVENTORY_BACKORDER_MODE: "disabled"
      });
      try {
        const availability = await getStorefrontInventoryAvailability({
          payload: harness.payload,
          paymentProvider: "portone",
          skuIds: [skuId]
        });
        expect([...availability]).toEqual([[skuId, 2]]);
      } finally {
        for (const key of keys) {
          const value = original[key];
          if (value === undefined) delete process.env[key];
          else process.env[key] = value;
        }
      }
    });
  }
);
