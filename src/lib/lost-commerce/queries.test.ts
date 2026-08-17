import { afterAll, beforeEach, describe, expect, it, vi } from "vitest";
import { getPayload } from "payload";
import {
  normalizeLostDropCard,
  normalizeLostProductSkus
} from "./query-normalizers";
import {
  getLostCollectionBySlug,
  getLostFragranceData,
  getLostHomeData,
  getLostProductBySlug
} from "./queries";

vi.mock("@payload-config", () => ({ default: {} }));
vi.mock("payload", () => ({ getPayload: vi.fn() }));

const find = vi.fn();
const execute = vi.fn();

const POLICY_ENV = {
  LOST_INVENTORY_RESERVATIONS_LIVE: "true",
  LOST_INVENTORY_RESERVATION_TTL_MINUTES: "15",
  LOST_INVENTORY_RESERVATION_LOCATION_CODE: "SEOUL",
  LOST_INVENTORY_SAFETY_STOCK: "0",
  LOST_INVENTORY_RESERVATION_CONSUME_POINT: "payment_confirmed",
  LOST_INVENTORY_EXPIRY_BOUNDARY: "at_or_after",
  LOST_INVENTORY_PAYMENT_TIME_SOURCE: "provider_paid_at",
  LOST_INVENTORY_LATE_PAYMENT_POLICY: "manual_review",
  LOST_INVENTORY_BACKORDER_MODE: "disabled"
} as const;

const originalEnv = Object.fromEntries(
  Object.keys(POLICY_ENV).map((key) => [key, process.env[key]])
);

const defaultAvailabilityRows = [
  "sku-1",
  "sku-2",
  "sku-active",
  "sku-eligible",
  "sku-high",
  "sku-incomplete",
  "sku-ineligible",
  "sku-low",
  "sku-override"
].map((sku_id) => ({ sku_id, available_to_promise: 1 }));

function product(overrides: Record<string, unknown> = {}) {
  return {
    id: "product-1",
    name: "CATALYST",
    slug: "catalyst",
    active: true,
    storefront: "lostinseoul",
    currency: "KRW",
    unit_amount: 120000,
    standard_enabled: true,
    request_to_order_enabled: true,
    private_order_enabled: true,
    ...overrides
  };
}

function mockProductQuery(
  productDoc: Record<string, unknown>,
  skuPages: Record<number, Record<string, unknown>[]>,
  campaignDocs: Record<string, unknown>[] = []
) {
  execute.mockResolvedValue({
    rows: Object.values(skuPages)
      .flat()
      .filter((sku) => sku.active !== false)
      .map((sku) => ({
        sku_id: sku.id,
        available_to_promise: 1
      }))
  });
  find.mockImplementation(
    async ({ collection, page = 1 }: { collection: string; page?: number }) => {
      if (collection === "products") {
        return { docs: [productDoc], hasNextPage: false, nextPage: null };
      }
      if (collection === "product-order-campaigns") {
        return { docs: campaignDocs, hasNextPage: false, nextPage: null };
      }
      const docs = (skuPages[page] ?? []).map((sku) => ({ ...sku }));
      const nextPage = skuPages[page + 1] ? page + 1 : null;
      return { docs, hasNextPage: nextPage !== null, nextPage };
    }
  );
}

beforeEach(() => {
  find.mockReset();
  execute.mockReset();
  execute.mockResolvedValue({ rows: defaultAvailabilityRows });
  Object.assign(process.env, POLICY_ENV);
  vi.mocked(getPayload).mockResolvedValue({
    db: { drizzle: { execute } },
    find
  } as never);
});

afterAll(() => {
  for (const [key, value] of Object.entries(originalEnv)) {
    if (value === undefined) delete process.env[key];
    else process.env[key] = value;
  }
});

