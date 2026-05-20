"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";

/**
 * Survival Kit — Phase 5a P5a-Product-1.
 *
 * Single block on the simplified view that absorbs the predictable host
 * DMs surfaced by the product-lens audit (§ 14.5):
 *
 *   - "Where do I send the money?" → tap-to-copy Toss account
 *   - "What's the address? Kakao Map?" → tap-to-copy address + map link
 *   - "What do I actually wear?" → dress code in eight plain words
 *   - "Can I bring [friend]?" → +1 policy line
 *   - "What if I show up at 19:30?" → late-arrival policy line
 *   - "Anything else?" → single host-contact link
 *
 * Composition: six rows of label + content + optional action. The whole
 * block lives below the simplified card's RSVP CTA so it doesn't compete
 * with the editorial header — the kit reads as the "ok, now the
 * logistics" appendix that ends the page on a useful note.
 *
 * Copy lives in `messages/{en,ko}.json` under `Event.DayNNight.survivalKit`.
 * The component itself is locale-blind — Korean visitors get Korean
 * lines, English visitors get English ones.
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
  // resolves the romanized address on open. Falls back gracefully on
  // desktop where the query renders a webview map.
  const kakaoMapUrl = `https://map.kakao.com/?q=${encodeURIComponent(address)}`;
  // Toss line copied as "account · amount" so a single paste lands both
  // pieces of information in a DM.
  const tossClipboard = `${tossAccount} · ${tossAmount}`;
  // Host contact opens via mailto so the OS hands off to whatever
  // mail client the user has — works on iOS/Android/desktop alike.
  const hostHref = hostContact.includes("@")
    ? `mailto:${hostContact}`
    : hostContact;

  const flashCopied = (key: string) => {
    setCopied(key);
    setTimeout(() => setCopied((current) => (current === key ? null : current)), 1500);
  };

  const copyToClipboard = async (text: string, key: string) => {
    try {
      await navigator.clipboard.writeText(text);
      flashCopied(key);
    } catch {
      // Clipboard API can fail in restrictive iframes or without secure
      // context. Silent — the user can still long-press the visible
      // text manually.
    }
  };

  const copyLabel = (key: string) =>
    copied === key ? t("copied") : t("copy");

  return (
    <section
      aria-labelledby="survival-kit-heading"
      className="mt-12 grid max-w-[720px] gap-6 border-t border-[var(--dn-line)] pt-10 md:mt-16 md:max-w-[880px]"
    >
      <header className="grid gap-1">
        <p className="font-mono text-[10px] tracking-[0.22em] text-[var(--dn-fg-faint)] uppercase">
          {t("subheading")}
        </p>
        <h2
          id="survival-kit-heading"
          className="font-serif text-[clamp(1.6rem,2.4vw,2.2rem)] leading-[1.15] font-bold tracking-[-0.01em] text-[var(--dn-fg)]"
        >
          {t("heading")}
        </h2>
      </header>

      <dl className="grid gap-5 font-mono text-[12px] leading-[1.6] text-[var(--dn-fg-mute)]">
        {/* Where — copy address + open Kakao Map */}
        <SurvivalRow
          label={t("address.label")}
          value={address}
          hint={t("address.hint")}
          actions={
            <>
              <RowButton
                onClick={() => copyToClipboard(address, "address")}
                aria-label={copyLabel("address")}
              >
                {copyLabel("address")}
              </RowButton>
              <RowLink href={kakaoMapUrl} external>
                {t("openMap")}
              </RowLink>
            </>
          }
        />

        {/* Pay — copy Toss account + amount in one paste */}
        <SurvivalRow
          label={t("toss.label")}
          value={tossAccount}
          subvalue={tossAmount}
          hint={t("toss.hint")}
          actions={
            <RowButton
              onClick={() => copyToClipboard(tossClipboard, "toss")}
              aria-label={copyLabel("toss")}
            >
              {copyLabel("toss")}
            </RowButton>
          }
        />

        {/* Wear — dress code in eight plain words */}
        <SurvivalRow label={t("dress.label")} value={t("dress.value")} />

        {/* Ask — single host-contact link */}
        <SurvivalRow
          label={t("host.label")}
          value={
            <a
              href={hostHref}
              className="text-[var(--dn-fg)] underline decoration-[var(--dn-fg-faint)] decoration-from-font underline-offset-4 transition-colors hover:decoration-[var(--dn-fg)]"
            >
              {hostContact}
            </a>
          }
          hint={t("host.hint")}
        />

        {/* +1s — policy line */}
        <SurvivalRow label={t("plusOnes.label")} value={t("plusOnes.value")} />

        {/* Late — policy line */}
        <SurvivalRow label={t("late.label")} value={t("late.value")} />
      </dl>
    </section>
  );
}

/**
 * A single survival-kit row. Grid: 72px label column + 1fr content
 * (matches the simplified view's `dl` rhythm) with optional actions
 * tucked to the right.
 */
function SurvivalRow({
  label,
  value,
  subvalue,
  hint,
  actions
}: {
  label: string;
  value: React.ReactNode;
  subvalue?: string;
  hint?: string;
  actions?: React.ReactNode;
}) {
  return (
    <div className="grid grid-cols-[72px_1fr] items-baseline gap-[14px]">
      <dt className="self-start pt-[3px] text-[10px] tracking-[0.18em] text-[var(--dn-fg-faint)] uppercase">
        {label}
      </dt>
      <dd className="flex flex-col gap-1.5 text-[13px] tracking-normal text-[var(--dn-fg)]">
        <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
          <span>{value}</span>
          {actions ? (
            <span className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
              {actions}
            </span>
          ) : null}
        </div>
        {subvalue ? (
          <span className="text-[10.5px] tracking-[0.06em] text-[var(--dn-fg-faint)]">
            {subvalue}
          </span>
        ) : null}
        {hint ? (
          <span className="text-[10.5px] tracking-[0.06em] text-[var(--dn-fg-faint)]">
            {hint}
          </span>
        ) : null}
      </dd>
    </div>
  );
}

function RowButton({
  children,
  onClick,
  ...rest
}: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="font-mono text-[10px] tracking-[0.18em] text-[var(--dn-fg-faint)] uppercase transition-colors hover:text-[var(--dn-fg)]"
      {...rest}
    >
      {children}
    </button>
  );
}

function RowLink({
  href,
  children,
  external
}: {
  href: string;
  children: React.ReactNode;
  external?: boolean;
}) {
  return (
    <a
      href={href}
      {...(external
        ? { target: "_blank", rel: "noopener noreferrer" }
        : undefined)}
      className="font-mono text-[10px] tracking-[0.18em] text-[var(--dn-fg-faint)] uppercase transition-colors hover:text-[var(--dn-fg)]"
    >
      {children}
    </a>
  );
}
