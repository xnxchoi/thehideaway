import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { sql, type MigrateUpArgs } from "@payloadcms/db-postgres";
import { createLocalReq, type Migration } from "payload";
import {
  up,
  down
} from "../../../lib/migrations-baseline/20260916_074244_address_countries";
import {
  createCheckoutFixture,
  type CheckoutFixture
} from "./checkout-postgres.fixtures";

const databaseURI = process.env.ECOMMERCE_TEST_DATABASE_URI;

describe
  .skipIf(!databaseURI)
  .sequential("native account address countries", () => {
    let fixture: CheckoutFixture;

    beforeAll(async () => {
      fixture = await createCheckoutFixture(databaseURI!);
    }, 120_000);
    afterAll(async () => {
      await fixture?.close();
    }, 30_000);

    const address = (country: string) => ({
      firstName: "Fixture",
      lastName: "Buyer",
      addressLine1: "123 Test Street",
      city: "Seoul",
      postalCode: "04524",
      country
    });

    it("persists KR through native create, read and update endpoints", async () => {
      const owner = await fixture.user();
      const created = await fixture.request("/api/addresses", address("KR"), {
        userID: owner.id
      });
      expect(created.status, JSON.stringify(created.body)).toBe(201);
      expect(created.body.doc).toMatchObject({ country: "KR" });
      const route = `/api/addresses/${created.body.doc.id}?depth=0`;
      const read = await fixture.request(
        route,
        {},
        { method: "GET", userID: owner.id }
      );
      expect(read.status).toBe(200);
      expect(read.body).toMatchObject({ country: "KR", customer: owner.id });
      const updated = await fixture.request(
        route,
        { city: "Busan" },
        {
          method: "PATCH",
          userID: owner.id
        }
      );
      expect(updated.status).toBe(200);
      expect(updated.body.doc).toMatchObject({ country: "KR", city: "Busan" });
    });

    it("preserves existing billing countries and rejects unsupported codes", async () => {
      const owner = await fixture.user();
      expect(
        (
          await fixture.request("/api/addresses", address("US"), {
            userID: owner.id
          })
        ).status
      ).toBe(201);
      expect(
        (
          await fixture.request("/api/addresses", address("ZZ"), {
            userID: owner.id
          })
        ).status
      ).toBe(400);
    });

    it("keeps address creation and KR address reads scoped to the account", async () => {
      expect(
        (await fixture.request("/api/addresses", address("KR"))).status
      ).toBe(403);
      const owner = await fixture.user();
      const other = await fixture.user();
      const created = await fixture.request("/api/addresses", address("KR"), {
        userID: owner.id
      });
      expect(created.status).toBe(201);
      const route = `/api/addresses/${created.body.doc.id}`;
      const denied = await fixture.request(
        route,
        {},
        { method: "GET", userID: other.id }
      );
      expect(denied.status).toBe(404);
      expect(denied.body).not.toHaveProperty("addressLine1");
      expect(
        (
          await fixture.request(
            route,
            { city: "Changed" },
            { method: "PATCH", userID: other.id }
          )
        ).status
      ).toBe(403);
    });

    it("replays the native migration and refuses rollback without removing KR addresses", async () => {
      const owner = await fixture.user();
      const created = await fixture.request("/api/addresses", address("KR"), {
        userID: owner.id
      });
      expect(created.status).toBe(201);
      // Payload's adapter-neutral Migration erases arguments to unknown;
      // this fixture installs postgresAdapter, whose contract is MigrateUpArgs.
      const migration: Migration = {
        name: "address_country_replay",
        up: (args) => up(args as MigrateUpArgs),
        down: (args) => down(args as MigrateUpArgs)
      };
      await fixture.payload.db.migrate({ migrations: [migration] });
      await fixture.payload.db.migrate({ migrations: [migration] });
      const args: MigrateUpArgs = {
        db: fixture.payload.db.drizzle,
        payload: fixture.payload,
        req: await createLocalReq({}, fixture.payload)
      };
      await expect(down(args)).rejects.toMatchObject({
        cause: {
          message: "Cannot remove KR country support while KR addresses exist"
        }
      });
      const preserved = await fixture.request(
        `/api/addresses/${created.body.doc.id}`,
        {},
        { method: "GET", userID: owner.id }
      );
      expect(preserved.body.country).toBe("KR");
    });

    it("safely repeats down and up without KR data, restoring the fixture transaction", async () => {
      const rollback = new Error("rollback-country-migration-test");
      await expect(
        fixture.payload.db.drizzle.transaction(async (db) => {
          // Only in the disposable fixture and rolled back unconditionally. This
          // exercises an empty-KR rollback even when earlier test cases wrote KR.
          await db.execute(
            sql`UPDATE "addresses" SET "country" = 'US' WHERE "country"::text = 'KR'`
          );
          const args: MigrateUpArgs = {
            db,
            payload: fixture.payload,
            req: await createLocalReq({}, fixture.payload)
          };
          await down(args);
          await down(args);
          const before = await db.execute(
            sql`SELECT enumlabel FROM pg_enum WHERE enumtypid = 'public.enum_addresses_country'::regtype`
          );
          expect(before.rows.map((row) => row.enumlabel)).not.toContain("KR");
          expect(before.rows.map((row) => row.enumlabel)).toContain("US");
          await up(args);
          await up(args);
          const after = await db.execute(
            sql`SELECT enumlabel FROM pg_enum WHERE enumtypid = 'public.enum_addresses_country'::regtype`
          );
          expect(
            after.rows.filter((row) => row.enumlabel === "KR")
          ).toHaveLength(1);
          throw rollback;
        })
      ).rejects.toBe(rollback);
    });
  });
