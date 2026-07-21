import type { CollectionBeforeValidateHook } from "payload";

type StockLocationData = Record<string, unknown>;

function trimmedText(value: unknown): unknown {
  return typeof value === "string" ? value.trim() : value;
}

export const normalizeStockLocation: CollectionBeforeValidateHook = async ({
  data,
  operation,
  originalDoc
}) => {
  const incoming = (data ?? {}) as StockLocationData;
  const normalizedCode =
    typeof incoming.code === "string"
      ? incoming.code.trim().toUpperCase()
      : incoming.code;

  if (
    operation === "update" &&
    incoming.code !== undefined &&
    normalizedCode !==
      (typeof originalDoc?.code === "string"
        ? originalDoc.code.trim().toUpperCase()
        : originalDoc?.code)
  ) {
    throw new Error("stock-location-code-immutable");
  }

  return {
    ...incoming,
    ...(incoming.code === undefined ? {} : { code: normalizedCode }),
    ...(incoming.name === undefined ? {} : { name: trimmedText(incoming.name) })
  };
};
