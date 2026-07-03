import { getTranslations } from "next-intl/server";
import { Link } from "@/components/core/Link/Link";
import s from "@/components/sections/Pricing/Pricing.module.scss";

/**
 * Digital-goods commerce info for the plans checkout: refund policy only
 * (memberships are digital access — no delivery/exchange), linking `/refund`.
 * PG review requires per-product refund info reachable on the payment page.
 * Copy is fully i18n via `Plans.commerce`.
 */
export async function CheckoutRefundInfo() {
  const t = await getTranslations("Plans.commerce");
  return (
    <section
      aria-label={t("title")}
      style={{
        border: "1px solid var(--pricing-line)",
        borderRadius: 10,
        padding: 24,
        marginTop: 32
      }}
    >
      <p className={s.eyebrow} style={{ marginBottom: 10 }}>
        {t("eyebrow")}
      </p>
      <h2
        style={{
          fontSize: 16,
          fontWeight: 400,
          margin: "0 0 10px",
          color: "var(--pricing-fg)"
        }}
      >
        {t("title")}
      </h2>
      <p
        style={{
          fontSize: 13,
          lineHeight: 1.7,
          color: "var(--pricing-fg-mute)",
          margin: "0 0 14px"
        }}
      >
        {t("body")}
      </p>
      <Link
        href="/refund"
        style={{
          fontSize: 13,
          color: "var(--pricing-fg)",
          textDecoration: "underline",
          textUnderlineOffset: "0.3em"
        }}
      >
        {t("link")}
      </Link>
    </section>
  );
}