describe("lost commerce query normalization", () => {
  it("normalizes active SKUs without scalar stock compatibility fields", () => {
    expect(
      normalizeLostProductSkus({ unit_amount: 120000 }, [
        {
          id: "sku-1",
          active: true,
          sku: "LIS-1",
          label: "Black / 02",
          options: [
            { key: "size", value: "02" },
            { key: "color", value: "Black" }
          ],
          price_override_amount: 135000
        },
        { id: "sku-2", active: false, sku: "LIS-2", options: [] }
      ])
    ).toEqual([
      {
        id: "sku-1",
        sku: "LIS-1",
        label: "Black / 02",
        size: "02",
        color: "Black",
        amount: 135000
      }
    ]);
  });

  it("normalizes active drop cards without leaking Payload fields", () => {
    expect(
      normalizeLostDropCard({
        id: "drop_1",
        title: "Available Now",
        slug: "available-now",
        kicker: "Dispatch 01",
        lede: "Objects and editions ready for immediate checkout."
      })
    ).toEqual({
      title: "Available Now",
      slug: "available-now",
      kicker: "Dispatch 01",
      lede: "Objects and editions ready for immediate checkout."
    });
  });
});

describe("lost commerce relational SKU queries", () => {
  it("exposes a populated rich description for the optional detail panel", async () => {
    const description = {
      root: {
        type: "root",
        children: [{ type: "paragraph", version: 1 }],
        direction: null,
        format: "",
        indent: 0,
        version: 1
      }
    };
    mockProductQuery(product({ description }), {
      1: [
        {
          id: "sku-1",
          product: "product-1",
          active: true,
          sku: "LIS-1",
          options: []
        }
      ]
    });

    const result = await getLostProductBySlug("catalyst");

    expect(result?.description).toBe(description);
  });

  it("combines every active SKU page in Payload sort order", async () => {
    mockProductQuery(product(), {
      1: [
        {
          id: "sku-1",
          product: "product-1",
          active: true,
          sku: "LIS-1",
          sort: 1,
          options: []
        }
      ],
      2: [
        {
          id: "sku-2",
          product: "product-1",
          active: true,
          sku: "LIS-2",
          sort: 2,
          options: []
        }
      ]
    });

    const result = await getLostProductBySlug("catalyst");

    expect(result?.variants.map((variant) => variant.id)).toEqual([
      "sku-1",
      "sku-2"
    ]);
    expect(find).toHaveBeenCalledWith(
      expect.objectContaining({
        collection: "product-variants",
        page: 1,
        sort: "sort"
      })
    );
    expect(find).toHaveBeenCalledWith(
      expect.objectContaining({
        collection: "product-variants",
        page: 2,
        sort: "sort"
      })
    );
  });

  it("exposes no purchasable mode without an active relational SKU", async () => {
    mockProductQuery(product(), {
      1: [
        {
          id: "inactive-sku",
          product: "product-1",
          active: false,
          sku: "LIS-INACTIVE",
          options: []
        }
      ]
    });

    const result = await getLostProductBySlug("catalyst");

    expect(result?.modes).toEqual([]);
    expect(result?.displayPrice).toBeNull();
    expect(result?.variants).toEqual([]);
  });

  it("shows a fixed pre-order price before its campaign becomes actionable", async () => {
    mockProductQuery(
      product({
        standard_enabled: false,
        request_to_order_enabled: true,
        private_order_enabled: false
      }),
      {
        1: [
          {
            id: "sku-preorder",
            product: "product-1",
            active: true,
            sku: "LIS-PREORDER",
            options: []
          }
        ]
      }
    );

    const result = await getLostProductBySlug("catalyst");

    expect(result?.modes).toEqual([]);
    expect(result?.displayPrice).toBe("\u20a9120,000");
    expect(result?.variants[0]?.actionableModes).toEqual([]);
  });

  it("enables standard purchase when batched ATP is positive", async () => {
    mockProductQuery(
      product({
        request_to_order_enabled: false,
        private_order_enabled: false
      }),
      {
        1: [
          {
            id: "sku-incomplete",
            product: "product-1",
            active: true,
            sku: "LIS-INCOMPLETE",
            options: []
          }
        ]
      }
    );

    const result = await getLostProductBySlug("catalyst");

    expect(result?.modes).toEqual(["standard_purchase"]);
    expect(result?.variants[0]?.actionableModes).toEqual(["standard_purchase"]);
    expect(execute).toHaveBeenCalledTimes(1);
  });

  it("fails standard purchase closed when the full PortOne reservation policy is unavailable", async () => {
    delete process.env.LOST_INVENTORY_RESERVATION_LOCATION_CODE;
    mockProductQuery(
      product({
        request_to_order_enabled: false,
        private_order_enabled: false
      }),
      {
        1: [
          {
            id: "sku-incomplete",
            product: "product-1",
            active: true,
            sku: "LIS-INCOMPLETE",
            options: []
          }
        ]
      }
    );

    const result = await getLostProductBySlug("catalyst");

    expect(result?.modes).toEqual([]);
    expect(result?.variants[0]?.actionableModes).toEqual([]);
    expect(execute).not.toHaveBeenCalled();
  });

  it("disables standard purchase when ATP is zero", async () => {
    mockProductQuery(
      product({
        request_to_order_enabled: false,
        private_order_enabled: false
      }),
      {
        1: [
          {
            id: "sku-incomplete",
            product: "product-1",
            active: true,
            sku: "LIS-INCOMPLETE",
            options: []
          }
        ]
      }
    );
    execute.mockResolvedValue({
      rows: [{ sku_id: "sku-incomplete", available_to_promise: 0 }]
    });

    const result = await getLostProductBySlug("catalyst");

    expect(result?.modes).toEqual([]);
    expect(result?.variants[0]?.actionableModes).toEqual([]);
    expect(execute).toHaveBeenCalledTimes(1);
  });

  it("leaves request and private modes unchanged when standard purchase fails closed", async () => {
    delete process.env.LOST_INVENTORY_RESERVATION_LOCATION_CODE;
    mockProductQuery(
      product({
        standard_enabled: true,
        request_to_order_enabled: true,
        private_order_enabled: true,
        private_preset_price_enabled: false
      }),
      {
        1: [
          {
            id: "sku-eligible",
            product: "product-1",
            active: true,
            sku: "LIS-ELIGIBLE",
            options: []
          }
        ]
      },
      [
        {
          id: "campaign-1",
          title: "Production run",
          state: "open",
          deadline: "2099-08-31T00:00:00.000Z",
          maximum_commitments: null,
          eligible_skus: ["sku-eligible"]
        }
      ]
    );

    const result = await getLostProductBySlug("catalyst");

    expect(result?.modes).toEqual(["request_to_order", "private_order"]);
    expect(result?.variants[0]?.actionableModes).toEqual([
      "request_to_order",
      "private_order"
    ]);
    expect(result?.variants[0]?.stockState).toBe("on_request");
    expect(execute).not.toHaveBeenCalled();
  });

  it("keeps an unpriced made-to-order SKU available only through private quote", async () => {
    mockProductQuery(
      product({
        standard_enabled: false,
        request_to_order_enabled: false,
        private_order_enabled: true,
        private_preset_price_enabled: false,
        private_unit_amount: null
      }),
      {
        1: [
          {
            id: "sku-private-quote",
            product: "product-1",
            active: true,
            sku: "LIS-PRIVATE-QUOTE",
            price_override_amount: null,
            options: []
          }
        ]
      }
    );

    const result = await getLostProductBySlug("catalyst");

    expect(result?.modes).toEqual(["private_order"]);
    expect(result?.displayPrice).toBeNull();
    expect(result?.variants[0]?.actionableModes).toEqual(["private_order"]);
  });

  it("fails closed when private preset checkout is enabled without a positive preset", async () => {
    mockProductQuery(
      product({
        standard_enabled: false,
        request_to_order_enabled: false,
        private_order_enabled: true,
        private_preset_price_enabled: true,
        private_unit_amount: null
      }),
      {
        1: [
          {
            id: "sku-private-incomplete",
            product: "product-1",
            active: true,
            sku: "LIS-PRIVATE-INCOMPLETE",
            price_override_amount: null,
            options: []
          }
        ]
      }
    );

    const result = await getLostProductBySlug("catalyst");

    expect(result?.modes).toEqual([]);
    expect(result?.displayPrice).toBeNull();
    expect(result?.variants[0]?.actionableModes).toEqual([]);
  });

  it("gates request-to-order SKUs through the active campaign eligible list", async () => {
    mockProductQuery(
      product({
        standard_enabled: false,
        private_order_enabled: false
      }),
      {
        1: [
          {
            id: "sku-ineligible",
            product: "product-1",
            active: true,
            sku: "LIS-INELIGIBLE",
            options: []
          },
          {
            id: "sku-eligible",
            product: "product-1",
            active: true,
            sku: "LIS-ELIGIBLE",
            options: []
          }
        ]
      },
      [
        {
          id: "campaign-1",
          title: "Production run",
          state: "open",
          deadline: "2099-08-31T00:00:00.000Z",
          minimum_commitments: 20,
          maximum_commitments: null,
          paid_commitments: 8,
          eligible_skus: [{ id: "sku-eligible" }]
        }
      ]
    );

    const result = await getLostProductBySlug("catalyst");

    expect(result?.modes).toEqual(["request_to_order"]);
    expect(result?.campaign?.eligibleSkuIds).toEqual(["sku-eligible"]);
    expect(result?.variants).toEqual([
      expect.objectContaining({
        id: "sku-ineligible",
        actionableModes: []
      }),
      expect.objectContaining({
        id: "sku-eligible",
        actionableModes: ["request_to_order"]
      })
    ]);
  });

  it("suppresses request-to-order checkout for a finite campaign until capacity is reserved", async () => {
    mockProductQuery(
      product({
        standard_enabled: false,
        private_order_enabled: false
      }),
      {
        1: [
          {
            id: "sku-eligible",
            product: "product-1",
            active: true,
            sku: "LIS-ELIGIBLE",
            options: []
          }
        ]
      },
      [
        {
          id: "campaign-1",
          title: "Limited production run",
          state: "open",
          deadline: "2099-08-31T00:00:00.000Z",
          minimum_commitments: 20,
          maximum_commitments: 100,
          paid_commitments: 8,
          eligible_skus: ["sku-eligible"]
        }
      ]
    );

    const result = await getLostProductBySlug("catalyst");

    expect(result?.modes).toEqual([]);
    expect(result?.displayPrice).toBe("\u20a9120,000");
    expect(result?.variants[0]?.actionableModes).toEqual([]);
  });

  it("selects an actionable unbounded campaign after a finite campaign", async () => {
    mockProductQuery(
      product({ standard_enabled: false, private_order_enabled: false }),
      {
        1: [
          {
            id: "sku-eligible",
            product: "product-1",
            active: true,
            sku: "LIS-ELIGIBLE",
            options: []
          }
        ]
      },
      [
        {
          id: "campaign-finite",
          title: "Finite run",
          state: "open",
          deadline: "2099-08-01T00:00:00.000Z",
          maximum_commitments: 100,
          eligible_skus: ["sku-eligible"]
        },
        {
          id: "campaign-unbounded",
          title: "Open run",
          state: "open",
          deadline: "2099-09-01T00:00:00.000Z",
          maximum_commitments: null,
          eligible_skus: ["sku-eligible"]
        }
      ]
    );

    const result = await getLostProductBySlug("catalyst");

    expect(result?.campaign?.id).toBe("campaign-unbounded");
    expect(result?.variants[0]?.actionableModes).toEqual(["request_to_order"]);
  });

  it("does not expose request-to-order when the campaign has no eligible active SKU", async () => {
    mockProductQuery(
      product({
        standard_enabled: false,
        private_order_enabled: false
      }),
      {
        1: [
          {
            id: "sku-active",
            product: "product-1",
            active: true,
            sku: "LIS-ACTIVE",
            options: []
          }
        ]
      },
      [
        {
          id: "campaign-1",
          title: "Production run",
          state: "open",
          deadline: "2099-08-31T00:00:00.000Z",
          eligible_skus: ["different-sku"]
        }
      ]
    );

    const result = await getLostProductBySlug("catalyst");

    expect(result?.modes).toEqual([]);
    expect(result?.displayPrice).toBe("\u20a9120,000");
    expect(result?.variants[0]?.actionableModes).toEqual([]);
  });

  it("rejects an invalid next page returned by Payload", async () => {
    find.mockImplementation(
      async ({ collection }: { collection: string; page?: number }) => {
        if (collection === "products") {
          return { docs: [product()], hasNextPage: false, nextPage: null };
        }
        if (collection === "product-order-campaigns") {
          return { docs: [], hasNextPage: false, nextPage: null };
        }
        return { docs: [], hasNextPage: true, nextPage: 1 };
      }
    );

    await expect(getLostProductBySlug("catalyst")).rejects.toThrow(
      "Invalid product SKU pagination state"
    );
  });

  it("returns null when the requested product does not exist", async () => {
    find.mockResolvedValue({ docs: [], hasNextPage: false, nextPage: null });

    await expect(getLostProductBySlug("missing")).resolves.toBeNull();
    expect(find).toHaveBeenCalledTimes(1);
  });
});

