"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import s from "./styles.module.scss";

/**
 * Simplified view — week.wild.plus / athens-26 grade minimal card.
 *
 * One screen. Date, location, the two acts, dress-code synopsis, fee, RSVP.
 * Designed to be the "as the event approaches" view: zero friction, all the
 * load-bearing information without the immersive theatre.
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
        <p className={s.simplifiedEyebrow}>{t("subtitle")}</p>
        <h1 className={s.simplifiedTitle}>{t("title")}</h1>
        <p className={s.simplifiedSubtitle}>{t("tagline")}</p>

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
              {t("location.neighborhood")}
            </dd>
          </div>
          <div className={s.simplifiedMetaRow}>
            <dt className={s.simplifiedMetaLabel}>{t("entry.heading")}</dt>
            <dd className={s.simplifiedMetaValue}>
              {t("entry.amount")} · {t("entry.method")}
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
      </div>

      <footer className={s.simplifiedBottom}>
        <span>{t("footer.hosts")}</span>
        <span>{t("footer.rsvpClosesAt")}</span>
      </footer>
    </div>
  );
}
