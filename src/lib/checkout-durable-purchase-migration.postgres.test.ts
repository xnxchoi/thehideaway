import { execFileSync } from "node:child_process";
import { randomUUID } from "node:crypto";
import { PgDialect } from "drizzle-orm/pg-core";
import type { SQL } from "drizzle-orm";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { migrations } from "./migrations-baseline";
import {
  down,
  up
} from "./migrations-baseline/20260914_012723_checkout_durable_purchase";

const container = process.env.BASELINE_MIGRATION_TEST_CONTAINER;
const database = `checkout_migration_test_${randomUUID().replaceAll("-", "")}`;
const dialect = new PgDialect();

function query(statement: string, target = database): string {
  if (container !== "hideaway-readiness-pg")
    throw new Error("isolated-checkout-test-container-required");
  return execFileSync(
    "docker",
    [
      "exec",
      "-i",
      container,
      "psql",
      "-X",
      "-qAt",
      "-v",
      "ON_ERROR_STOP=1",
      "-U",
      "readiness",
      "-d",
      target
    ],
    {
      input: statement,
      encoding: "utf8",
      stdio: ["pipe", "pipe", "pipe"],
      maxBuffer: 20 * 1024 * 1024
    }
  ).trim();
}

const args = {
  db: {
    execute: async (statement: SQL) => {
      const generated = dialect.sqlToQuery(statement);
      if (generated.params.length)
        throw new Error("unexpected-migration-bindings");
      return query(`BEGIN; ${generated.sql} COMMIT;`);
    }
  }
};

describe
  .skipIf(!container)
  .sequential("checkout migration on real PostgreSQL", () => {
    beforeAll(async () => {
      query(`CREATE DATABASE "${database}"`, "postgres");
      // Run the real registered baseline from empty storage, in migration order.
      for (const migration of migrations) {
        if (migration.name === "20260914_012723_checkout_durable_purchase")
          break;
        await migration.up(args as never);
      }
    }, 60_000);
    afterAll(() => {
      query(`DROP DATABASE IF EXISTS "${database}"`, "postgres");
    });

    it("applies after an empty bootstrap and directly replays without losing rows", async () => {
      await up(args as never);
      query(
        `INSERT INTO orders (order_ref, status, checkout_snapshot) VALUES ('checkout-migration-proof', 'pending', '{"amount":7000}'::jsonb);`
      );
      await up(args as never);
      await up(args as never);
      expect(
        query(
          "SELECT status || ':' || (checkout_snapshot->>'amount') FROM orders WHERE order_ref = 'checkout-migration-proof'"
        )
      ).toBe("pending:7000");
      expect(
        query(
          "SELECT count(*) FROM pg_indexes WHERE indexname IN ('orders_checkout_cart_idx', 'transactions_checkout_attempt_key_idx', 'commerce_provider_events_dedupe_key_idx')"
        )
      ).toBe("3");
    });

    it("rolls back twice safely then reapplies twice while retaining pending status", async () => {
      await down(args as never);
      await down(args as never);
      expect(
        query(
          "SELECT status FROM orders WHERE order_ref = 'checkout-migration-proof'"
        )
      ).toBe("pending");
      await up(args as never);
      await up(args as never);
      expect(
        query("SELECT to_regclass('public.commerce_provider_events')")
      ).toBe("commerce_provider_events");
    });
  });
