import type { Payload } from "payload";
import { describe, expect, it, vi } from "vitest";

import { applySkuBackfill, buildSkuBackfillPlan } from "./sku-backfill";

type StoredSku = Record<string, unknown> & { legacy_key: string };

function makePayload(initialDocs: StoredSku[] = []) {
  let docs = initialDocs.map((doc) => ({ ...doc }));
  const payload = {
    find: vi.fn(async ({ where }) => {
      const legacyKey = where?.legacy_key?.equals;
      return {
        docs: docs.filter((doc) => doc.legacy_key === legacyKey)
      };
    }),
    create: vi.fn(async ({ data }) => {
      const created = { id: `sku-${docs.length + 1}`, ...data } as StoredSku;
      docs = [...docs, created];
      return created;
    })
  } as unknown as Payload & {
    find: ReturnType<typeof vi.fn>;
    create: ReturnType<typeof vi.fn>;
  };

  return payload;
}

const products = [
  {
    id: "product-1",
    variants: [
      {
        id: "legacy-small",
        sku: "UNVERIFIED-SKU",
        label: "Unverified label",
        amount: 999,
        inventory: 8,
        weight_grams: 100
      }
    ]
  }
];

const reviewed = [
  {
    productId: "product-1",
    legacyVariantRef: "legacy-small",
    sku: "lis-confirmed-1",
    options: [
      { key: "finish", value: "Matte" },
      { key: "size", value: "50 ml" }
    ]
  }
];

describe("buildSkuBackfillPlan", () => {
  it("does not convert unreviewed legacy JSON into SKU records", () => {
    expect(buildSkuBackfillPlan(products, [])).toEqual([]);
  });

  it("copies only explicit reviewed facts and leaves unknown values null", () => {
    expect(
      buildSkuBackfillPlan(products, [
        {
          productId: "product-1",
          legacyVariantRef: "legacy-small",
          sku: "lis-confirmed-1",
          options: [{ key: "size", value: "50 ml" }]
        }
      ])
    ).toEqual([
      {
        product: "product-1",
        active: false,
        sku: "LIS-CONFIRMED-1",
        label: null,
        options: [{ key: "size", value: "50 ml" }],
        option_key: 'product-1:[["size","50 ml"]]',
        legacy_variant_ref: "legacy-small",
        legacy_key: "product-1:legacy-small",
        price_override_amount: null,
        barcode: null,
        weight_grams: null,
        length_mm: null,
        width_mm: null,
        height_mm: null,
        tax_category: null,
        inventory: null,
        stock_state: null
      }
    ]);
  });

  it("rejects duplicate reviewed SKU identities", () => {
    expect(() =>
      buildSkuBackfillPlan(products, [
        {
          productId: "product-1",
          legacyVariantRef: "legacy-small",
          sku: "LIS-1"
        },
        {
          productId: "product-1",
          legacyVariantRef: "legacy-small",
          sku: "lis-1"
        }
      ])
    ).toThrow("duplicate-reviewed-sku");
  });

  it("rejects duplicate canonical option identities before writing", () => {
    const productsWithTwoVariants = [
      {
        ...products[0],
        variants: [
          ...(products[0]?.variants ?? []),
          { id: "legacy-large" }
        ]
      }
    ];

    expect(() =>
      buildSkuBackfillPlan(productsWithTwoVariants, [
        {
          productId: "product-1",
          legacyVariantRef: "legacy-small",
          sku: "LIS-1",
          options: [{ key: "size", value: "50 ml" }]
        },
        {
          productId: "product-1",
          legacyVariantRef: "legacy-large",
          sku: "LIS-2",
          options: [{ key: "size", value: "50 ml" }]
        }
      ])
    ).toThrow("duplicate-reviewed-sku");
  });
});

