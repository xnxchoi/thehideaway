import { FooterTickerCrownClient } from "./FooterTickerCrown.client";
import type { FieldConfig } from "./field-config";

interface FooterTickerCrownProps {
  /** Override the default field configuration. */
  config?: Partial<FieldConfig>;
}

/**
 * Server-safe shell. The actual band is a client island — see
 * `FooterTickerCrown.client.tsx`. Future v2 may fetch Payload-driven config
 * here without touching call sites.
 */
export function FooterTickerCrown({ config }: FooterTickerCrownProps = {}) {
  return <FooterTickerCrownClient config={config} />;
}
