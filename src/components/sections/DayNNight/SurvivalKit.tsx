"use client";

import { useId, useState } from "react";
import { useTranslations } from "next-intl";
import { Map, MapMarker, MarkerContent } from "@/components/ui/map";
import { MAP_LINKS, VENUE_COORDS } from "./survivalKit.config";

/**
 * useTranslationsSafe — wraps next-intl's useTranslations so that a
 * missing-provider error during the first hydration render no longer
 * throws into an error boundary.
 *
 * Why we need this: on the immersive /day-n-night surface, SurvivalKit
 * is mounted in three places (SimplifiedView, OpeningCard inside the
 * Timeline's duplicate-ActSet pinned track, and DetailsDrawer's Vaul
 * portal). At the very first render after hydration, the
 * NextIntlClientProvider context can briefly resolve to `undefined`
 * while the (frontend)/layout's outer Suspense and ClientProviders
 * tree settle — useTranslations throws, React fires the error boundary
 * + retries, and the second render succeeds. The visible UI is
 * correct, but the console fills with 4+ stack traces every load.
 *
 * This wrapper returns `null` when the hook throws, letting the caller
 * render nothing on that first attempt. React then retries with the
 * fully-mounted provider on the next pass and the hook works normally.
 * Hook order remains stable across renders — the hook is always called
 * in the same position; the try/catch only suppresses the throw next
 * to the caller's site, it does not skip the call. */
