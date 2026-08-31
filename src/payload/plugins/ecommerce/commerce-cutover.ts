type CommerceProductRow = {
  id: string;
  name: string;
  slug: string;
  active: boolean;
  unit_amount: number;
  max_quantity: number;
  summary?: unknown;
  description?: unknown;
  details?: unknown;
  care?: unknown;
  shipping_returns?: unknown;
  hero_media?: unknown;
  sort?: unknown;
};

type CommerceOrderRow = {
  id: string;
  ref: string;
  user: string;
  product: string;
  product_name_snapshot: string;
  product_slug_snapshot: string;
  quantity: number;
  unit_amount_snapshot: number;
  total_amount: number;
  currency: string;
  payment_method?: string;
  payment_status: string;
  status: string;
  contact?: unknown;
  shipping?: unknown;
  paid_at?: string | null;
};

const ORDER_STATUS_MAP = {
  awaiting_payment: {
    status: "processing",
    lifecycle_status: "pending_payment",
    payment_status: "unpaid",
    fulfillment_status: "unfulfilled"
  },
  paid: {
    status: "processing",
    lifecycle_status: "paid",
    payment_status: "paid",
    fulfillment_status: "reserved"
  },
  preparing: {
    status: "processing",
    lifecycle_status: "committed",
    payment_status: "paid",
    fulfillment_status: "in_production"
  },
  shipped: {
    status: "processing",
    lifecycle_status: "confirmed",
    payment_status: "paid",
    fulfillment_status: "fulfilled"
  },
  completed: {
    status: "completed",
    lifecycle_status: "converted",
    payment_status: "paid",
    fulfillment_status: "fulfilled"
  },
  canceled: {
    status: "cancelled",
    lifecycle_status: "canceled",
    payment_status: "unpaid",
    fulfillment_status: "canceled"
  }
} as const;

function contactEmail(contact: unknown): string | undefined {
  if (!contact || typeof contact !== "object" || Array.isArray(contact)) {
    return undefined;
  }
  const email = (contact as { email?: unknown }).email;
  return typeof email === "string" ? email : undefined;
}

function shippingText(
  shipping: unknown,
  keys: readonly string[]
): string | undefined {
  if (!shipping || typeof shipping !== "object" || Array.isArray(shipping)) {
    return undefined;
  }
  const record = shipping as Record<string, unknown>;
  for (const key of keys) {
    const value = record[key];
    if (typeof value === "string" && value.trim()) return value;
  }
  return undefined;
}

function pluginPaymentStatus(
  commerceStatus: string,
  mapped: (typeof ORDER_STATUS_MAP)[keyof typeof ORDER_STATUS_MAP]
): "unpaid" | "pending" | "paid" | "failed" {
  if (commerceStatus === "failed") return "failed";
  if (commerceStatus === "canceled") return "unpaid";
  if (commerceStatus === "paid") return "paid";
  if (mapped.payment_status === "paid") return "paid";
  if (mapped.payment_status === "unpaid") return "unpaid";
  return "pending";
}

function contactWithShipping(contact: unknown, shipping: unknown) {
  const base =
    contact && typeof contact === "object" && !Array.isArray(contact)
      ? { ...(contact as Record<string, unknown>) }
      : {};
  if (shipping && typeof shipping === "object") {
    return { ...base, shipping };
  }
  return Object.keys(base).length > 0 ? base : contact;
}

export function commerceProductToPlugin(row: CommerceProductRow) {
  const priced = Number.isSafeInteger(row.unit_amount) && row.unit_amount >= 1;
  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    active: row.active,
    storefront: "lostinseoul",
    summary: row.summary,
    description: row.description,
    details: row.details,
    care: row.care,
    shipping_returns: row.shipping_returns,
    hero_media: row.hero_media,
    sort: row.sort,
    priceInKRWEnabled: priced,
    priceInKRW: priced ? row.unit_amount : null,
    max_order_quantity: row.max_quantity,
    min_order_quantity: 1,
    standard_enabled: true,
    request_to_order_enabled: false,
    private_order_enabled: false,
    private_preset_price_enabled: false,
    private_tier_gate: "anyone" as const,
    enableVariants: false,
    _status: row.active ? ("published" as const) : ("draft" as const)
  };
}

export function commerceOrderToPlugin(row: CommerceOrderRow) {
  const mapped =
    ORDER_STATUS_MAP[row.status as keyof typeof ORDER_STATUS_MAP] ??
    ORDER_STATUS_MAP.awaiting_payment;
  return {
    id: row.id,
    customer: row.user,
    customerEmail: contactEmail(row.contact),
    amount: row.total_amount,
    currency: row.currency,
    status: mapped.status,
    order_ref: row.ref,
    order_mode: "standard_purchase" as const,
    lifecycle_status: mapped.lifecycle_status,
    payment_status: pluginPaymentStatus(row.payment_status, mapped),
    fulfillment_status: mapped.fulfillment_status,
    contact: contactWithShipping(row.contact, row.shipping),
    shippingAddress: {
      title: shippingText(row.shipping, ["title"]),
      firstName: shippingText(row.shipping, ["firstName", "first_name"]),
      lastName: shippingText(row.shipping, ["lastName", "last_name"]),
      company: shippingText(row.shipping, ["company"]),
      addressLine1: shippingText(row.shipping, [
        "addressLine1",
        "address_line1",
        "address"
      ]),
      addressLine2: shippingText(row.shipping, [
        "addressLine2",
        "address_line2"
      ]),
      city: shippingText(row.shipping, ["city"]),
      state: shippingText(row.shipping, ["state"]),
      postalCode: shippingText(row.shipping, [
        "postalCode",
        "postal_code",
        "zip"
      ]),
      country: shippingText(row.shipping, ["country"]),
      phone: shippingText(row.shipping, ["phone"])
    },
    paid_at: row.paid_at,
    line_snapshot_version: 3,
    items: [
      {
        product: row.product,
        quantity: row.quantity,
        mode: "standard_purchase" as const,
        product_name: row.product_name_snapshot,
        product_slug: row.product_slug_snapshot,
        currency: row.currency,
        unit_amount: row.unit_amount_snapshot,
        line_amount: row.total_amount
      }
    ]
  };
}
