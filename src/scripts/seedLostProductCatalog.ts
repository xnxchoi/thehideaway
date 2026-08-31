const unavailableDraft = {
  active: false,
  priceInKRWEnabled: false,
  standard_enabled: false,
  request_to_order_enabled: false,
  private_order_enabled: false,
  private_preset_price_enabled: false,
  private_tier_gate: "anyone" as const,
  min_order_quantity: 1,
  max_order_quantity: 1
};

export const LOST_FRAGRANCE_SEED_PRODUCTS = [
  {
    ...unavailableDraft,
    name: "CATALYST 50 ml",
    slug: "catalyst-50ml",
    summary: "50 ml fragrance.",
    confirmedSize: "50 ml",
    limited: false,
    sort: 10
  },
  {
    ...unavailableDraft,
    name: "CATALYST 100 ml",
    slug: "catalyst-100ml-limited",
    summary: "100 ml fragrance. Limited availability.",
    confirmedSize: "100 ml",
    limited: true,
    sort: 20
  },
  {
    ...unavailableDraft,
    name: "CATALYST Travel Kit",
    slug: "catalyst-travel-kit",
    summary: "Travel kit.",
    confirmedSize: null,
    limited: false,
    sort: 30
  }
] as const;
