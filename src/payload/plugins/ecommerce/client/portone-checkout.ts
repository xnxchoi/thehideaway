function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

export function pluginPortOnePaymentId(result: unknown): string | null {
  if (!isRecord(result)) return null;
  return typeof result.paymentId === "string" && result.paymentId.trim()
    ? result.paymentId
    : null;
}

export function pluginPortOneClientPayload(
  result: unknown
): Record<string, unknown> | null {
  if (!isRecord(result) || !isRecord(result.clientPayload)) return null;
  return result.clientPayload;
}

export function pluginConfirmOrderRef(result: unknown): string | null {
  if (!isRecord(result)) return null;
  if (typeof result.order_ref === "string" && result.order_ref.trim()) {
    return result.order_ref;
  }
  return null;
}
