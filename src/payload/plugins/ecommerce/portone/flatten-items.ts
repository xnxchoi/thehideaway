function relationId(value: unknown): unknown {
  if (value && typeof value === "object" && "id" in value) {
    return (value as { id?: unknown }).id;
  }
  return value;
}

export function flattenCartItems(
  items: readonly Record<string, unknown>[]
): Record<string, unknown>[] {
  return items.map((item) => {
    const { id: _id, product, variant, ...rest } = item;
    return {
      ...rest,
      product: relationId(product),
      quantity: item.quantity,
      ...(variant != null ? { variant: relationId(variant) } : {})
    };
  });
}
