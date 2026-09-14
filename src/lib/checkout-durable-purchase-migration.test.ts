import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const migration = readFileSync(
  new URL(
    "./migrations-baseline/20260914_012723_checkout_durable_purchase.ts",
    import.meta.url
  ),
  "utf8"
);
describe("checkout durable purchase migration safeguards", () => {
  it("guards creation and retains the additive status enum on rollback", () => {
    expect(migration).toContain(
      'CREATE TABLE IF NOT EXISTS "commerce_provider_events"'
    );
    expect(migration).toContain("ADD VALUE IF NOT EXISTS 'pending'");
    expect(migration).not.toMatch(/CREATE (?:UNIQUE )?INDEX "/);
    expect(migration).not.toMatch(/ADD COLUMN "/);
    expect(migration).not.toMatch(/DROP (?:TABLE|INDEX|TYPE) "/);
    expect(migration).not.toContain('DROP TYPE "public"."enum_orders_status"');
    expect(migration).toContain("pg_constraint");
    expect(migration).not.toMatch(/DO \$\s|END \$;/);
  });
  it("contains only this checkout delta and no retired payment relationships", () => {
    expect(migration).not.toMatch(
      /"teams"|"team_members"|"_pages_v"|product_payments|product_orders|product_variants/
    );
    expect(migration).toContain(
      'CREATE UNIQUE INDEX IF NOT EXISTS "orders_checkout_cart_idx"'
    );
    expect(migration).toContain(
      'CREATE UNIQUE INDEX IF NOT EXISTS "transactions_checkout_attempt_key_idx"'
    );
  });
});
