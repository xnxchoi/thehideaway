export function priceFieldName(currency: string): string {
  return `priceIn${currency.toUpperCase()}`;
}

export function catalogUnitAmount(
  doc: Readonly<Record<string, unknown>> | null | undefined,
  currency = "KRW"
): number {
  if (!doc) return 0;
  const field = priceFieldName(currency);
  if (doc[`${field}Enabled`] === false) return 0;
  const value = doc[field];
  return typeof value === "number" && Number.isSafeInteger(value) && value >= 1
    ? value
    : 0;
}