describe("lost commerce storefront queries", () => {
  it("prefers an actionable private preset over a closed pre-order price", async () => {
    mockProductQuery(
      product({
        standard_enabled: false,
        request_to_order_enabled: true,
        private_order_enabled: true,
        private_preset_price_enabled: true,
        private_unit_amount: 150000
      }),
      {
        1: [
          {
            id: "sku-mixed-private",
            product: "product-1",
            active: true,
            sku: "LIS-MIXED-PRIVATE",
            price_override_amount: 120000,
            options: []
          }
        ]
      }
    );

    const result = await getLostHomeData();

    expect(result.products[0]).toEqual(
      expect.objectContaining({
        displayPrice: "₩150,000",
        modes: ["private_order"]
      })
    );
  });

  it("displays a complete positive private preset for a private-only product", async () => {
    mockProductQuery(
      product({
        standard_enabled: false,
        request_to_order_enabled: false,
        private_order_enabled: true,
        private_preset_price_enabled: true,
        private_unit_amount: 150000
      }),
      {
        1: [
          {
            id: "sku-private",
            product: "product-1",
            active: true,
            sku: "LIS-PRIVATE",
            price_override_amount: 120000,
            options: []
          }
        ]
      }
    );

    const result = await getLostHomeData();

    expect(result.products[0]).toEqual(
      expect.objectContaining({
        displayPrice: "₩150,000",
        modes: ["private_order"],
        price: "₩120,000"
      })
    );
  });

  it("exposes no numeric display price for a quote-only private product", async () => {
    mockProductQuery(
      product({
        standard_enabled: false,
        request_to_order_enabled: false,
        private_order_enabled: true,
        private_preset_price_enabled: false,
        private_unit_amount: null
      }),
      {
        1: [
          {
            id: "sku-private-quote",
            product: "product-1",
            active: true,
            sku: "LIS-PRIVATE-QUOTE",
            price_override_amount: 120000,
            options: []
          }
        ]
      }
    );

    const result = await getLostHomeData();

    expect(result.products[0]).toEqual(
      expect.objectContaining({
        displayPrice: null,
        modes: ["private_order"],
        price: "₩120,000"
      })
    );
  });

  it.each([1.5, Number.MAX_SAFE_INTEGER + 1])(
    "does not display an invalid private preset amount (%s)",
    async (privateUnitAmount) => {
      mockProductQuery(
        product({
          standard_enabled: false,
          request_to_order_enabled: false,
          private_order_enabled: true,
          private_preset_price_enabled: true,
          private_unit_amount: privateUnitAmount
        }),
        {
          1: [
            {
              id: "sku-private-invalid-preset",
              product: "product-1",
              active: true,
              sku: "LIS-PRIVATE-INVALID",
              price_override_amount: 120000,
              options: []
            }
          ]
        }
      );

      const result = await getLostHomeData();

      expect(result.products[0]?.displayPrice).toBeNull();
    }
  );

  it("uses the active SKU override when the product base price is zero", async () => {
    execute.mockResolvedValue({
      rows: [{ sku_id: "sku-override", available_to_promise: 1 }]
    });
    find.mockImplementation(async ({ collection }: { collection: string }) => {
      if (collection === "products") {
        return {
          docs: [product({ unit_amount: 0 })],
          hasNextPage: false,
          nextPage: null
        };
      }
      if (collection === "product-variants") {
        return {
          docs: [
            {
              id: "sku-override",
              product: "product-1",
              active: true,
              sku: "LIS-OVERRIDE",
              price_override_amount: 135000,
              options: []
            }
          ],
          hasNextPage: false,
          nextPage: null
        };
      }
      return { docs: [], hasNextPage: false, nextPage: null };
    });

    const result = await getLostHomeData();

    expect(result.products[0]).toEqual(
      expect.objectContaining({
        displayPrice: "₩135,000",
        unitAmount: 135000,
        price: "₩135,000"
      })
    );
  });

  it("shows the active SKU price range when overrides differ", async () => {
    execute.mockResolvedValue({
      rows: [
        { sku_id: "sku-high", available_to_promise: 1 },
        { sku_id: "sku-low", available_to_promise: 1 }
      ]
    });
    find.mockImplementation(async ({ collection }: { collection: string }) => {
      if (collection === "products") {
        return {
          docs: [product({ unit_amount: 0 })],
          hasNextPage: false,
          nextPage: null
        };
      }
      if (collection === "product-variants") {
        return {
          docs: [
            {
              id: "sku-high",
              product: "product-1",
              active: true,
              sku: "LIS-HIGH",
              price_override_amount: 150000,
              options: []
            },
            {
              id: "sku-low",
              product: "product-1",
              active: true,
              sku: "LIS-LOW",
              price_override_amount: 125000,
              options: []
            }
          ],
          hasNextPage: false,
          nextPage: null
        };
      }
      return { docs: [], hasNextPage: false, nextPage: null };
    });

    const result = await getLostHomeData();

    expect(result.products[0]).toEqual(
      expect.objectContaining({
        displayPrice: "₩125,000–₩150,000",
        unitAmount: 150000,
        price: "₩125,000–₩150,000"
      })
    );
  });

  it("loads home products, campaigns, drops, and normalized media", async () => {
    execute.mockResolvedValue({
      rows: [{ sku_id: "sku-1", available_to_promise: 1 }]
    });
    find.mockImplementation(async ({ collection }: { collection: string }) => {
      if (collection === "products") {
        return {
          docs: [
            product({
              hero_media: {
                url: "/api/media/file/catalyst-cover.jpg",
                filename: "catalyst-cover.jpg",
                alt: null,
                mimeType: "image/jpeg"
              },
              gallery: [
                {
                  url: "/media/catalyst-cover.jpg",
                  alt: "Duplicate cover",
                  mimeType: "image/jpeg"
                },
                {
                  filename: "catalyst-detail.webp",
                  alt: "Bottle detail"
                },
                {
                  url: "/media/catalyst-film.mp4",
                  mimeType: "video/mp4"
                }
              ]
            })
          ],
          hasNextPage: false,
          nextPage: null
        };
      }
      if (collection === "product-variants") {
        return {
          docs: [
            {
              id: "sku-1",
              product: { id: "product-1" },
              active: true,
              sku: "LIS-1",
              options: []
            }
          ],
          hasNextPage: false,
          nextPage: null
        };
      }
      if (collection === "product-order-campaigns") {
        return {
          docs: [
            {
              id: "campaign-1",
              title: "Production run",
              minimum_commitments: "20",
              paid_commitments: 8,
              deadline: "2026-08-31T00:00:00.000Z",
              progress_visibility: "count",
              eligible_skus: ["sku-1"]
            }
          ]
        };
      }
      return {
        docs: [
          {
            title: "Current collection",
            slug: "current",
            kicker: "Current"
          }
        ],
        hasNextPage: false,
        nextPage: null
      };
    });

    const result = await getLostHomeData();

    expect(result.products).toEqual([
      expect.objectContaining({
        id: "product-1",
        imageUrl: "/media/catalyst-cover.jpg",
        imageAlt: "catalyst-cover.jpg",
        galleryPreview: [
          { url: "/media/catalyst-cover.jpg", alt: "catalyst-cover.jpg" },
          { url: "/media/catalyst-detail.webp", alt: "Bottle detail" }
        ],
        heroVideoUrl: null,
        modes: ["standard_purchase", "request_to_order", "private_order"],
        stockState: "in_stock",
        campaign: {
          id: "campaign-1",
          title: "Production run",
          minimumCommitments: 20,
          paidCommitments: 8,
          deadline: "2026-08-31T00:00:00.000Z",
          progressVisibility: "count",
          eligibleSkuIds: ["sku-1"]
        }
      })
    ]);
    expect(result.drops).toEqual([
      {
        title: "Current collection",
        slug: "current",
        kicker: "Current",
        lede: undefined
      }
    ]);
  });

  it("loads a collection and its products", async () => {
    find.mockImplementation(
      async ({ collection, limit }: { collection: string; limit: number }) => {
        if (collection === "product-drops" && limit === 1) {
          return {
            docs: [
              {
                id: "drop-1",
                title: "Edition 01",
                slug: "edition-01",
                kicker: "Edition",
                lede: "Objects in this edition."
              }
            ]
          };
        }
        if (collection === "product-drops") {
          return {
            docs: [{ title: "Edition 01", slug: "edition-01" }]
          };
        }
        if (collection === "products") {
          return { docs: [product()], hasNextPage: false, nextPage: null };
        }
        if (collection === "product-variants") {
          return {
            docs: [
              {
                id: "sku-1",
                product: "product-1",
                active: true,
                sku: "LIS-1",
                options: []
              }
            ],
            hasNextPage: false,
            nextPage: null
          };
        }
        return { docs: [] };
      }
    );

    const result = await getLostCollectionBySlug("edition-01");

    expect(result).toEqual({
      title: "Edition 01",
      kicker: "Edition",
      lede: "Objects in this edition.",
      products: [expect.objectContaining({ id: "product-1" })],
      drops: [
        {
          title: "Edition 01",
          slug: "edition-01",
          kicker: undefined,
          lede: undefined
        }
      ]
    });
    expect(find).toHaveBeenCalledWith(
      expect.objectContaining({
        collection: "products",
        where: expect.objectContaining({
          and: expect.arrayContaining([{ drop: { equals: "drop-1" } }])
        })
      })
    );
  });

  it("returns null when a collection does not exist", async () => {
    find.mockResolvedValue({ docs: [] });

    await expect(getLostCollectionBySlug("missing")).resolves.toBeNull();
    expect(find).toHaveBeenCalledTimes(2);
  });

  it("selects the first product in a fragrance category", async () => {
    find.mockImplementation(
      async ({ collection, limit }: { collection: string; limit: number }) => {
        if (collection === "products" && limit === 24) {
          return {
            docs: [
              product({ id: "other", slug: "other", category: "category-1" }),
              product({
                id: "soap",
                slug: "soap",
                category: { slug: "bath", name: "Bath" }
              }),
              product({
                category: { slug: "catalyst-perfume", name: "CATALYST" }
              })
            ]
          };
        }
        if (collection === "products") {
          return {
            docs: [
              product({
                hero_media: {
                  url: "/media/catalyst-film.webm",
                  mimeType: "video/webm"
                },
                gallery: [
                  { filename: "catalyst-still.png", alt: "CATALYST bottle" },
                  { url: "/media/catalyst-film.webm", mimeType: "video/webm" }
                ],
                details: "Product details",
                care: "Care instructions",
                shipping_returns: "Shipping and returns",
                private_preset_price_enabled: true,
                private_unit_amount: 150000
              })
            ]
          };
        }
        if (collection === "product-variants") {
          return {
            docs: [
              {
                id: "sku-1",
                product: "product-1",
                active: true,
                sku: "LIS-1",
                options: []
              }
            ],
            hasNextPage: false,
            nextPage: null
          };
        }
        return { docs: [] };
      }
    );

    const result = await getLostFragranceData();

    expect(result).toEqual(
      expect.objectContaining({
        slug: "catalyst",
        imageUrl: "/media/catalyst-still.png",
        heroVideoUrl: "/media/catalyst-film.webm",
        gallery: [
          { url: "/media/catalyst-still.png", alt: "CATALYST bottle" },
          { url: "/media/catalyst-film.webm", alt: null }
        ],
        details: "Product details",
        care: "Care instructions",
        shippingReturns: "Shipping and returns",
        privatePresetPriceEnabled: true,
        privateUnitAmount: 150000
      })
    );
    expect(find).toHaveBeenCalledWith(
      expect.objectContaining({
        collection: "products",
        limit: 1,
        where: expect.objectContaining({
          and: expect.arrayContaining([{ slug: { equals: "catalyst" } }])
        })
      })
    );
  });

  it("returns null when no fragrance category is present", async () => {
    find.mockResolvedValue({
      docs: [product({ category: { slug: "objects", name: "Objects" } })]
    });

    await expect(getLostFragranceData()).resolves.toBeNull();
    expect(find).toHaveBeenCalledTimes(1);
  });
});
