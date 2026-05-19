"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";

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
    <div className="min-h-dvh grid grid-rows-[auto_1fr_auto] content-start p-6 gap-6 md:grid-rows-[1fr_auto_1fr] md:content-stretch md:p-10 md:gap-8">
      <header className="font-mono text-[10px] tracking-[0.2em] uppercase text-[var(--dn-fg-faint)] flex items-start justify-between gap-4">
        <span>
          {t("date.short")} · {t("location.neighborhood")}
        </span>
        <span>{t("date.weekday")}</span>
      </header>

      <div className="grid gap-[14px] max-w-[720px] md:gap-[18px] md:max-w-[880px]">
        <p className="font-mono text-[11px] tracking-[0.22em] uppercase text-[var(--dn-fg-mute)]">
          {t("opening.kicker")}
        </p>
        <h1 className="font-serif font-bold text-[clamp(3.2rem,9vw,8rem)] tracking-[-0.02em] leading-[0.92] text-[var(--dn-fg)]">
          {t("title")}
        </h1>
        <p className="text-[clamp(1.4rem,2vw,1.9rem)] font-light tracking-[-0.01em] text-[var(--dn-fg-mute)] leading-[1.35] max-w-[50ch]">
          {t("opening.lede")}
        </p>

        <dl className="mt-3 grid grid-cols-1 gap-1 font-mono text-xs text-[var(--dn-fg-mute)] leading-[1.6] md:grid-cols-2 md:max-w-[540px] md:gap-x-6 md:gap-y-1.5">
          <div className="grid grid-cols-[72px_1fr] gap-[14px] items-baseline">
            <dt className="text-[var(--dn-fg-faint)] tracking-[0.18em] uppercase text-[10px] self-start pt-0.5">
              {t("act.day.label")}
            </dt>
            <dd className="flex flex-col text-[13px] tracking-normal text-[var(--dn-fg)]">
              {t("act.day.time")}
            </dd>
          </div>
          <div className="grid grid-cols-[72px_1fr] gap-[14px] items-baseline">
            <dt className="text-[var(--dn-fg-faint)] tracking-[0.18em] uppercase text-[10px] self-start pt-0.5">
              {t("act.night.label")}
            </dt>
            <dd className="flex flex-col text-[13px] tracking-normal text-[var(--dn-fg)]">
              {t("act.night.time")}
            </dd>
          </div>
          <div className="grid grid-cols-[72px_1fr] gap-[14px] items-baseline">
            <dt className="text-[var(--dn-fg-faint)] tracking-[0.18em] uppercase text-[10px] self-start pt-0.5">
              {t("location.label")}
            </dt>
            <dd className="flex flex-col text-[13px] tracking-normal text-[var(--dn-fg)]">
              <span>{t("location.neighborhood")}</span>
              <span className="block mt-1 text-[10.5px] text-[var(--dn-fg-faint)] tracking-[0.06em]">
                {t("location.address")}
              </span>
            </dd>
          </div>
          <div className="grid grid-cols-[72px_1fr] gap-[14px] items-baseline">
            <dt className="text-[var(--dn-fg-faint)] tracking-[0.18em] uppercase text-[10px] self-start pt-0.5">
              {t("entry.heading")}
            </dt>
            <dd className="flex flex-col text-[13px] tracking-normal text-[var(--dn-fg)]">
              <span>{t("entry.amount")}</span>
              <span className="block mt-1 text-[10.5px] text-[var(--dn-fg-faint)] tracking-[0.06em]">
                {t("entry.perGuest")} · {t("entry.method")}
              </span>
            </dd>
          </div>
        </dl>

        <div className="mt-6 flex flex-col items-start gap-[10px] self-start md:flex-row md:items-center md:gap-4">
          <Link
            href="/tickets/day-n-night"
            className="inline-flex items-center gap-[14px] px-[26px] py-[14px] border border-[var(--dn-fg)] bg-[var(--dn-fg)] text-[var(--dn-bg)] font-mono text-[11px] tracking-[0.22em] uppercase no-underline transition-[background,color] duration-[250ms] ease hover:bg-transparent hover:text-[var(--dn-fg)]"
          >
            <span>{t("rsvpCta.primary")}</span>
            <span aria-hidden>→</span>
          </Link>
          <span className="font-mono text-[10px] tracking-[0.18em] uppercase text-[var(--dn-fg-faint)]">
            {t("rsvpCta.secondary")}
          </span>
        </div>

        <p className="mt-7 max-w-[38ch] font-serif italic text-[clamp(1.05rem,1.2vw,1.25rem)] leading-[1.4] text-[var(--dn-fg-mute)]">
          {t("closing.lede")}
        </p>
      </div>

      <footer className="font-mono text-[10px] tracking-[0.2em] uppercase text-[var(--dn-fg-faint)] flex items-end justify-between gap-4">
        <span>{t("footer.hosts")}</span>
        <span>{t("footer.rsvpClosesAt")}</span>
      </footer>
    </div>
  );
}
