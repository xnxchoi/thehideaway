import type { CartItemMatcher } from "@payloadcms/plugin-ecommerce";

const DEFAULT_MODE = "standard_purchase";

function field(item: object, key: string): unknown {
  return (item as Record<string, unknown>)[key];
}

function relationId(value: unknown): string | undefined {
  if (value == null) return undefined;
  if (typeof value === "string" || typeof value === "number") {
    const id = String(value).trim();
    return id.length > 0 ? id : undefined;
  }
  if (typeof value === "object" && "id" in value) {
    return relationId(value.id);
  }
  return undefined;
}

function modeOf(item: object): string {
  const mode = field(item, "mode");
  return typeof mode === "string" && mode.trim().length > 0
    ? mode.trim()
    : DEFAULT_MODE;
}

export function cartLinesMatch(
  existingItem: object,
  newItem: object
): boolean {
  return (
    relationId(field(existingItem, "product")) ===
      relationId(field(newItem, "product")) &&
    relationId(field(existingItem, "variant")) ===
      relationId(field(newItem, "variant")) &&
    modeOf(existingItem) === modeOf(newItem) &&
    relationId(field(existingItem, "campaign")) ===
      relationId(field(newItem, "campaign"))
  );
}

export const lostCartItemMatcher: CartItemMatcher = ({
  existingItem,
  newItem
}) => cartLinesMatch(existingItem, newItem);
