import {
  getPortOneConfig,
  type PortOneConfig
} from "@/lib/lost-commerce/portone";

function isConfigured(value: string | undefined): value is string {
  const trimmed = value?.trim();
  return Boolean(
    trimmed && trimmed.length > 0 && !trimmed.startsWith("CHANGE_ME")
  );
}

export function isMinimalCommerceCardReady(
  config: PortOneConfig = getPortOneConfig(),
  nodeEnvironment: string | undefined = process.env.NODE_ENV
): boolean {
  const hasChannel =
    isConfigured(config.channelKey) || isConfigured(config.defaultChannel);
  const hasSecureWebhook =
    isConfigured(config.webhookSecret) &&
    config.webhookSecret.trim().length >= 32;
  const providerModeReady =
    nodeEnvironment !== "production" || config.environment === "live";

  return Boolean(
    config.cardCheckoutLive &&
    isConfigured(config.storeId) &&
    hasChannel &&
    isConfigured(config.apiSecret) &&
    hasSecureWebhook &&
    providerModeReady
  );
}
