export type LostLaunchFulfillment = "stock" | "preorder";

export type LostLaunchProduct = {
  slug: string;
  name: string;
  category: {
    name: string;
    slug: string;
  };
  summary: string;
  details: string;
  shippingReturns: string;
  currency: "KRW";
  unitAmount: number;
  fulfillment: LostLaunchFulfillment;
  availableQuantity: number | null;
  sku: string;
  heroAsset: string | null;
  galleryAssets: readonly string[];
  sort: number;
};

export const LOST_LAUNCH_PRODUCTS = [
  {
    slug: "damaged-love-the-damaged",
    name: "Damaged Love the Damaged",
    category: { name: "Apparel", slug: "apparel" },
    summary: "Custom-work LOSTINSEOUL hoodie. Five available.",
    details:
      "Navy hoodie with a front LOSTINSEOUL wordmark and custom back artwork.",
    shippingReturns:
      "Free shipping. Production and dispatch timing is confirmed before production begins. Cancellation is accepted until production begins. After production begins, change-of-mind returns may be restricted for custom-made work, subject to applicable law. Defects and misdelivery remain covered.",
    currency: "KRW",
    unitAmount: 249000,
    fulfillment: "stock",
    availableQuantity: 5,
    sku: "LIS-HOODIE-DLTD",
    heroAsset:
      "public/assets/lostinseoul/products/damaged-love-the-damaged/damaged-love-the-damaged-front.webp",
    galleryAssets: [
      "public/assets/lostinseoul/products/damaged-love-the-damaged/damaged-love-the-damaged-front.webp",
      "public/assets/lostinseoul/products/damaged-love-the-damaged/damaged-love-the-damaged-back.webp"
    ],
    sort: 10
  },
  {
    slug: "de-seoul",
    name: "De S\u00e9oul",
    category: { name: "Accessories", slug: "accessories" },
    summary: "De S\u00e9oul cap. Pre-order.",
    details: "Navy cap with De S\u00e9oul embroidery.",
    shippingReturns:
      "Free shipping. Production and dispatch timing is confirmed before production begins. Cancellation is accepted until production begins. After production begins, change-of-mind returns may be restricted for custom-made work, subject to applicable law. Defects and misdelivery remain covered.",
    currency: "KRW",
    unitAmount: 129000,
    fulfillment: "preorder",
    availableQuantity: null,
    sku: "LIS-CAP-DE-SEOUL",
    heroAsset: "public/assets/lostinseoul/products/de-seoul/de-seoul.webp",
    galleryAssets: [
      "public/assets/lostinseoul/products/de-seoul/de-seoul.webp"
    ],
    sort: 20
  },
  {
    slug: "catalyst",
    name: "Catalyst",
    category: { name: "Fragrance", slug: "fragrance" },
    summary: "Catalyst perfume. Pre-order.",
    details: "LOSTINSEOUL Catalyst perfume bottle.",
    shippingReturns:
      "Return requests are accepted within seven days of receipt. Opened or used fragrance may be restricted where permitted by law. Defects and misdelivery remain covered.",
    currency: "KRW",
    unitAmount: 48000,
    fulfillment: "preorder",
    availableQuantity: null,
    sku: "LIS-FRAGRANCE-CATALYST",
    heroAsset: null,
    galleryAssets: [],
    sort: 30
  }
] as const satisfies readonly LostLaunchProduct[];
