export function isManualPaymentEnabled(): boolean {
  return process.env.LOST_MANUAL_PAYMENT_LIVE === "true";
}
