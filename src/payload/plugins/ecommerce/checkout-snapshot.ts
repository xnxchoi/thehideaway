import type { PayloadRequest } from "payload";

import { CART_LINE_SCHEMA_VERSION } from "./lost-line-fields";
import { hideawayProductsValidation } from "./products-validation";

type RecordData = Record<string, unknown>;
export class CheckoutSnapshotError extends Error {}
export type CheckoutCart = RecordData & {
  id: string;
  items?: RecordData[];
  subtotal?: unknown;
};

export function checkoutRelationID(value: unknown): string | undefined {
  const id =
    value && typeof value === "object" ? (value as RecordData).id : value;
  return typeof id === "string" && id.length > 0 ? id : undefined;
}

function addressSnapshot(value: unknown): RecordData | null {
  if (value == null) return null;
  if (typeof value !== "object" || Array.isArray(value))
    throw new CheckoutSnapshotError("invalid-address");
  const allowed = [
    "firstName",
    "lastName",
    "company",
    "addressLine1",
    "addressLine2",
    "city",
    "state",
    "postalCode",
    "country",
    "phone",
    "title"
  ];
  return Object.fromEntries(
    allowed.flatMap((key) => {
      const field = (value as RecordData)[key];
      if (field == null) return [];
      if (typeof field !== "string" || field.length > 500)
        throw new CheckoutSnapshotError("invalid-address");
      return [[key, field.trim()]];
    })
  );
}

async function snapshotLine(
  item: RecordData,
  currency: string,
  catalog: { products: RecordData[]; variants: RecordData[] },
  totals: Map<string, number>
) {
  const productID = checkoutRelationID(item.product);
  const variantID = checkoutRelationID(item.variant);
  if (!productID || (item.variant != null && !variantID))
    throw new CheckoutSnapshotError("invalid-cart-line");
  if (!Number.isSafeInteger(item.quantity) || Number(item.quantity) < 1)
    throw new CheckoutSnapshotError("invalid-cart-quantity");
  if (
    (item.mode ?? "standard_purchase") !== "standard_purchase" ||
    item.campaign
  )
    throw new CheckoutSnapshotError("unsupported-purchase-mode");
  const product = catalog.products.find((record) => record.id === productID);
  const variant = variantID
    ? catalog.variants.find((record) => record.id === variantID)
    : undefined;
  if (!product || (variantID && !variant))
    throw new CheckoutSnapshotError("catalog-item-unavailable");
  if (product.standard_enabled !== true)
    throw new CheckoutSnapshotError("purchase-mode-disabled");
  if (variant && checkoutRelationID(variant.product) !== productID)
    throw new CheckoutSnapshotError("variant-product-mismatch");
  if (product.enableVariants === true && !variant)
    throw new CheckoutSnapshotError("variant-required");
  if (variant && product.enableVariants !== true)
    throw new CheckoutSnapshotError("variants-disabled");
  const totalQuantity = totals.get(productID);
  if (totalQuantity == null)
    throw new CheckoutSnapshotError("invalid-cart-quantity");
  try {
    await hideawayProductsValidation({
      currency,
      product: product as never,
      variant: variant as never,
      quantity: totalQuantity,
      currenciesConfig: { defaultCurrency: "KRW", supportedCurrencies: [] }
    });
  } catch (error) {
    throw new CheckoutSnapshotError(
      error instanceof Error ? error.message : "catalog-item-unavailable"
    );
  }
  const quantity = item.quantity as number;
  const priced = variant ?? product;
  const unitAmount = priced[`priceIn${currency}`] as number;
  const lineAmount = unitAmount * quantity;
  if (!Number.isSafeInteger(lineAmount))
    throw new CheckoutSnapshotError("invalid-cart-amount");
  if (
    (item.unit_amount != null && item.unit_amount !== unitAmount) ||
    (item.line_amount != null && item.line_amount !== lineAmount) ||
    (item.currency != null && item.currency !== currency)
  )
    throw new CheckoutSnapshotError("cart-total-changed");
  const options = Array.isArray(variant?.options)
    ? variant.options.map((option: unknown) => {
        if (!option || typeof option !== "object")
          throw new CheckoutSnapshotError("variant-options-unresolved");
        const record = option as RecordData;
        return {
          id: checkoutRelationID(record),
          label: record.label,
          value: record.value
        };
      })
    : [];
  return {
    product: productID,
    ...(variantID ? { variant: variantID } : {}),
    quantity,
    mode: "standard_purchase" as const,
    schema_version: CART_LINE_SCHEMA_VERSION,
    product_name: product.name,
    product_slug: product.slug,
    sku: variant?.sku ?? null,
    sku_label: variant?.label ?? null,
    options,
    currency,
    unit_amount: unitAmount,
    line_amount: lineAmount
  };
}

