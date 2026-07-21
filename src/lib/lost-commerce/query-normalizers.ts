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

export function normalizeLostProductSkus(
  product: AnyDoc,
  skus: unknown
): LostProductVariant[] {
  if (!Array.isArray(skus)) return [];

  return skus
    .filter(
      (sku): sku is AnyDoc =>
        Boolean(sku) && typeof sku === "object" && sku.active === true
    )
    .map((sku) => {
      const options = Array.isArray(sku.options)
        ? sku.options.filter(
            (option): option is AnyDoc =>
              Boolean(option) && typeof option === "object"
          )
        : [];
      const optionValue = (key: string) =>
        nullableString(
          options.find(
            (option) =>
              nullableString(option.key)?.trim().toLowerCase() === key
          )?.value
        );
      const skuCode = nullableString(sku.sku);
      const id = stringValue(sku.id);
      const amount =
        typeof sku.price_override_amount === "number"
          ? sku.price_override_amount
          : typeof product.unit_amount === "number"
            ? product.unit_amount
            : null;

      return {
        id,
        sku: skuCode,
        label: stringValue(sku.label) || skuCode || id,
        size: optionValue("size"),
        color: optionValue("color"),
        amount,
        inventory: typeof sku.inventory === "number" ? sku.inventory : null,
        stockState: nullableString(sku.stock_state)
      };
    })
    .filter((sku) => sku.id && sku.label);
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
