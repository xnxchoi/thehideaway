"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import s from "./styles.module.scss";

/**
 * Simplified view — editorial card mode.
 *
 * One screen. Date, location + address, the two windows (day → grill /
 * night → cocktails), entry block, RSVP. Designed for the "I just want
 * the facts" reader and for screens too small for the horizontal scene.
 *
 * Composition shift from the immersive view: where the scene is sprawl
 * and theatrics, the card is tight typography on a single column. Every
 * line earns its place — no decorative chrome, no parallax. The brand
 * voice still carries via the kicker ("30 & Smokin'") and the closing
 * line, but the visual register is restrained.
 */
export function SimplifiedView() {
  const t = useTranslations("Event.DayNNight");

  return (
    <div className={s.simplified}>
      <header className={s.simplifiedTop}>
        <span>
          {t("date.short")} · {t("location.neighborhood")}
        </span>
        <span>{t("date.weekday")}</span>
      </header>

      <div className={s.simplifiedCenter}>
        <p className={s.simplifiedEyebrow}>{t("opening.kicker")}</p>
        <h1 className={s.simplifiedTitle}>{t("title")}</h1>
        <p className={s.simplifiedSubtitle}>{t("opening.lede")}</p>

        <dl className={s.simplifiedMeta}>
          <div className={s.simplifiedMetaRow}>
            <dt className={s.simplifiedMetaLabel}>{t("act.day.label")}</dt>
            <dd className={s.simplifiedMetaValue}>{t("act.day.time")}</dd>
          </div>
          <div className={s.simplifiedMetaRow}>
            <dt className={s.simplifiedMetaLabel}>{t("act.night.label")}</dt>
            <dd className={s.simplifiedMetaValue}>{t("act.night.time")}</dd>
          </div>
          <div className={s.simplifiedMetaRow}>
            <dt className={s.simplifiedMetaLabel}>{t("location.label")}</dt>
            <dd className={s.simplifiedMetaValue}>
              <span>{t("location.neighborhood")}</span>
              <span className={s.simplifiedMetaValueSub}>
                {t("location.address")}
              </span>
            </dd>
          </div>
          <div className={s.simplifiedMetaRow}>
            <dt className={s.simplifiedMetaLabel}>{t("entry.heading")}</dt>
            <dd className={s.simplifiedMetaValue}>
              <span>{t("entry.amount")}</span>
              <span className={s.simplifiedMetaValueSub}>
                {t("entry.perGuest")} · {t("entry.method")}
              </span>
            </dd>
          </div>
        </dl>

        <div className={s.simplifiedCta}>
          <Link href="/tickets/day-n-night" className={s.ctaPrimary}>
            <span>{t("rsvpCta.primary")}</span>
            <span aria-hidden>→</span>
          </Link>
          <span className={s.ctaSecondary}>{t("rsvpCta.secondary")}</span>
        </div>

        <p className={s.simplifiedClosing}>{t("closing.lede")}</p>
      </div>

      <footer className={s.simplifiedBottom}>
        <span>{t("footer.hosts")}</span>
        <span>{t("footer.rsvpClosesAt")}</span>
      </footer>
    </div>
  );
}
