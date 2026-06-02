import { getTranslations } from "next-intl/server";
import s from "./Pricing.module.scss";

/**
 * CofounderApply — application-only, not a public SKU. Keep the surface sparse:
 * a short invitation, one explanatory line, and a mailto CTA.
 */
export async function CofounderApply() {
  const t = await getTranslations("Plans.cofounder");
  const mailto = `mailto:concierge@hideawayseoul.com?subject=${encodeURIComponent(
    t("subject")
  )}`;

  return (
    <section aria-labelledby="cofounder-apply" className={s.cofounderApply}>
      <p className={s.eyebrow}>{t("eyebrow")}</p>
      <h2 id="cofounder-apply" className={s.cofounderTitle}>
        {t("title")}
      </h2>
      <p className={s.cofounderText}>{t("body")}</p>
      {/* Plain <a>, not the project's <Link>: the custom Link runs through
          next-transition-router's click handler, which fires page-transition
          state for non-anchor hrefs regardless of scheme. For mailto: that
          state never resets because no navigation actually happens. */}
      <a href={mailto} className={s.cofounderCta} rel="noopener noreferrer">
        {t("cta")}
      </a>
    </section>
  );
}
