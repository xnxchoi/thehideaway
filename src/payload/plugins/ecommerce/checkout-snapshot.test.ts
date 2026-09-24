import type { PayloadRequest } from "payload";
import { describe, expect, it, vi } from "vitest";
import { buildCheckoutSnapshot, type CheckoutCart } from "./checkout-snapshot";

const shippingAddress = {
  country: "KR",
  firstName: "김 서울",
  phone: "+82 10 1234 5678",
  addressLine1: "서울시 중구 1",
  postalCode: "04524"
};

function fixture() {
  const product = {
    id: "p1",
    name: "Object",
    slug: "object",
    active: true,
    _status: "published",
    standard_enabled: true,
    enableVariants: true,
    min_order_quantity: 1,
    max_order_quantity: 3
  };
  const variant = {
    id: "v1",
    product: "p1",
    active: true,
    _status: "published",
    sku: "SKU-1",
    label: "Small",
    options: [{ id: "option-1", label: "Small", value: "s" }],
    priceInKRW: 1200,
    priceInKRWEnabled: true
  };
  const cart: CheckoutCart = {
    id: "c1",
    currency: "KRW",
    subtotal: 1200,
    items: [
      {
        product: "p1",
        variant: "v1",
        quantity: 1,
        product_name: "FORGED",
        sku: "FORGED"
      }
    ]
  };
  const find = vi.fn(async ({ collection }: { collection: string }) => ({
    docs: collection === "products" ? [product] : [variant]
  }));
  const req = { payload: { find } } as unknown as PayloadRequest;
  return { product, variant, cart, find, req, shippingAddress };
}

describe("checkout snapshots", () => {
  it("identifies this goods-only checkout as physical independently of client hints", async () => {
    const f = fixture();
    const { snapshot } = await buildCheckoutSnapshot({
      ...f,
      currency: "KRW",
      cart: { ...f.cart, fulfillmentKind: "digital" } as CheckoutCart
    });
    expect(snapshot).toMatchObject({ fulfillmentKind: "physical" });
  });
  it("rejects a stale selected variant after variants are disabled", async () => {
    const f = fixture();
    f.product.enableVariants = false;
    await expect(
      buildCheckoutSnapshot({ ...f, currency: "KRW" })
    ).rejects.toThrow("variants-disabled");
  });
  it("preserves a bounded delivery note in the purchase snapshot", async () => {
    const f = fixture();
    const { snapshot } = await buildCheckoutSnapshot({
      ...f,
      currency: "KRW",
      deliveryNote: "  Ring once  "
    });
    expect(snapshot.deliveryNote).toBe("Ring once");
    await expect(
      buildCheckoutSnapshot({
        ...f,
        currency: "KRW",
        deliveryNote: "x".repeat(2001)
      })
    ).rejects.toThrow("invalid-delivery-note");
  });
  it("captures catalog names/options and recipient data independently of later edits", async () => {
    const f = fixture();
    const address = {
      ...shippingAddress,
      firstName: "Customer",
      city: "Seoul",
      arbitraryPrivilege: true
    };
    const { snapshot } = await buildCheckoutSnapshot({
      ...f,
      currency: "KRW",
      shippingAddress: address
    });
    f.product.name = "Renamed";
    f.variant.options[0]!.label = "Changed";
    address.city = "Busan";
    expect(snapshot.items[0]).toMatchObject({
      product_name: "Object",
      sku: "SKU-1",
      options: [{ label: "Small" }]
    });
    expect(snapshot.shippingAddress).toEqual({
      ...shippingAddress,
      firstName: "Customer",
      city: "Seoul"
    });
    expect(snapshot).toMatchObject({
      shippingAmount: null,
      taxAmount: null,
      acceptedTerms: null
    });
    expect(f.find).toHaveBeenCalledTimes(2);
  });
  it("aggregates quantity limits across duplicate product lines", async () => {
    const f = fixture();
    f.cart.items = [f.cart.items![0]!, { ...f.cart.items![0]!, quantity: 3 }];
    f.cart.subtotal = 4800;
    await expect(
      buildCheckoutSnapshot({ ...f, currency: "KRW" })
    ).rejects.toThrow("quantity-above-max");
  });
  it.each(["request_to_order", "private_order", "unknown"])(
    "rejects unsupported mode %s",
    async (mode) => {
      const f = fixture();
      f.cart.items![0]!.mode = mode;
      await expect(
        buildCheckoutSnapshot({ ...f, currency: "KRW" })
      ).rejects.toThrow("unsupported-purchase-mode");
    }
  );
  it.each([0, -1, Infinity, 1.1, Number.MAX_SAFE_INTEGER + 1])(
    "rejects invalid price %s",
    async (price) => {
      const f = fixture();
      f.variant.priceInKRW = price;
      await expect(
        buildCheckoutSnapshot({ ...f, currency: "KRW" })
      ).rejects.toThrow();
    }
  );
  it("rejects disabled currency prices and line snapshots that disagree with the catalog", async () => {
    const f = fixture();
    f.variant.priceInKRWEnabled = false;
    await expect(
      buildCheckoutSnapshot({ ...f, currency: "KRW" })
    ).rejects.toThrow("currency-price-disabled");
    f.variant.priceInKRWEnabled = true;
    f.cart.items![0]!.unit_amount = 1;
    await expect(
      buildCheckoutSnapshot({ ...f, currency: "KRW" })
    ).rejects.toThrow("cart-total-changed");
  });
});