/** Catalog-derived JSON, independent of mutable profile/catalog documents. */
export async function buildCheckoutSnapshot({
  req,
  cart,
  currency,
  billingAddress,
  shippingAddress,
  deliveryNote
}: {
  req: PayloadRequest;
  cart: CheckoutCart;
  currency: string;
  billingAddress?: unknown;
  shippingAddress?: unknown;
  deliveryNote?: unknown;
}) {
  if (
    deliveryNote != null &&
    (typeof deliveryNote !== "string" || deliveryNote.length > 2000)
  )
    throw new CheckoutSnapshotError("invalid-delivery-note");
  if (!["KRW", "USD", "JPY", "EUR"].includes(currency))
    throw new CheckoutSnapshotError("unsupported-currency");
  if (cart.currency !== currency)
    throw new CheckoutSnapshotError("cart-currency-mismatch");
  if (
    !Array.isArray(cart.items) ||
    cart.items.length === 0 ||
    cart.items.length > 100
  )
    throw new CheckoutSnapshotError("invalid-cart-lines");
  const productIDs = [
    ...new Set(
      cart.items
        .map((item) => checkoutRelationID(item.product))
        .filter((id): id is string => Boolean(id))
    )
  ];
  const variantIDs = [
    ...new Set(
      cart.items
        .map((item) => checkoutRelationID(item.variant))
        .filter((id): id is string => Boolean(id))
    )
  ];
  const priceFields = {
    [`priceIn${currency}`]: true,
    [`priceIn${currency}Enabled`]: true
  };
  const [products, variants] = await Promise.all([
    req.payload.find({
      collection: "products",
      req,
      depth: 0,
      overrideAccess: true,
      pagination: false,
      where: { id: { in: productIDs } },
      select: {
        id: true,
        name: true,
        slug: true,
        active: true,
        _status: true,
        standard_enabled: true,
        enableVariants: true,
        min_order_quantity: true,
        max_order_quantity: true,
        ...priceFields
      }
    }),
    variantIDs.length
      ? req.payload.find({
          collection: "variants",
          req,
          depth: 1,
          overrideAccess: true,
          pagination: false,
          where: { id: { in: variantIDs } },
          select: {
            id: true,
            product: true,
            active: true,
            _status: true,
            sku: true,
            label: true,
            options: true,
            ...priceFields
          }
        })
      : Promise.resolve({ docs: [] })
  ]);
  const catalog = {
    products: products.docs as unknown as RecordData[],
    variants: variants.docs as unknown as RecordData[]
  };
  const totals = new Map(
    productIDs.map((id) => [
      id,
      cart
        .items!.filter((item) => checkoutRelationID(item.product) === id)
        .reduce((sum, item) => sum + Number(item.quantity), 0)
    ])
  );
  const items = [];
  for (const item of cart.items)
    items.push(await snapshotLine(item, currency, catalog, totals));
  const amount = items.reduce((total, item) => total + item.line_amount, 0);
  if (!Number.isSafeInteger(amount) || amount <= 0)
    throw new CheckoutSnapshotError("invalid-cart-amount");
  if (cart.subtotal !== amount)
    throw new CheckoutSnapshotError("cart-total-changed");
  const snapshot = {
    version: 1,
    // This adapter accepts tangible merchandise only. Ticket and membership
    // purchases have separate services; client/cart hints cannot classify them.
    fulfillmentKind: "physical" as const,
    cartID: cart.id,
    currency,
    amount,
    items,
    billingAddress: addressSnapshot(billingAddress),
    shippingAddress: addressSnapshot(shippingAddress),
    deliveryNote: typeof deliveryNote === "string" ? deliveryNote.trim() : null,
    shippingAmount: null,
    taxAmount: null,
    acceptedTerms: null
  };
  return { cart: { ...cart, items, subtotal: amount }, snapshot };
}