describe("applySkuBackfill", () => {
  it("creates reviewed facts once and treats a matching sequential replay as existing", async () => {
    const payload = makePayload();

    await expect(
      applySkuBackfill({ payload, products, reviewed })
    ).resolves.toEqual({ created: 1, existing: 0 });
    await expect(
      applySkuBackfill({ payload, products, reviewed })
    ).resolves.toEqual({ created: 0, existing: 1 });

    expect(payload.create).toHaveBeenCalledTimes(1);
    expect(payload.create).toHaveBeenCalledWith(
      expect.objectContaining({
        collection: "product-variants",
        overrideAccess: true,
        data: expect.objectContaining({
          price_override_amount: null,
          barcode: null,
          weight_grams: null,
          length_mm: null,
          width_mm: null,
          height_mm: null,
          tax_category: null,
          inventory: null,
          stock_state: null
        })
      })
    );
  });

  it("accepts equivalent normalized SKU, relationship, and canonical options", async () => {
    const [row] = buildSkuBackfillPlan(products, reviewed);
    const payload = makePayload([
      {
        ...row,
        product: { id: "product-1" },
        sku: " lis-confirmed-1 ",
        options: [
          { key: "size", value: "50 ml" },
          { key: "finish", value: "Matte" }
        ]
      }
    ]);

    await expect(
      applySkuBackfill({ payload, products, reviewed })
    ).resolves.toEqual({ created: 0, existing: 1 });
    expect(payload.create).not.toHaveBeenCalled();
  });

  it("treats the unique-conflict loser of a concurrent matching replay as existing", async () => {
    let stored: StoredSku | undefined;
    let createAttempts = 0;
    let releaseCreates: (() => void) | undefined;
    const bothCreatesStarted = new Promise<void>((resolve) => {
      releaseCreates = resolve;
    });
    const payload = {
      find: vi.fn(async () => ({ docs: stored ? [stored] : [] })),
      create: vi.fn(async ({ data }) => {
        createAttempts += 1;
        if (createAttempts === 2) releaseCreates?.();
        await bothCreatesStarted;
        if (!stored) {
          stored = { id: "sku-1", ...data } as StoredSku;
          return stored;
        }
        throw new Error("duplicate-legacy-key");
      })
    } as unknown as Payload;

    const results = await Promise.all([
      applySkuBackfill({ payload, products, reviewed }),
      applySkuBackfill({ payload, products, reviewed })
    ]);

    expect(results).toEqual(
      expect.arrayContaining([
        { created: 1, existing: 0 },
        { created: 0, existing: 1 }
      ])
    );
  });

  it.each([
    ["product", { product: "product-2" }],
    ["active state", { active: true }],
    ["SKU", { sku: "LIS-DIFFERENT" }],
    ["label", { label: "Different label" }],
    ["options", { options: [{ key: "size", value: "100 ml" }] }],
    ["option key", { option_key: 'product-1:[["size","100 ml"]]' }],
    ["legacy reference", { legacy_variant_ref: "legacy-other" }],
    ["price", { price_override_amount: 1 }],
    ["barcode", { barcode: "BARCODE" }],
    ["weight", { weight_grams: 1 }],
    ["length", { length_mm: 1 }],
    ["width", { width_mm: 1 }],
    ["height", { height_mm: 1 }],
    ["tax category", { tax_category: "standard" }],
    ["inventory", { inventory: 1 }],
    ["stock state", { stock_state: "in_stock" }]
  ])("rejects a conflicting replay for %s", async (_field, override) => {
    const [row] = buildSkuBackfillPlan(products, reviewed);
    const payload = makePayload([{ ...row, ...override }]);

    await expect(
      applySkuBackfill({ payload, products, reviewed })
    ).rejects.toThrow("sku-backfill-conflict");
    expect(payload.create).not.toHaveBeenCalled();
  });

  it("rejects a replay whose returned legacy key does not match", async () => {
    const [row] = buildSkuBackfillPlan(products, reviewed);
    const payload = {
      find: vi.fn(async () => ({
        docs: [{ ...row, legacy_key: "product-1:legacy-other" }]
      })),
      create: vi.fn()
    } as unknown as Payload;

    await expect(
      applySkuBackfill({ payload, products, reviewed })
    ).rejects.toThrow("sku-backfill-conflict");
  });
});