describe("physical checkout destination", () => {
  it.each([undefined, null])("requires a destination: %s", async (value) => {
    const f = fixture();
    await expect(
      buildCheckoutSnapshot({ ...f, currency: "KRW", shippingAddress: value })
    ).rejects.toThrow("shipping-address-required");
    expect(f.find).not.toHaveBeenCalled();
  });

  it.each([false, 1, "KR", [], {}])(
    "rejects malformed destination %j",
    async (value) => {
      await expect(
        buildCheckoutSnapshot({
          ...fixture(),
          currency: "KRW",
          shippingAddress: value
        })
      ).rejects.toThrow("invalid-shipping-address");
    }
  );

  it.each(["country", "firstName", "phone", "addressLine1", "postalCode"])(
    "requires a nonblank string %s",
    async (field) => {
      for (const value of [undefined, null, "", "  ", 1, false, [], {}]) {
        await expect(
          buildCheckoutSnapshot({
            ...fixture(),
            currency: "KRW",
            shippingAddress: { ...shippingAddress, [field]: value }
          })
        ).rejects.toThrow("invalid-shipping-address");
      }
    }
  );

  it.each(["US", "JP", "kr", "KOR"])(
    "rejects unsupported destination country %s",
    async (country) => {
      await expect(
        buildCheckoutSnapshot({
          ...fixture(),
          currency: "KRW",
          shippingAddress: { ...shippingAddress, country }
        })
      ).rejects.toThrow("unsupported-shipping-country");
    }
  );

  it.each([
    "firstName",
    "phone",
    "addressLine1",
    "postalCode",
    "addressLine2",
    "city",
    "country"
  ])("bounds and rejects control characters in %s", async (field) => {
    for (const value of [
      "x".repeat(501),
      "Seoul\u0000",
      "Seoul\n",
      "Seoul\t",
      "Seoul\u007f",
      "Seoul\u0085",
      7
    ]) {
      await expect(
        buildCheckoutSnapshot({
          ...fixture(),
          currency: "KRW",
          shippingAddress: { ...shippingAddress, [field]: value }
        })
      ).rejects.toThrow("invalid-shipping-address");
    }
  });

  it("normalizes a bounded independent destination while keeping foreign billing separate", async () => {
    const address = Object.freeze({
      ...shippingAddress,
      country: " KR ",
      firstName: "  김   서울 🏠 O'Reilly  ",
      addressLine1: "  서울시   중구 1  ",
      addressLine2: "  101동   202호 ",
      phone: " +82  10 1234 5678 ",
      postalCode: " 04524 ",
      ignored: { private: true }
    });
    const { snapshot } = await buildCheckoutSnapshot({
      ...fixture(),
      currency: "KRW",
      shippingAddress: address,
      billingAddress: {
        country: "US",
        firstName: "Billing",
        postalCode: "90210"
      }
    });
    expect(snapshot.shippingAddress).toEqual({
      ...shippingAddress,
      firstName: "김 서울 🏠 O'Reilly",
      addressLine2: "101동 202호"
    });
    expect(snapshot.shippingAddress).not.toBe(address);
    expect(address.country).toBe(" KR ");
    expect(snapshot.billingAddress).toEqual({
      country: "US",
      firstName: "Billing",
      postalCode: "90210"
    });
  });

  it("accepts the existing field bound and optional billing without inferring fees", async () => {
    const { snapshot } = await buildCheckoutSnapshot({
      ...fixture(),
      currency: "KRW",
      shippingAddress: {
        ...shippingAddress,
        firstName: "x".repeat(500),
        addressLine2: ""
      }
    });
    expect(snapshot.shippingAddress?.firstName).toHaveLength(500);
    expect(snapshot.billingAddress).toBeNull();
    expect(snapshot.shippingAmount).toBeNull();
    expect(snapshot.taxAmount).toBeNull();
  });

  it.each(["USD", "JPY", "EUR"])(
    "allows a KR destination with %s catalog pricing",
    async (currency) => {
      const f = fixture();
      const pricedVariant = {
        ...f.variant,
        [`priceIn${currency}`]: 1200,
        [`priceIn${currency}Enabled`]: true
      };
      f.find.mockImplementation(async ({ collection }) => ({
        docs: collection === "products" ? [f.product] : [pricedVariant]
      }));
      const { snapshot } = await buildCheckoutSnapshot({
        ...f,
        cart: { ...f.cart, currency },
        currency
      });
      expect(snapshot).toMatchObject({
        currency,
        amount: 1200,
        shippingAddress
      });
    }
  );
});
