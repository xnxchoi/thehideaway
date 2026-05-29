type AnyDoc = Record<string, unknown>;

export type LostProductVariant = {
  id: string;
  sku?: string | null;
  label: string;
  size?: string | null;
  color?: string | null;
  amount?: number | null;
  inventory?: number | null;
  stockState?: string | null;
};

export type LostDropCard = {
  title: string;
  slug: string;
  kicker?: string;
  lede?: string;
};

function stringValue(value: unknown, fallback = ""): string {
  return typeof value === "string" ? value : fallback;
}

function nullableString(value: unknown): string | null {
  return typeof value === "string" ? value : null;
}

export function normalizeLostProductVariants(
  product: AnyDoc
): LostProductVariant[] {
  if (!Array.isArray(product.variants)) return [];

  return product.variants
    .filter((variant): variant is AnyDoc => Boolean(variant))
    .map((variant) => {
      const label =
        stringValue(variant.label) ||
        stringValue(variant.size) ||
        stringValue(variant.color) ||
        stringValue(variant.id);

      return {
        id: stringValue(variant.id),
        sku: nullableString(variant.sku),
        label,
        size: nullableString(variant.size),
        color: nullableString(variant.color),
        amount: typeof variant.amount === "number" ? variant.amount : null,
        inventory:
          typeof variant.inventory === "number" ? variant.inventory : null,
        stockState: nullableString(variant.stock_state)
      };
    })
    .filter((variant) => variant.id && variant.label);
}

export function normalizeLostDropCard(drop: AnyDoc): LostDropCard {
  return {
    title: stringValue(drop.title),
    slug: stringValue(drop.slug),
    kicker: nullableString(drop.kicker) ?? undefined,
    lede: nullableString(drop.lede) ?? undefined
  };
}
