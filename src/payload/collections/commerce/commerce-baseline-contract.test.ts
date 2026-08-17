import { describe, expect, it } from "vitest";

import { CommerceOrders } from "./Orders";
import { CommerceProducts } from "./Products";

function fieldNames(fields: readonly unknown[]): string[] {
  return fields.flatMap((field) => {
    if (!field || typeof field !== "object" || !("name" in field)) return [];
    return typeof field.name === "string" ? [field.name] : [];
  });
}

describe("minimal commerce collection baseline", () => {
  it("registers only the new commerce collection names", () => {
    expect([CommerceProducts.slug, CommerceOrders.slug]).toEqual([
      "commerce-products",
      "commerce-orders"
    ]);
  });

  it("keeps product commerce facts and retained presentation fields", () => {
    expect(fieldNames(CommerceProducts.fields)).toEqual([
      "name",
      "slug",
      "active",
      "unit_amount",
      "currency",
      "max_quantity",
      "summary",
      "description",
      "details",
      "care",
      "shipping_returns",
      "hero_media",
      "gallery",
      "sort"
    ]);
  });

  it("keeps one order aggregate with payment and status tracking", () => {
    expect(fieldNames(CommerceOrders.fields)).toEqual([
      "ref",
      "user",
      "product",
      "product_name_snapshot",
      "product_slug_snapshot",
      "quantity",
      "unit_amount_snapshot",
      "total_amount",
      "currency",
      "payment_method",
      "payment_status",
      "status",
      "contact",
      "shipping",
      "idempotency_key",
      "request_hash",
      "provider_payment_id",
      "provider_transaction_id",
      "bank_transfer_reference",
      "tracking_number",
      "paid_at",
      "shipped_at",
      "completed_at"
    ]);
  });

  it("contains no legacy commerce concepts", () => {
    const fields = [
      ...fieldNames(CommerceProducts.fields),
      ...fieldNames(CommerceOrders.fields)
    ];

    expect(fields).not.toEqual(
      expect.arrayContaining([
        "sku",
        "variants",
        "campaign",
        "order_mode",
        "quote",
        "reservation",
        "inventory",
        "events"
      ])
    );
  });

  it("denies generic order creation and deletion", () => {
    const req = { user: { id: "user-1", role: "admin" } };

    expect(CommerceOrders.access?.create?.({ req } as never)).toBe(false);
    expect(CommerceOrders.access?.delete?.({ req } as never)).toBe(false);
  });

  it("scopes customer order reads to ownership", () => {
    expect(
      CommerceOrders.access?.read?.({
        req: { user: { id: "user-1", role: "user" } }
      } as never)
    ).toEqual({ user: { equals: "user-1" } });
    expect(
      CommerceOrders.access?.read?.({
        req: { user: { id: "admin-1", role: "admin" } }
      } as never)
    ).toBe(true);
    expect(
      CommerceOrders.access?.read?.({ req: { user: null } } as never)
    ).toBe(false);
  });

  it("exposes active products publicly and all products to admins", () => {
    expect(
      CommerceProducts.access?.read?.({ req: { user: null } } as never)
    ).toEqual({ active: { equals: true } });
    expect(
      CommerceProducts.access?.read?.({
        req: { user: { id: "admin-1", role: "admin" } }
      } as never)
    ).toBe(true);
  });
});
