"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";

/**
 * Survival Kit — Phase 5a P5a-Product-1.
 *
 * Composition v2: three visual clusters separated by hairline dividers,
 * not a uniform dl table. The audit's user-lens identified this block
 * as needing distinct visual identity (the prior dl-row v1 read as a
 * form). The current layout treats the kit as a private dossier:
 *
 *   ┌──────────────────────────────────────────────────────┐
 *   │  Eyebrow                                             │
 *   │  Heading                                             │
 *   │  ─────────────────────────────────────────────       │
 *   │  WHERE                                               │
 *   │  Sowol-ro 20-gil 64, 3F                              │
 *   │  → Open map · Copy address                           │
 *   │                                                      │
 *   │  PAY                                                 │
 *   │  Toss Bank · 1002-5436-0906                          │
 *   │  65,000 KRW · Copy account                           │
 *   │  ─────────────────────────────────────────────       │
 *   │  WEAR    Dressy. Comfortable. A little brave.        │
 *   │  +1S     Reserved guests only.                       │
 *   │  LATE    Doors open until 21:00.                     │
 *   │  ─────────────────────────────────────────────       │
 *   │  ASK     concierge@hideawayseoul.com →               │
 *   └──────────────────────────────────────────────────────┘
 *
 * Cluster 1 — Logistics (Where, Pay): actions visible, larger values.
 * Cluster 2 — Etiquette (Wear, +1s, Late): single-line policy facts.
 * Cluster 3 — Contact (Ask): standalone, the "everything else" valve.
 *
 * Copy lives in `messages/{en,ko}.json` under
 * `Event.DayNNight.survivalKit`. The component itself is locale-blind.
 */
export function SurvivalKit() {
  const t = useTranslations("Event.DayNNight.survivalKit");
  const tDn = useTranslations("Event.DayNNight");
  const [copied, setCopied] = useState<string | null>(null);

  const address = tDn("location.address");
  const tossAccount = tDn("entry.bank");
  const tossAmount = tDn("entry.amount");
  const hostContact = t("host.value");
  // Kakao Map query URL — works without an API key. The map app
  // resolves the romanized address on open.
  const kakaoMapUrl = `https://map.kakao.com/?q=${encodeURIComponent(address)}`;
  // Toss line copied as "account · amount" so a single paste lands both.
  const tossClipboard = `${tossAccount} · ${tossAmount}`;
  const hostHref = hostContact.includes("@")
    ? `mailto:${hostContact}`
    : hostContact;

  const flashCopied = (key: string) => {
    setCopied(key);
    setTimeout(
      () => setCopied((current) => (current === key ? null : current)),
      1500
    );
  };

  const copyToClipboard = async (text: string, key: string) => {
    try {
      await navigator.clipboard.writeText(text);
      flashCopied(key);
    } catch {
      // Clipboard API can fail in restrictive iframes / non-HTTPS.
      // Silent — the value is still visible for manual select-copy.
    }
  };

  const copyLabel = (key: string) => (copied === key ? t("copied") : t("copy"));

  return (
    <section
      aria-labelledby="survival-kit-heading"
      className="mt-16 grid max-w-[640px] md:mt-24 md:max-w-[760px]"
    >
      {/* Heading — eyebrow + serif title, no divider above (the
          surrounding closing italic provides the upper visual break). */}
      <header className="mb-10 grid gap-2 md:mb-12 md:gap-3">
        <p className="font-mono text-[10px] tracking-[0.32em] text-[var(--dn-fg-faint)] uppercase">
          {t("subheading")}
        </p>
        <h2
          id="survival-kit-heading"
          className="font-serif text-[clamp(1.8rem,3vw,2.6rem)] leading-[1.1] font-bold tracking-[-0.015em] text-[var(--dn-fg)]"
        >
          {t("heading")}
        </h2>
      </header>

      {/* ── Cluster 1: Logistics (Where, Pay) ────────────────────── */}
      <div className="grid gap-10 border-t border-[var(--dn-line)] pt-10 md:gap-12 md:pt-12">
        <LogisticsBlock
          label={t("address.label")}
          value={address}
          hint={t("address.hint")}
        >
          <RowAction
            href={kakaoMapUrl}
            external
            arrow
            text={t("openMap")}
          />
          <RowAction
            onClick={() => copyToClipboard(address, "address")}
            text={copyLabel("address")}
            ariaLabel={copyLabel("address")}
          />
        </LogisticsBlock>

        <LogisticsBlock
          label={t("toss.label")}
          value={tossAccount}
          subvalue={tossAmount}
          hint={t("toss.hint")}
        >
          <RowAction
            onClick={() => copyToClipboard(tossClipboard, "toss")}
            text={copyLabel("toss")}
            ariaLabel={copyLabel("toss")}
          />
        </LogisticsBlock>
      </div>

      {/* ── Cluster 2: Etiquette (Wear, +1s, Late) ───────────────── */}
      <dl className="mt-10 grid gap-5 border-t border-[var(--dn-line)] pt-10 md:mt-12 md:gap-6 md:pt-12">
        <EtiquetteRow label={t("dress.label")} value={t("dress.value")} />
        <EtiquetteRow label={t("plusOnes.label")} value={t("plusOnes.value")} />
        <EtiquetteRow label={t("late.label")} value={t("late.value")} />
      </dl>

      {/* ── Cluster 3: Contact (Ask) ──────────────────────────────── */}
      <div className="mt-10 grid grid-cols-[88px_1fr] items-baseline gap-x-6 border-t border-[var(--dn-line)] pt-10 md:mt-12 md:pt-12">
        <span className="font-mono text-[10px] tracking-[0.22em] text-[var(--dn-fg-faint)] uppercase">
          {t("host.label")}
        </span>
        <div className="grid gap-2 md:gap-3">
          <a
            href={hostHref}
            className="ease inline-flex w-fit items-baseline gap-2 font-serif text-[clamp(1.1rem,1.5vw,1.4rem)] leading-[1.3] text-[var(--dn-fg)] no-underline underline-offset-[6px] transition-[text-decoration-color,gap] duration-200 [text-decoration-color:var(--dn-fg-faint)] [text-decoration-line:underline] hover:gap-3 hover:[text-decoration-color:var(--dn-fg)]"
          >
            <span>{hostContact}</span>
            <span aria-hidden className="text-[0.85em] leading-none">
              →
            </span>
          </a>
          <p className="font-mono text-[10.5px] leading-[1.6] tracking-[0.06em] text-[var(--dn-fg-faint)]">
            {t("host.hint")}
          </p>
        </div>
      </div>
    </section>
  );
}

