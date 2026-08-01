import { describe, expect, it } from "vitest";
import { resolveLostCheckout } from "./cart";

function payloadWith(docs: Record<string, any>) {
  return {
    async findByID({
      collection,
      id,
      disableErrors
    }: {
      collection: string;
      id: string;
      disableErrors?: boolean;
    }) {
      const doc = docs[id];
      if (!doc) {
        if (disableErrors) return null;
        throw new Error("not-found");
      }
      return collection === "products"
        ? { storefront: "lostinseoul", ...doc }
        : doc;
    },
  } as any;
}

function activeSku(overrides: Record<string, unknown> = {}) {
  return {
    id: "sku_1",
    product: "product_1",
    active: true,
    sku: "LIS-SKU-1",
    options: [],
    ...overrides
  };
}

describe("resolveLostCheckout", () => {
  it("normalizes a missing product to product-unavailable", async () => {
    await expect(
      resolveLostCheckout({
        payload: payloadWith({}),
        user: { role: "user" },
        lines: [
          {
            productId: "missing-product",
            skuId: "missing-sku",
            mode: "standard_purchase",
            quantity: 1
          }
        ]
      })
    ).rejects.toThrow("product-unavailable");
  });

  it("requires every checkout line to identify a stable SKU", async () => {
    await expect(
      resolveLostCheckout({
        payload: payloadWith({
          product_1: {
            id: "product_1",
            active: true,
            name: "Jacket",
            slug: "jacket",
            currency: "KRW",
            unit_amount: 120000,
            min_order_quantity: 1,
            max_order_quantity: 2,
            standard_enabled: true
          }
        }),
        user: { role: "user" },
        lines: [
          {
            productId: "product_1",
            mode: "standard_purchase",
            quantity: 1
          } as never
        ]
      })
    ).rejects.toThrow("sku-required");
  });

  it("rejects a stale SKU id", async () => {
    await expect(
      resolveLostCheckout({
        payload: payloadWith({
          product_1: {
            id: "product_1",
            active: true,
            name: "Jacket",
            slug: "jacket",
            currency: "KRW",
            unit_amount: 120000,
            min_order_quantity: 1,
            max_order_quantity: 2,
            standard_enabled: true
          }
        }),
        user: { role: "user" },
        lines: [
          {
            productId: "product_1",
            skuId: "missing_sku",
            mode: "standard_purchase",
            quantity: 1
          }
        ]
      })
    ).rejects.toThrow("sku-not-found");
  });

  it("propagates a direct SKU lookup infrastructure error unchanged", async () => {
    const infrastructureError = new Error("database connection lost");
    const payload = payloadWith({
      product_1: {
        id: "product_1",
        active: true,
        name: "Jacket",
        slug: "jacket",
        currency: "KRW",
        unit_amount: 120000,
        min_order_quantity: 1,
        max_order_quantity: 2,
        standard_enabled: true
      }
    });
    const findByID = payload.findByID.bind(payload);
    payload.findByID = async (args: { collection: string; id: string }) => {
      if (args.collection === "product-variants") throw infrastructureError;
      return findByID(args);
    };

    await expect(
      resolveLostCheckout({
        payload,
        user: { role: "user" },
        lines: [
          {
            productId: "product_1",
            skuId: "sku_1",
            mode: "standard_purchase",
            quantity: 1
          }
        ]
      })
    ).rejects.toBe(infrastructureError);
  });

  it("rejects an inactive SKU", async () => {
    await expect(
      resolveLostCheckout({
        payload: payloadWith({
          product_1: {
            id: "product_1",
            active: true,
            name: "Jacket",
            slug: "jacket",
            currency: "KRW",
            unit_amount: 120000,
            min_order_quantity: 1,
            max_order_quantity: 2,
            standard_enabled: true
          },
          sku_1: {
            id: "sku_1",
            product: "product_1",
            active: false,
            sku: "LIS-JACKET-01",
            options: []
          }
        }),
        user: { role: "user" },
        lines: [
          {
            productId: "product_1",
            skuId: "sku_1",
            mode: "standard_purchase",
            quantity: 1
          }
        ]
      })
    ).rejects.toThrow("sku-inactive");
  });

  it("rejects a SKU that belongs to another product", async () => {
    await expect(
      resolveLostCheckout({
        payload: payloadWith({
          product_1: {
            id: "product_1",
            active: true,
            name: "Jacket",
            slug: "jacket",
            currency: "KRW",
            unit_amount: 120000,
            min_order_quantity: 1,
            max_order_quantity: 2,
            standard_enabled: true
          },
          sku_2: {
            id: "sku_2",
            product: "product_2",
            active: true,
            sku: "LIS-OTHER-01",
            options: []
          }
        }),
        user: { role: "user" },
        lines: [
          {
            productId: "product_1",
            skuId: "sku_2",
            mode: "standard_purchase",
            quantity: 1
          }
        ]
      })
    ).rejects.toThrow("sku-product-mismatch");
  });

  it("rejects a direct SKU checkout for a product outside LOSTINSEOUL", async () => {
    await expect(
      resolveLostCheckout({
        payload: payloadWith({
          product_1: {
            id: "product_1",
            active: true,
            storefront: "hideaway",
            name: "Jacket",
            slug: "jacket",
            currency: "KRW",
            unit_amount: 120000,
            min_order_quantity: 1,
            max_order_quantity: 2,
            standard_enabled: true
          },
          sku_1: activeSku()
        }),
        user: { role: "user" },
        lines: [
          {
            productId: "product_1",
            skuId: "sku_1",
            mode: "standard_purchase",
            quantity: 1
          }
        ]
      })
    ).rejects.toThrow("product-unavailable");
  });

  it("rejects a variant reference without a SKU identity", async () => {
    await expect(
      resolveLostCheckout({
        payload: payloadWith({
          product_1: {
            id: "product_1",
            active: true,
            name: "Jacket",
            slug: "jacket",
            currency: "KRW",
            unit_amount: 120000,
            min_order_quantity: 1,
            max_order_quantity: 2,
            standard_enabled: true
          }
        }),
        user: { role: "user" },
        lines: [
          {
            productId: "product_1",
            variantId: "retired-variant-1",
            mode: "standard_purchase",
            quantity: 1
          } as never
        ]
      })
    ).rejects.toThrow("sku-required");
  });

  it("uses the active SKU price override in an immutable line snapshot", async () => {
    const skuOptions = [
      { key: "size", value: "02" },
      { key: "color", value: "black" }
    ];
    const sku = {
      id: "sku_1",
      product: "product_1",
      active: true,
      sku: "LIS-JACKET-BLACK-02",
      label: "Black / 02",
      options: skuOptions,
      price_override_amount: 135000,
      weight_grams: null,
      dimensions: null,
      tax_category: null
    };
    const result = await resolveLostCheckout({
      payload: payloadWith({
        product_1: {
          id: "product_1",
          active: true,
          name: "Jacket",
          slug: "jacket",
          currency: "KRW",
          unit_amount: 120000,
          min_order_quantity: 1,
          max_order_quantity: 2,
          standard_enabled: true
        },
        sku_1: sku
      }),
      user: { role: "user" },
      lines: [
        {
          productId: "product_1",
          skuId: "sku_1",
          mode: "standard_purchase",
          quantity: 2
        }
      ]
    });

    skuOptions[0]!.value = "changed";
    sku.label = "Changed";

    expect(result.totalAmount).toBe(270000);
    expect(result.lines[0]).toMatchObject({
      schemaVersion: 3,
      productId: "product_1",
      productName: "Jacket",
      productSlug: "jacket",
      skuId: "sku_1",
      sku: "LIS-JACKET-BLACK-02",
      skuLabel: "Black / 02",
      options: [
        { key: "color", value: "black" },
        { key: "size", value: "02" }
      ],
      currency: "KRW",
      unitAmount: 135000,
      quantity: 2,
      lineAmount: 270000,
      weightGrams: null,
      dimensions: null,
      taxCategory: null,
      mode: "standard_purchase"
    });
  });

  it("snapshots a conventional purchase", async () => {
    const result = await resolveLostCheckout({
      payload: payloadWith({
        product_1: {
          id: "product_1",
          active: true,
          name: "Jacket",
          slug: "jacket",
          currency: "KRW",
          unit_amount: 120000,
          min_order_quantity: 1,
          max_order_quantity: 2,
          standard_enabled: true
        },
        sku_1: activeSku()
      }),
      user: { role: "user" },
      lines: [
        {
          productId: "product_1",
          skuId: "sku_1",
          mode: "standard_purchase",
          quantity: 2
        }
      ]
    });

    expect(result.totalAmount).toBe(240000);
    expect(result.lines[0]).toMatchObject({
      productName: "Jacket",
      lineAmount: 240000
    });
  });

  it("aggregates duplicate raw lines before enforcing max order quantity", async () => {
    await expect(
      resolveLostCheckout({
        payload: payloadWith({
          product_1: {
            id: "product_1",
            active: true,
            name: "Limited jacket",
            slug: "limited-jacket",
            currency: "KRW",
            unit_amount: 120000,
            min_order_quantity: 1,
            max_order_quantity: 2,
            standard_enabled: true
          },
          sku_1: activeSku()
        }),
        user: { role: "user" },
        lines: [
          {
            productId: "product_1",
            skuId: "sku_1",
            mode: "standard_purchase",
            quantity: 2
          },
          {
            productId: "product_1",
            skuId: "sku_1",
            mode: "standard_purchase",
            quantity: 1
          }
        ]
      })
    ).rejects.toThrow("quantity-out-of-range");
  });

  it.each([
    {
      mode: "standard_purchase" as const,
      product: { standard_enabled: true }
    },
    {
      mode: "private_order" as const,
      product: {
        private_order_enabled: true,
        private_preset_price_enabled: true,
        private_unit_amount: 120000
      }
    }
  ])(
    "rejects a campaign-bearing $mode line before it can split duplicate quantities",
    async ({ mode, product }) => {
      await expect(
        resolveLostCheckout({
          payload: payloadWith({
            product_1: {
              id: "product_1",
              active: true,
              name: "Limited jacket",
              slug: "limited-jacket",
              currency: "KRW",
              unit_amount: 120000,
              min_order_quantity: 1,
              max_order_quantity: 2,
              ...product
            },
            sku_1: activeSku()
          }),
          user: { role: "patron" },
          lines: [
            {
              productId: "product_1",
              skuId: "sku_1",
              mode,
              quantity: 2
            },
            {
              productId: "product_1",
              skuId: "sku_1",
              mode,
              quantity: 1,
              campaignId: "campaign_1"
            }
          ]
        })
      ).rejects.toThrow("campaign-not-allowed");
    }
  );

  it.each(["standard_purchase", "private_order"] as const)(
    "rejects campaignId on %s before catalog resolution",
    async (mode) => {
      const payload = {
        async findByID() {
          throw new Error("catalog-called");
        }
      };

      await expect(
        resolveLostCheckout({
          payload: payload as never,
          user: { role: "patron" },
          lines: [
            {
              productId: "product_1",
              skuId: "sku_1",
              mode,
              quantity: 1,
              campaignId: "campaign_1"
            }
          ]
        })
      ).rejects.toThrow("campaign-not-allowed");
    }
  );

  it("uses the standard-enabled mode flag", async () => {
    const result = await resolveLostCheckout({
        payload: payloadWith({
          product_1: {
            id: "product_1",
            active: true,
            name: "Request jacket",
            slug: "request-jacket",
            currency: "KRW",
            unit_amount: 120000,
            min_order_quantity: 1,
            max_order_quantity: 2,
            standard_enabled: true
          },
          sku_1: activeSku()
        }),
        user: { role: "user" },
        lines: [
          {
            productId: "product_1",
            skuId: "sku_1",
            mode: "standard_purchase",
            quantity: 1
          }
        ]
      });
    expect(result.totalAmount).toBe(120000);
  });

  it("rejects unknown SKU ids instead of falling back to product pricing", async () => {
    await expect(
      resolveLostCheckout({
        payload: payloadWith({
          product_1: {
            id: "product_1",
            active: true,
            name: "Variant jacket",
            slug: "variant-jacket",
            currency: "KRW",
            unit_amount: 120000,
            min_order_quantity: 1,
            max_order_quantity: 2,
            standard_enabled: true
          }
        }),
        user: { role: "user" },
        lines: [
          {
            productId: "product_1",
            skuId: "sku_missing",
            mode: "standard_purchase",
            quantity: 1
          }
        ]
      })
    ).rejects.toThrow("sku-not-found");
  });

  it("leaves standard inventory authority to the reservation ledger", async () => {
    const result = await resolveLostCheckout({
        payload: payloadWith({
          product_1: {
            id: "product_1",
            active: true,
            name: "Variant jacket",
            slug: "variant-jacket",
            currency: "KRW",
            unit_amount: 120000,
            min_order_quantity: 1,
            max_order_quantity: 5,
            standard_enabled: true
          },
          sku_1: activeSku({ label: "Small" })
        }),
        user: { role: "user" },
        lines: [
          {
            productId: "product_1",
            skuId: "sku_1",
            mode: "standard_purchase",
            quantity: 2
          }
        ]
      });
    expect(result.totalAmount).toBe(240000);
  });

  it("requires an open campaign for request-to-order lines", async () => {
    await expect(
      resolveLostCheckout({
        payload: payloadWith({
          product_1: {
            id: "product_1",
            active: true,
            name: "Coat",
            slug: "coat",
            currency: "KRW",
            unit_amount: 220000,
            min_order_quantity: 1,
            max_order_quantity: 1,
            request_to_order_enabled: true
          },
          campaign_1: {
            id: "campaign_1",
            product: "product_1",
            state: "draft",
            deadline: new Date(Date.now() + 86_400_000).toISOString()
          },
          sku_1: activeSku()
        }),
        user: { role: "user" },
        lines: [
          {
            productId: "product_1",
            skuId: "sku_1",
            mode: "request_to_order",
            quantity: 1,
            campaignId: "campaign_1"
          }
        ]
      })
    ).rejects.toThrow("campaign-not-open");
  });

  it("normalizes a missing request campaign to campaign-not-open", async () => {
    await expect(
      resolveLostCheckout({
        payload: payloadWith({
          product_1: {
            id: "product_1",
            active: true,
            name: "Coat",
            slug: "coat",
            currency: "KRW",
            unit_amount: 220000,
            min_order_quantity: 1,
            max_order_quantity: 1,
            request_to_order_enabled: true
          },
          sku_1: activeSku()
        }),
        user: { role: "user" },
        lines: [
          {
            productId: "product_1",
            skuId: "sku_1",
            mode: "request_to_order",
            quantity: 1,
            campaignId: "missing-campaign"
          }
        ]
      })
    ).rejects.toThrow("campaign-not-open");
  });

  it("rejects a finite campaign until capacity reservations exist", async () => {
    await expect(
      resolveLostCheckout({
        payload: payloadWith({
          product_1: {
            id: "product_1",
            active: true,
            name: "Coat",
            slug: "coat",
            currency: "KRW",
            unit_amount: 220000,
            min_order_quantity: 1,
            max_order_quantity: 1,
            request_to_order_enabled: true
          },
          campaign_1: {
            id: "campaign_1",
            product: "product_1",
            state: "open",
            deadline: new Date(Date.now() + 86_400_000).toISOString(),
            maximum_commitments: 100,
            paid_commitments: 0,
            eligible_skus: ["sku_1"]
          },
          sku_1: activeSku()
        }),
        user: { role: "user" },
        lines: [
          {
            productId: "product_1",
            skuId: "sku_1",
            mode: "request_to_order",
            quantity: 1,
            campaignId: "campaign_1"
          }
        ]
      })
    ).rejects.toThrow("campaign-capacity-reservations-unavailable");
  });

  it("enforces private-order tier gates", async () => {
    await expect(
      resolveLostCheckout({
        payload: payloadWith({
          product_1: {
            id: "product_1",
            active: true,
            name: "Archive",
            slug: "archive",
            currency: "KRW",
            unit_amount: 330000,
            min_order_quantity: 1,
            max_order_quantity: 1,
            private_order_enabled: true,
            private_tier_gate: "patron"
          }
        }),
        user: { role: "resident" },
        lines: [
          {
            productId: "product_1",
            mode: "private_order",
            quantity: 1
          } as never
        ]
      })
    ).rejects.toThrow("private-order-forbidden");
  });

  it("rejects direct private checkout without a complete positive preset", async () => {
    await expect(
      resolveLostCheckout({
        payload: payloadWith({
          product_1: {
            id: "product_1",
            active: true,
            name: "Archive",
            slug: "archive",
            currency: "KRW",
            unit_amount: 330000,
            min_order_quantity: 1,
            max_order_quantity: 1,
            private_order_enabled: true,
            private_preset_price_enabled: false
          },
          sku_1: activeSku({ price_override_amount: 350000 })
        }),
        user: { role: "patron" },
        lines: [
          {
            productId: "product_1",
            skuId: "sku_1",
            mode: "private_order",
            quantity: 1
          }
        ]
      })
    ).rejects.toThrow("invalid-sku-price");
  });
});
