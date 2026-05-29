/**
 * Seed LOSTINSEOUL storefront products for local design/dev work.
 *
 * Usage: pnpm seed:lost-products
 *
 * This is intentionally a runtime dev fixture, not part of the initial
 * production seed migration. It creates repeatable categories, drops, media,
 * products, and one request-to-order campaign so product/detail flows have
 * real data to render against.
 */
import config from "@payload-config";
import { createHash } from "node:crypto";
import { access, mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { getPayload, type Payload } from "payload";
import sharp from "sharp";

import type {
  Media,
  Product,
  ProductCategory,
  ProductDrop
} from "@/payload-types";

type SeedProduct = {
  name: string;
  slug: string;
  categorySlug: string;
  dropSlug: string;
  summary: string;
  details: string;
  care: string;
  shipping_returns: string;
  currency: "KRW" | "USD";
  unit_amount: number;
  compare_at_amount?: number;
  stock_state: "in_stock" | "pre_order" | "on_request";
  inventory: number;
  max_order_quantity: number;
  standard_enabled: boolean;
  request_to_order_enabled: boolean;
  private_order_enabled: boolean;
  private_preset_price_enabled: boolean;
  private_unit_amount?: number;
  private_tier_gate: "anyone" | "resident" | "patron";
  sort: number;
  variants: Array<{
    id: string;
    sku: string;
    label: string;
    size?: string;
    color?: string;
    amount?: number;
    inventory?: number;
    stock_state?: "in_stock" | "pre_order" | "on_request";
  }>;
  palette: {
    a: string;
    b: string;
    c: string;
    d: string;
    ink: string;
  };
  campaign?: {
    title: string;
    minimum_commitments: number;
    maximum_commitments?: number;
    paid_commitments: number;
    progress_visibility: "hidden" | "percentage" | "count";
    refund_policy: string;
  };
};

type SeedAdmin = {
  id: string;
  email?: string | null;
  role?: string | null;
};

const CATEGORIES = [
  { name: "Objects", slug: "objects", sort: 10 },
  { name: "Editions", slug: "editions", sort: 20 },
  { name: "Wear", slug: "wear", sort: 30 }
] as const;

const DROPS = [
  {
    title: "Available Now",
    slug: "available-now",
    active: true,
    kicker: "Dispatch 01",
    lede: "Objects and editions ready for immediate checkout.",
    sort: 10
  },
  {
    title: "Editions",
    slug: "editions",
    active: true,
    kicker: "Small batches",
    lede: "Limited runs and request-to-order experiments.",
    sort: 20
  },
  {
    title: "Private Objects",
    slug: "private-objects",
    active: true,
    kicker: "By request",
    lede: "Quote-first pieces for members and direct clients.",
    sort: 30
  }
] as const;

const PRODUCTS: SeedProduct[] = [
  {
    name: "Parasol 0230",
    slug: "parasol-0230",
    categorySlug: "objects",
    dropSlug: "available-now",
    summary:
      "A compact desk object in blackened steel, milky acrylic, and a cold white lamp edge.",
    details:
      "Numbered LOSTINSEOUL object. Powder-coated frame, acrylic diffuser, replaceable warm-white module, and a low-profile cloth cable.",
    care: "Dust with a dry cloth. Keep acrylic away from alcohol cleaners. Indoor use only.",
    shipping_returns:
      "Ships from Seoul in 3-5 business days. Returns accepted only unused in original packaging.",
    currency: "KRW",
    unit_amount: 118_000,
    compare_at_amount: 142_000,
    stock_state: "in_stock",
    inventory: 8,
    max_order_quantity: 1,
    standard_enabled: true,
    request_to_order_enabled: false,
    private_order_enabled: true,
    private_preset_price_enabled: true,
    private_unit_amount: 168_000,
    private_tier_gate: "anyone",
    sort: 10,
    variants: [
      {
        id: "black-milk",
        sku: "LIS-PSL-0230-BM",
        label: "Black / Milk",
        color: "Black / Milk",
        inventory: 5,
        stock_state: "in_stock"
      },
      {
        id: "smoke-blue",
        sku: "LIS-PSL-0230-SB",
        label: "Smoke / Blue",
        color: "Smoke / Blue",
        inventory: 3,
        stock_state: "in_stock"
      }
    ],
    palette: {
      a: "#f4f1e8",
      b: "#0c0d10",
      c: "#6f7f9c",
      d: "#d8d0c0",
      ink: "#111111"
    }
  },
  {
    name: "Memory Tee",
    slug: "memory-tee",
    categorySlug: "wear",
    dropSlug: "editions",
    summary:
      "A heavyweight cotton tee with a small front mark and a large washed back print.",
    details:
      "245gsm cotton jersey, pigment-dyed black, screen print front and back. Cut boxy with a slightly dropped shoulder.",
    care: "Wash cold inside out. Hang dry. The print is designed to fade unevenly over time.",
    shipping_returns:
      "Request-to-order commitments charge upfront. Failed campaigns are refunded through the original payment route.",
    currency: "KRW",
    unit_amount: 72_000,
    stock_state: "pre_order",
    inventory: 0,
    max_order_quantity: 2,
    standard_enabled: false,
    request_to_order_enabled: true,
    private_order_enabled: true,
    private_preset_price_enabled: false,
    private_tier_gate: "resident",
    sort: 20,
    variants: [
      {
        id: "size-1",
        sku: "LIS-MEM-TEE-1",
        label: "Size 1",
        size: "1",
        stock_state: "pre_order"
      },
      {
        id: "size-2",
        sku: "LIS-MEM-TEE-2",
        label: "Size 2",
        size: "2",
        stock_state: "pre_order"
      }
    ],
    palette: {
      a: "#050505",
      b: "#e8e8e0",
      c: "#1d35ff",
      d: "#333333",
      ink: "#f6f6ef"
    },
    campaign: {
      title: "Memory Tee minimum run",
      minimum_commitments: 18,
      maximum_commitments: 42,
      paid_commitments: 9,
      progress_visibility: "count",
      refund_policy:
        "If the run misses its minimum by the deadline, paid commitments are refunded automatically where possible."
    }
  },
  {
    name: "Window Study 01",
    slug: "window-study-01",
    categorySlug: "editions",
    dropSlug: "available-now",
    summary:
      "A small archival print study from a Seoul interior, finished in cold black and pale light.",
    details:
      "Edition of 30. 210 x 297mm pigment print on matte archival stock, blind-stamped and numbered.",
    care: "Frame behind UV glass. Keep out of direct sunlight and humid rooms.",
    shipping_returns:
      "Flat-packed with board protection. Print editions are final sale once opened.",
    currency: "KRW",
    unit_amount: 64_000,
    stock_state: "in_stock",
    inventory: 18,
    max_order_quantity: 2,
    standard_enabled: true,
    request_to_order_enabled: false,
    private_order_enabled: false,
    private_preset_price_enabled: false,
    private_tier_gate: "anyone",
    sort: 30,
    variants: [
      {
        id: "edition",
        sku: "LIS-WIN-STUDY-01",
        label: "Numbered edition",
        inventory: 18,
        stock_state: "in_stock"
      }
    ],
    palette: {
      a: "#f6f4ee",
      b: "#b9b2a7",
      c: "#222222",
      d: "#8b9092",
      ink: "#101010"
    }
  },
  {
    name: "Private Room Bench",
    slug: "private-room-bench",
    categorySlug: "objects",
    dropSlug: "private-objects",
    summary:
      "A low steel bench, sized to the buyer's room and quoted after a short private brief.",
    details:
      "Made-to-order steel frame, smoked surface, and optional cable routing. Quote depends on dimensions and finish.",
    care: "Wipe with a soft dry cloth. Do not use abrasive pads or solvent cleaners.",
    shipping_returns:
      "Private-order furniture is quoted with delivery terms before payment. Custom work is non-returnable after approval.",
    currency: "KRW",
    unit_amount: 0,
    stock_state: "on_request",
    inventory: 0,
    max_order_quantity: 1,
    standard_enabled: false,
    request_to_order_enabled: false,
    private_order_enabled: true,
    private_preset_price_enabled: false,
    private_tier_gate: "patron",
    sort: 40,
    variants: [
      {
        id: "quote",
        sku: "LIS-PRB-QUOTE",
        label: "Quote required",
        stock_state: "on_request"
      }
    ],
    palette: {
      a: "#090909",
      b: "#2e3136",
      c: "#bfc3c7",
      d: "#151515",
      ink: "#f4f4f0"
    }
  }
];

const MEDIA_STATIC_DIR = path.resolve(process.cwd(), "public/media");

async function ensureAdminUser(payload: Payload): Promise<SeedAdmin> {
  const admins = await payload.find({
    collection: "users",
    depth: 0,
    limit: 1,
    overrideAccess: true,
    where: { role: { equals: "admin" } },
    select: { id: true, email: true, role: true } as never
  });
  const admin = admins.docs[0] as SeedAdmin | undefined;
  if (!admin?.id) {
    throw new Error("No admin user found. Run the initial seed first.");
  }
  return admin;
}

async function ensureCategory(
  payload: Payload,
  category: (typeof CATEGORIES)[number]
): Promise<ProductCategory> {
  const existing = await payload.find({
    collection: "product-category",
    depth: 0,
    limit: 1,
    overrideAccess: true,
    where: { slug: { equals: category.slug } }
  });
  if (existing.docs[0]) return existing.docs[0] as ProductCategory;

  return (await payload.create({
    collection: "product-category",
    overrideAccess: true,
    data: category
  })) as ProductCategory;
}

async function ensureDrop(
  payload: Payload,
  drop: (typeof DROPS)[number]
): Promise<ProductDrop> {
  const existing = await payload.find({
    collection: "product-drops",
    depth: 0,
    limit: 1,
    overrideAccess: true,
    where: { slug: { equals: drop.slug } }
  });
  if (existing.docs[0]) {
    return (await payload.update({
      collection: "product-drops",
      id: existing.docs[0].id,
      overrideAccess: true,
      data: drop
    })) as ProductDrop;
  }

  return (await payload.create({
    collection: "product-drops",
    overrideAccess: true,
    data: drop
  })) as ProductDrop;
}

function productImageSvg(product: SeedProduct, index: number) {
  const { a, b, c, d, ink } = product.palette;
  const label = product.name.toUpperCase();
  const tag = index === 0 ? "OBJECT" : index === 1 ? "DETAIL" : "GALLERY";
  const offset = index * 72;

  return `
    <svg xmlns="http://www.w3.org/2000/svg" width="1400" height="1800" viewBox="0 0 1400 1800">
      <defs>
        <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stop-color="${a}"/>
          <stop offset="0.48" stop-color="${b}"/>
          <stop offset="1" stop-color="${d}"/>
        </linearGradient>
        <filter id="grain">
          <feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves="3" stitchTiles="stitch"/>
          <feColorMatrix type="saturate" values="0"/>
          <feComponentTransfer>
            <feFuncA type="table" tableValues="0 0.13"/>
          </feComponentTransfer>
        </filter>
      </defs>
      <rect width="1400" height="1800" fill="url(#bg)"/>
      <rect width="1400" height="1800" filter="url(#grain)" opacity="0.55"/>
      <g opacity="0.72" fill="none" stroke="${c}" stroke-width="18">
        <path d="M${240 + offset} 218h${740 - offset}v${520 + offset}h-${560 - offset}z"/>
        <path d="M${100 + offset / 2} ${1040 - offset}c260-230 570-260 930-92"/>
        <path d="M${760 - offset} ${320 + offset}l350 260-500 350"/>
      </g>
      <g opacity="0.3" fill="${c}">
        <circle cx="${1040 - offset}" cy="${1190 + offset}" r="${180 - index * 20}"/>
        <rect x="${135 + offset}" y="${1250 - offset}" width="${520 - offset}" height="72" rx="4"/>
      </g>
      <g font-family="Arial, Helvetica, sans-serif" fill="${ink}">
        <text x="72" y="92" font-size="34" font-weight="700" letter-spacing="10">LOSTINSEOUL</text>
        <text x="72" y="1660" font-size="28" font-weight="700" letter-spacing="8">${tag}</text>
        <text x="72" y="1718" font-size="54" font-weight="700" letter-spacing="2">${label}</text>
      </g>
    </svg>
  `;
}

async function renderProductImage(product: SeedProduct, index: number) {
  const data = await sharp(Buffer.from(productImageSvg(product, index)))
    .webp({ quality: 88 })
    .toBuffer();
  const md5 = createHash("md5").update(data).digest("hex");
  return {
    data,
    mimetype: "image/webp",
    name: `lostinseoul-seed-${product.slug}-${index + 1}.webp`,
    size: data.length,
    md5
  };
}

async function fileExists(filePath: string) {
  return access(filePath)
    .then(() => true)
    .catch(() => false);
}

async function findSeedMedia(
  payload: Payload,
  product: SeedProduct,
  index: number
): Promise<Media | null> {
  const needle = `lostinseoul-seed-${product.slug}-${index + 1}.webp`;
  const result = await payload.find({
    collection: "media",
    depth: 0,
    limit: 100,
    overrideAccess: true,
    sort: "-createdAt",
    select: { id: true, filename: true, url: true, mimeType: true } as never
  });
  return (
    (result.docs as Media[]).find((doc) => doc.filename?.endsWith(needle)) ??
    null
  );
}

async function ensureProductMedia(
  payload: Payload,
  admin: SeedAdmin,
  product: SeedProduct,
  index: number
): Promise<string> {
  const existing = await findSeedMedia(payload, product, index);
  if (existing?.id) {
    if (existing.filename) {
      const filePath = path.join(MEDIA_STATIC_DIR, existing.filename);
      if (!(await fileExists(filePath))) {
        const file = await renderProductImage(product, index);
        await mkdir(MEDIA_STATIC_DIR, { recursive: true });
        await writeFile(filePath, file.data);
      }
    }
    return existing.id;
  }

  const file = await renderProductImage(product, index);
  const created = (await payload.create({
    collection: "media",
    overrideAccess: true,
    user: admin as never,
    req: {
      user: admin as never,
      data: { author: admin.id },
      file
    },
    file: file as never,
    data: {
      author: admin.id
    } as never
  })) as Media;
  return created.id;
}

async function ensureProduct(
  payload: Payload,
  product: SeedProduct,
  categoryId: string,
  dropId: string,
  mediaIds: string[]
): Promise<Product> {
  const data = {
    name: product.name,
    slug: product.slug,
    active: true,
    storefront: "lostinseoul",
    drop: dropId,
    category: categoryId,
    summary: product.summary,
    details: product.details,
    care: product.care,
    shipping_returns: product.shipping_returns,
    hero_media: mediaIds[0],
    gallery: mediaIds,
    currency: product.currency,
    unit_amount: product.unit_amount,
    compare_at_amount: product.compare_at_amount,
    stock_state: product.stock_state,
    inventory: product.inventory,
    max_order_quantity: product.max_order_quantity,
    min_order_quantity: 1,
    variants: product.variants,
    standard_enabled: product.standard_enabled,
    request_to_order_enabled: product.request_to_order_enabled,
    private_order_enabled: product.private_order_enabled,
    private_preset_price_enabled: product.private_preset_price_enabled,
    private_unit_amount: product.private_unit_amount,
    private_tier_gate: product.private_tier_gate,
    sort: product.sort
  };

  const existing = await payload.find({
    collection: "products",
    depth: 0,
    limit: 1,
    overrideAccess: true,
    where: { slug: { equals: product.slug } }
  });

  if (existing.docs[0]) {
    return (await payload.update({
      collection: "products",
      id: existing.docs[0].id,
      overrideAccess: true,
      data: data as never
    })) as Product;
  }

  return (await payload.create({
    collection: "products",
    overrideAccess: true,
    data: data as never
  })) as Product;
}

async function ensureCampaign(
  payload: Payload,
  product: SeedProduct,
  productId: string
) {
  if (!product.campaign) return null;

  const deadline = new Date();
  deadline.setDate(deadline.getDate() + 21);

  const data = {
    ...product.campaign,
    product: productId,
    state: "open",
    deadline: deadline.toISOString(),
    eligible_variants: product.variants.map((variant) => variant.id)
  };

  const existing = await payload.find({
    collection: "product-order-campaigns",
    depth: 0,
    limit: 1,
    overrideAccess: true,
    where: {
      and: [
        { product: { equals: productId } },
        { title: { equals: product.campaign.title } }
      ]
    }
  });

  if (existing.docs[0]) {
    return payload.update({
      collection: "product-order-campaigns",
      id: existing.docs[0].id,
      overrideAccess: true,
      data: data as never
    });
  }

  return payload.create({
    collection: "product-order-campaigns",
    overrideAccess: true,
    data: data as never
  });
}

async function main() {
  if (process.env.NODE_ENV === "production") {
    throw new Error("Refusing to seed LOSTINSEOUL dev products in production.");
  }

  const payload = await getPayload({ config });
  const admin = await ensureAdminUser(payload);

  const categories = new Map<string, ProductCategory>();
  for (const category of CATEGORIES) {
    const doc = await ensureCategory(payload, category);
    categories.set(category.slug, doc);
  }

  const drops = new Map<string, ProductDrop>();
  for (const drop of DROPS) {
    const doc = await ensureDrop(payload, drop);
    drops.set(drop.slug, doc);
  }

  for (const product of PRODUCTS) {
    const category = categories.get(product.categorySlug);
    const drop = drops.get(product.dropSlug);
    if (!category?.id || !drop?.id) {
      throw new Error(`Missing category/drop for ${product.slug}`);
    }

    const mediaIds = await Promise.all(
      [0, 1, 2].map((index) =>
        ensureProductMedia(payload, admin, product, index)
      )
    );
    const doc = await ensureProduct(
      payload,
      product,
      category.id,
      drop.id,
      mediaIds
    );
    await ensureCampaign(payload, product, doc.id);
    console.log(`[seed:lost-products] ready ${product.slug}`);
  }

  console.log("[seed:lost-products] done.");
  process.exit(0);
}

main().catch((err) => {
  console.error("[seed:lost-products] failed:", err);
  process.exit(1);
});