/**
 * Logistics row — for Where / Pay. Larger value typography, optional
 * subvalue (e.g. amount), hint line, and an action row beneath.
 *
 * Layout: 88px label column + 1fr content. Label is mono micro-caps,
 * content stack is serif value → mono subvalue → mono hint → mono
 * actions. The hierarchy reads top-to-bottom: identity → fact →
 * context → affordance.
 */
function LogisticsBlock({
  label,
  value,
  subvalue,
  hint,
  children
}: {
  label: string;
  value: string;
  subvalue?: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="grid grid-cols-[88px_1fr] items-baseline gap-x-6">
      <span className="self-start pt-[6px] font-mono text-[10px] tracking-[0.22em] text-[var(--dn-fg-faint)] uppercase">
        {label}
      </span>
      <div className="grid gap-2 md:gap-3">
        <p className="font-serif text-[clamp(1.2rem,1.6vw,1.5rem)] leading-[1.3] tracking-[-0.005em] text-[var(--dn-fg)]">
          {value}
        </p>
        {subvalue ? (
          <p className="font-mono text-[12px] tracking-[0.08em] text-[var(--dn-fg-mute)]">
            {subvalue}
          </p>
        ) : null}
        {hint ? (
          <p className="font-mono text-[10.5px] leading-[1.6] tracking-[0.06em] text-[var(--dn-fg-faint)]">
            {hint}
          </p>
        ) : null}
        <div className="mt-2 flex flex-wrap items-baseline gap-x-5 gap-y-2">
          {children}
        </div>
      </div>
    </div>
  );
}

/**
 * Etiquette row — single-line policy fact (Wear / +1s / Late).
 *
 * Layout: 88px label column + 1fr value. No subvalue, no actions —
 * these are read-only one-liners. Value uses sans for legibility (the
 * lines are conversational, not editorial).
 */
function EtiquetteRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="grid grid-cols-[88px_1fr] items-baseline gap-x-6">
      <dt className="font-mono text-[10px] tracking-[0.22em] text-[var(--dn-fg-faint)] uppercase">
        {label}
      </dt>
      <dd className="text-[14.5px] leading-[1.55] font-light tracking-[-0.005em] text-[var(--dn-fg)]">
        {value}
      </dd>
    </div>
  );
}

/**
 * RowAction — mono micro-cap link or button. Used for the
 * Where/Pay affordances (Open map, Copy). `arrow` adds a trailing →
 * that nudges right on hover (consistent with the contact link).
 */
function RowAction({
  text,
  onClick,
  href,
  external,
  arrow,
  ariaLabel
}: {
  text: string;
  onClick?: () => void;
  href?: string;
  external?: boolean;
  arrow?: boolean;
  ariaLabel?: string;
}) {
  const className =
    "ease inline-flex items-baseline gap-1.5 font-mono text-[10px] tracking-[0.22em] text-[var(--dn-fg-mute)] uppercase no-underline transition-[color,gap] duration-200 hover:text-[var(--dn-fg)]" +
    (arrow ? " hover:gap-2.5" : "");
  const inner = (
    <>
      <span>{text}</span>
      {arrow ? (
        <span aria-hidden className="text-[1em] leading-none">
          →
        </span>
      ) : null}
    </>
  );
  if (href) {
    return (
      <a
        href={href}
        {...(external
          ? { target: "_blank", rel: "noopener noreferrer" }
          : undefined)}
        className={className}
        aria-label={ariaLabel}
      >
        {inner}
      </a>
    );
  }
  return (
    <button
      type="button"
      onClick={onClick}
      className={className}
      aria-label={ariaLabel}
    >
      {inner}
    </button>
  );
}
