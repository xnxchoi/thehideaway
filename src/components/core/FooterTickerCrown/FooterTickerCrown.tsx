import { FooterTickerCrownClient } from "./FooterTickerCrown.client";
import type { RougeAccentVariant } from "./RougeAccent";

interface FooterTickerCrownProps {
  /**
   * Which rouge accent placement to use. Default "triangle".
   * Pass "none" while we evaluate alternatives.
   */
  rougeVariant?: RougeAccentVariant;
}

/**
 * Server-safe shell. The actual band is a client island — see
 * `FooterTickerCrown.client.tsx`. Future v2 may fetch Payload-driven config
 * here without touching call sites.
 */
export function FooterTickerCrown({
  rougeVariant = "triangle"
}: FooterTickerCrownProps) {
  return <FooterTickerCrownClient rougeVariant={rougeVariant} />;
}
