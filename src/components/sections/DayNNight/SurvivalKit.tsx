"use client";

import { useId, useState } from "react";
import { useTranslations } from "next-intl";

/**
 * Survival Kit — Phase 5c v4 (editorial fragments).
 *
 * v4 dissolves the dossier framing (v2's three-cluster card with
 * dividers + own header) into a single typographic stack of editorial
 * fragments. The act's own title carries the section identity; the kit
 * does not repeat it. Spacing follows a Fibonacci-ish progression
 * (8 / 13 / 21 / 55 px) so the rhythm feels musical instead of
 * arbitrary.
 *
 *   ┌──────────────────────────────────────────────────────┐
 *   │  WHERE                                               │
 *   │  Sowol-ro 20-gil 64, 3F                              │
 *   │  → Open map · Copy                                   │
 *   │                                                      │
 *   │  PAY                                                 │
 *   │  Toss Bank · 1002-5436-0906                          │
 *   │  리스토어드프로젝트                                  │
 *   │  65,000 KRW                                          │
 *   │  → Copy                                              │
 *   │                                                      │
 *   │  WEAR    Dressy. Comfortable. A little brave.        │
 *   │  +1S     Reserved guests only.                       │
 *   │  LATE    Doors stay open until 21:00.                │
 *   │                                                      │
 *   │  ASK     concierge@hideawayseoul.com →               │
 *   └──────────────────────────────────────────────────────┘
 *
 * Geometric harmony:
 *  - Label column: 55px (Fibonacci) — tight to short labels, no
 *    over-reserved whitespace like the prior 88px column.
 *  - Inter-fragment gap: 55px (top-level groups), 13px (within-group
 *    rows), 8px (line stack).
 *  - Type ratios: address/account serif ≈ 1.6× lede; lede ≈ 1.5× mono
 *    metadata. Stays near the golden ratio without enforcing exact
 *    pixel multiples.
 *
 * Copy lives in `messages/{en,ko}.json` under
 * `Event.DayNNight.survivalKit`. The component itself is locale-blind.
 *
 * ── Variants ─────────────────────────────────────────────────────────
 * `standalone` (default): SimplifiedView usage. Outer top margin
 * separates the kit from the closing italic above it.
 *
 * `embedded`: Immersive Opening + Closing reprise usage. No outer
 * margin — the host act grid owns placement. Slightly tighter
 * max-width so it fits inside a column.
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
  // Account holder name — required for Korean bank transfers.
  const tossHolder = tDn("entry.accountHolder");
  const hostContact = t("host.value");
  // Kakao Map query URL — works without an API key.
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
  // SimplifiedView). `embedded` ships no margin; the host grid owns
  // placement. Width is narrower than the prior dossier so the kit
  // reads as a column of editorial fragments, not a card.
  const outerClass =
    variant === "embedded"
      ? "grid w-full max-w-[440px] xl:max-w-[480px]"
      : "mt-16 grid max-w-[520px] md:mt-24 md:max-w-[560px]";

  // Etiquette rows — the three single-line policy facts. Pulled out
  // so the JSX stack reads linearly instead of inlining a map() with
  // string literals.
  const etiquette = [
    { key: "dress", label: t("dress.label"), value: t("dress.value") },
    { key: "plus", label: t("plusOnes.label"), value: t("plusOnes.value") },
    { key: "late", label: t("late.label"), value: t("late.value") }
  ];

  return (
    <section aria-labelledby={headingId} className={outerClass}>
      {/* The kit's own heading is hidden visually because the host
          act's title already labels the surface. Screen-readers get
          the label via aria-labelledby pointing here so the section's
          purpose is named without typographic duplication. */}
      <h2 id={headingId} className="sr-only">
        {t("heading")}
      </h2>

      {/* ── Address fragment ──────────────────────────────────────── */}
      <div className="grid gap-[8px]">
        <p className="font-mono text-[10px] tracking-[0.32em] text-[var(--dn-fg-faint)] uppercase">
          {t("address.label")}
        </p>
        <p className="font-serif text-[clamp(1.4rem,1.8vw,1.8rem)] leading-[1.2] tracking-[-0.01em] text-[var(--dn-fg)]">
          {address}
        </p>
        <div className="mt-[8px] flex flex-wrap items-baseline gap-x-[21px] gap-y-[8px]">
          <RowAction href={kakaoMapUrl} external arrow text={t("openMap")} />
          <RowAction
            onClick={() => copyToClipboard(address, "address")}
            text={copyLabel("address")}
            ariaLabel={copyLabel("address")}
          />
        </div>
      </div>

      {/* ── Payment fragment ──────────────────────────────────────── */}
      <div className="mt-[55px] grid gap-[8px]">
        <p className="font-mono text-[10px] tracking-[0.32em] text-[var(--dn-fg-faint)] uppercase">
          {t("toss.label")}
        </p>
        <p className="font-serif text-[clamp(1.4rem,1.8vw,1.8rem)] leading-[1.2] tracking-[-0.01em] text-[var(--dn-fg)]">
          {tossAccount}
        </p>
        <p className="font-serif text-[clamp(1rem,1.2vw,1.15rem)] leading-[1.3] tracking-[-0.005em] text-[var(--dn-fg-mute)]">
          {tossHolder}
        </p>
        <p className="font-mono text-[12px] tracking-[0.08em] text-[var(--dn-fg-mute)]">
          {tossAmount}
        </p>
        <div className="mt-[8px]">
          <RowAction
            onClick={() => copyToClipboard(tossClipboard, "toss")}
            text={copyLabel("toss")}
            ariaLabel={copyLabel("toss")}
          />
        </div>
      </div>

      {/* ── Etiquette fragment — 3 hanging-label rows ─────────────── */}
      <dl className="mt-[55px] grid gap-[13px]">
        {etiquette.map(({ key, label, value }) => (
          <div
            key={key}
            className="grid grid-cols-[55px_1fr] items-baseline gap-x-[21px]"
          >
            <dt className="font-mono text-[10px] tracking-[0.22em] text-[var(--dn-fg-faint)] uppercase">
              {label}
            </dt>
            <dd className="text-[14px] leading-[1.55] font-light tracking-[-0.005em] text-[var(--dn-fg)]">
              {value}
            </dd>
          </div>
        ))}
      </dl>

      {/* ── Contact fragment — italic serif pull ──────────────────── */}
      <div className="mt-[55px] grid grid-cols-[55px_1fr] items-baseline gap-x-[21px]">
        <span className="font-mono text-[10px] tracking-[0.22em] text-[var(--dn-fg-faint)] uppercase">
          {t("host.label")}
        </span>
        <a
          href={hostHref}
          className="ease inline-flex w-fit items-baseline gap-2 font-serif text-[clamp(1.1rem,1.4vw,1.3rem)] leading-[1.3] text-[var(--dn-fg)] italic no-underline [text-decoration-color:var(--dn-fg-faint)] [text-decoration-line:underline] underline-offset-[6px] transition-[text-decoration-color,gap] duration-200 hover:gap-3 hover:[text-decoration-color:var(--dn-fg)]"
        >
          <span>{hostContact}</span>
          <span aria-hidden className="text-[0.85em] leading-none">
            →
          </span>
        </a>
      </div>
    </section>
  );
}

/**
 * RowAction — mono micro-cap link or button. Used for the
 * Address/Payment affordances (Open map, Copy). `arrow` adds a
 * trailing → that nudges right on hover.
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
