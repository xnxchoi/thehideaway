type NodeEnvironment = "development" | "production" | "test";

export function isLostCommercePaymentPreviewEnabled(
  env: { NODE_ENV?: NodeEnvironment } = process.env
): boolean {
  return env.NODE_ENV === "development";
}

export function isLostCommercePaymentUiEnabled({
  configured,
  previewEnabled
}: {
  configured: boolean;
  previewEnabled: boolean;
}): boolean {
  return configured || previewEnabled;
}

export function shouldExecuteLostCommercePayment({
  paymentPreviewEnabled,
  paymentProvider,
  portOneEnabled
}: {
  paymentPreviewEnabled: boolean;
  paymentProvider: "portone" | "manual";
  portOneEnabled: boolean;
}): boolean {
  return !(
    paymentProvider === "portone" &&
    paymentPreviewEnabled &&
    !portOneEnabled
  );
}
