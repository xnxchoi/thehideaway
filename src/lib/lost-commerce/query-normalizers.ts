import { catalogUnitAmount } from "@/payload/plugins/ecommerce/catalog-money";

type AnyDoc = Record<string, unknown>;

export type LostProductVariant = {
  id: string;
  sku?: string | null;
  label: string;
  size?: string | null;
  color?: string | null;
  amount?: number | null;
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
          options.find((option) => {
            const type = option.variantType;
            const typeName =
              typeof type === "string"
                ? type
                : nullableString((type as AnyDoc | null)?.name);
            return typeName?.trim().toLowerCase() === key;
          })?.label
        );
      const skuCode = nullableString(sku.sku);
      const id = stringValue(sku.id);
      const amount =
        catalogUnitAmount(sku) || catalogUnitAmount(product) || null;

      return {
        id,
        sku: skuCode,
        label: stringValue(sku.label) || skuCode || id,
        size: optionValue("size"),
        color: optionValue("color"),
        amount
      };
    })
    .filter((sku) => sku.id && sku.label);
}

export function normalizeLostDropCard(drop: AnyDoc): LostDropCard {
  return {
    title: stringValue(drop.title),
    slug: stringValue(drop.slug),
    kicker: nullableString(drop.kicker) ?? undefined,
    lede: nullableString(drop.lede) ?? undefined
  };
}
