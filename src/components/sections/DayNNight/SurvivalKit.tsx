"use client";

import { useId, useState } from "react";
import { useTranslations } from "next-intl";

/**
 * Survival Kit — Phase 5a P5a-Product-1 (v3: variant-aware).
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
 *
 * ── Variants (P5c) ───────────────────────────────────────────────────
 * `standalone` (default): the SimplifiedView usage. Outer margins live
 * here so the kit sits below the closing italic without callers having
 * to think about spacing.
 *
 * `embedded`: the Immersive Opening + Closing reprise usage. No outer
 * margin — the surrounding act grid controls placement. Slightly
 * tighter max-width so it fits inside an act's right (or left) column
 * without crowding.
 */
interface SurvivalKitProps {
  variant?: "standalone" | "embedded";
}

export function SurvivalKit({ variant = "standalone" }: SurvivalKitProps) {
  const t = useTranslations("Event.DayNNight.survivalKit");
  const tDn = useTranslations("Event.DayNNight");
  const [copied, setCopied] = useState<string | null>(null);
  // useId yields a unique, SSR-stable id per instance so the immersive
  // view can mount multiple kits (Opening + Closing, each duplicated by
  // the seamless-loop ActSet) without aria-labelledby id collisions.
  const headingId = useId();

  const address = tDn("location.address");
  const tossAccount = tDn("entry.bank");
  const tossAmount = tDn("entry.amount");
  // Account holder name — required for Korean bank transfers (Toss /
  // KakaoBank etc. display the registered holder during transfer
  // confirmation, and users verify the name before sending). Added in
  // P5c santa-loop round 1 fix after both reviewers flagged its
  // omission from the Closing reprise as a payment-flow regression.
  const tossHolder = tDn("entry.accountHolder");
  const hostContact = t("host.value");
  // Kakao Map query URL — works without an API key. The map app
  // resolves the romanized address on open.
  const kakaoMapUrl = `https://map.kakao.com/?q=${encodeURIComponent(address)}`;
  // Toss line copied as "account · holder · amount" so a single paste
  // lands the whole payment instruction.
  const tossClipboard = `${tossAccount} · ${tossHolder} · ${tossAmount}`;
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

  // Outer container — `standalone` ships its own top margin (used in
  // SimplifiedView where the surrounding flow needs explicit
  // separation). `embedded` ships no margin so the host grid in
  // Immersive's Opening + Closing acts owns placement.
  const outerClass =
    variant === "embedded"
      ? "grid w-full max-w-[520px] xl:max-w-[560px]"
      : "mt-16 grid max-w-[640px] md:mt-24 md:max-w-[760px]";

  return (
    <section
      aria-labelledby={headingId}
      className={outerClass}
    >
      {/* Heading — eyebrow + serif title, no divider above (the
          surrounding closing italic provides the upper visual break). */}
      <header className="mb-10 grid gap-2 md:mb-12 md:gap-3">
        <p className="font-mono text-[10px] tracking-[0.32em] text-[var(--dn-fg-faint)] uppercase">
          {t("subheading")}
        </p>
        <h2
          id={headingId}
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
          <RowAction href={kakaoMapUrl} external arrow text={t("openMap")} />
          <RowAction
            onClick={() => copyToClipboard(address, "address")}
            text={copyLabel("address")}
            ariaLabel={copyLabel("address")}
          />
        </LogisticsBlock>

        <LogisticsBlock
          label={t("toss.label")}
          value={tossAccount}
          holder={tossHolder}
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
            className="ease inline-flex w-fit items-baseline gap-2 font-serif text-[clamp(1.1rem,1.5vw,1.4rem)] leading-[1.3] text-[var(--dn-fg)] [text-decoration-line:underline] no-underline [text-decoration-color:var(--dn-fg-faint)] underline-offset-[6px] transition-[text-decoration-color,gap] duration-200 hover:gap-3 hover:[text-decoration-color:var(--dn-fg)]"
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
  holder,
  subvalue,
  hint,
  children
}: {
  label: string;
  value: string;
  /**
   * Account-holder name — sits between the primary value and the
   * mono subvalue. Used by the Pay row so Korean bank transfers can
   * verify recipient identity. Optional so the Where row (no holder)
   * keeps the original value → hint cadence.
   */
  holder?: string;
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
        {holder ? (
          <p className="font-serif text-[clamp(1rem,1.2vw,1.15rem)] leading-[1.3] tracking-[-0.005em] text-[var(--dn-fg-mute)]">
            {holder}
          </p>
        ) : null}
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
        <div className="mt-2 flex flex-wrap items-baseline gap-x-5 gap-y-2 md:mt-3">
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