function useTranslationsSafe(namespace: Parameters<typeof useTranslations>[0]) {
  try {
    return useTranslations(namespace);
  } catch {
    return null;
  }
}

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
  const t = useTranslationsSafe("Event.DayNNight.survivalKit");
  const tDn = useTranslationsSafe("Event.DayNNight");
  const [copied, setCopied] = useState<string | null>(null);
  // useId yields a unique, SSR-stable id per instance so the immersive
  // view can mount multiple kits (Opening + Closing, each duplicated by
  // the seamless-loop ActSet) without aria-labelledby id collisions.
  const headingId = useId();

  // Wait for the next-intl provider context. Returning null on the
  // first render where context isn't yet ready lets React retry on
  // the next pass with the provider fully mounted — no error-boundary
  // fallout, no console noise.
  if (!t || !tDn) return null;

  const address = tDn("location.address");
  const tossAccount = tDn("entry.bank");
  const tossAmount = tDn("entry.amount");
  // Account holder name — required for Korean bank transfers.
  const tossHolder = tDn("entry.accountHolder");
  const hostContact = t("host.value");
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
  // S-series: max-w tuned to the actual host column width on standard
  // xl viewports. The prior 560/640 caused clipping when the act's
  // right column was narrower than the kit's max-width on 1440-ish
  // screens. Embedded now fills its column without max-w.
  const outerClass =
    variant === "embedded"
      ? "grid w-full max-w-full"
      : "mt-16 grid max-w-[560px] md:mt-24 md:max-w-[640px]";

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

      {/* ── Address / Map fragment ────────────────────────────────── */}
      <div className="grid gap-2">
        <p className="font-sans text-[11px] tracking-[0.32em] text-[var(--dn-fg-faint)] uppercase">
          {t("address.label")}
        </p>
        <div className="relative aspect-[16/7] overflow-hidden rounded-sm bg-neutral-900">
          <Map
            theme="dark"
            viewport={{
              center: [VENUE_COORDS.lng, VENUE_COORDS.lat],
              zoom: 15
            }}
            keyboard={false}
            className="absolute inset-0 h-full w-full"
          >
            <MapMarker longitude={VENUE_COORDS.lng} latitude={VENUE_COORDS.lat}>
              <MarkerContent>
                <div
                  aria-hidden
                  className="size-2.5 rounded-full bg-white shadow-[0_0_0_5px_rgba(255,255,255,0.18)]"
                />
              </MarkerContent>
            </MapMarker>
          </Map>
          {/* Address text overlaid bottom-left with gradient scrim */}
          <div className="pointer-events-none absolute inset-x-0 bottom-0 z-10 bg-gradient-to-t from-black/80 to-transparent px-4 pt-10 pb-3">
            <p className="font-serif text-[clamp(0.9rem,1.4vw,1.15rem)] leading-[1.2] tracking-[-0.01em] text-[var(--dn-fg)]">
              {address}
            </p>
          </div>
        </div>
        {/* Provider deep-links + copy */}
        <div className="mt-1 flex flex-wrap items-baseline gap-x-6 gap-y-2">
          <RowAction
            href={MAP_LINKS.kakao}
            external
            arrow
            text={t("map.kakao")}
          />
          <RowAction
            href={MAP_LINKS.naver}
            external
            arrow
            text={t("map.naver")}
          />
          <RowAction
            href={MAP_LINKS.google}
            external
            arrow
            text={t("map.google")}
          />
          <RowAction
            onClick={() => copyToClipboard(address, "address")}
            text={copyLabel("address")}
            ariaLabel={copyLabel("address")}
          />
        </div>
      </div>

      {/* ── Payment fragment ──────────────────────────────────────── */}
      <div className="mt-16 grid gap-2">
        <p className="font-sans text-[11px] tracking-[0.32em] text-[var(--dn-fg-faint)] uppercase">
          {t("toss.label")}
        </p>
        <p className="font-serif text-[clamp(2rem,2.4vw,2.6rem)] leading-[1.15] tracking-[-0.01em] text-[var(--dn-fg)]">
          {tossAccount}
        </p>
        <p className="font-serif text-[clamp(1.4rem,1.6vw,1.6rem)] leading-[1.3] tracking-[-0.005em] text-[var(--dn-fg-mute)]">
          {tossHolder}
        </p>
        <p className="font-sans text-[14px] tracking-[0.08em] text-[var(--dn-fg-mute)]">
          {tossAmount}
        </p>
        <div className="mt-2">
          <RowAction
            onClick={() => copyToClipboard(tossClipboard, "toss")}
            text={copyLabel("toss")}
            ariaLabel={copyLabel("toss")}
          />
        </div>
      </div>

      {/* ── Etiquette fragment — 3 hanging-label rows ─────────────── */}
      {/* R1: row gap 13→21, value text scaled up to 15-17px so the
          etiquette reads as part of the kit's body rather than as
          metadata captions. Label col widened 55→64 to fit "+1s"
          tracking without crowding. */}
      <dl className="mt-16 grid gap-6">
        {etiquette.map(({ key, label, value }) => (
          <div
            key={key}
            className="grid grid-cols-[64px_1fr] items-baseline gap-x-6"
          >
            <dt className="font-serif text-sm tracking-wider text-[var(--dn-fg)] italic">
              {label}
            </dt>
            <dd className="text-base leading-[1.4] font-light tracking-[-0.005em] text-[var(--dn-fg)]">
              {value}
            </dd>
          </div>
        ))}
      </dl>

      {/* ── Contact fragment — italic serif pull ──────────────────── */}
      <div className="mt-16 grid grid-cols-[64px_1fr] items-baseline gap-x-6">
        <span className="font-sans text-[11px] tracking-[0.22em] text-[var(--dn-fg-faint)] uppercase">
          {t("host.label")}
        </span>
        <a
          href={hostHref}
          className="ease inline-flex w-fit items-baseline gap-2 font-serif text-[clamp(1.15rem,1.8vw,1.5rem)] leading-[1.3] text-[var(--dn-fg)] italic [text-decoration-line:underline] no-underline [text-decoration-color:var(--dn-fg-faint)] underline-offset-[6px] transition-[text-decoration-color,gap] duration-200 hover:gap-3 hover:[text-decoration-color:var(--dn-fg)]"
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
    "ease inline-flex items-baseline gap-1.5 font-sans text-[10px] tracking-[0.22em] text-[var(--dn-fg-mute)] uppercase no-underline transition-[color,gap] duration-200 hover:text-[var(--dn-fg)]" +
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
