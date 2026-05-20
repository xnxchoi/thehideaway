"use client";

import type { CSSProperties } from "react";
import { useTranslations } from "next-intl";
import { SurvivalKit } from "../SurvivalKit";

const PAPER_TEXTURE = "/assets/three/materials/paper/paper_d.png";

/**
 * Opening dossier — the full SurvivalKit displayed as an A4 paper
 * artifact in Act I's right column. Aesthetic matches the project's
 * Invoice Certificate (see `@/components/UX/Invoice/InvoiceCertificate`):
 * pure white paper, A4 aspect ratio (1:1.414), tiled paper texture at
 * 320px, deep multi-layer drop shadow, hover lift on a 500ms ease.
 *
 * The kit internally uses dn-theme CSS variables (`--dn-fg`,
 * `--dn-fg-mute`, etc.) intended for dark surfaces. This wrapper
 * overrides those variables on the paper surface so the same
 * SurvivalKit markup renders as dark-on-white without any prop changes
 * to the kit itself.
 */

// Inverted dn-theme tokens — dark colors that map to the white paper.
const PAPER_THEME: CSSProperties = {
  ["--dn-fg" as string]: "oklch(18% 0.012 280)",
  ["--dn-fg-mute" as string]: "oklch(34% 0.012 280)",
  ["--dn-fg-faint" as string]: "oklch(50% 0.012 280 / 0.78)",
  ["--dn-line" as string]: "oklch(18% 0.012 280 / 0.16)"
};

export function OpeningCard() {
  const t = useTranslations("Event.DayNNight");

  return (
    <div
      className="group relative w-full max-w-[400px] rotate-[-2deg]"
      style={PAPER_THEME}
    >
      <div
        className="relative flex flex-col overflow-hidden transition-[transform,box-shadow] duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] hover:-translate-y-1 hover:rotate-[-0.5deg] hover:shadow-[0_42px_80px_-22px_rgba(0,0,0,0.65),_0_12px_32px_-10px_rgba(0,0,0,0.45)]"
        style={{
          aspectRatio: "1 / 1.414",
          backgroundColor: "#ffffff",
          boxShadow:
            "0 28px 60px -22px rgba(0,0,0,0.55), 0 8px 22px -10px rgba(0,0,0,0.35)"
        }}
      >
        {/* Paper grain — tiled like the Invoice Certificate. Multiplied
            for tactile depth without dimming the ink. */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-[0.28] mix-blend-multiply"
          style={{
            backgroundImage: `url(${PAPER_TEXTURE})`,
            backgroundRepeat: "repeat",
            backgroundSize: "320px"
          }}
        />
        {/* Postmark eyebrow — magazine masthead at the top edge */}
        <div
          className="relative flex items-baseline justify-between gap-4 border-b px-7 pt-7 pb-4 xl:px-8 xl:pt-8"
          style={{ borderColor: "var(--dn-line)" }}
        >
          <span
            className="font-mono text-[10px] tracking-[0.32em] uppercase"
            style={{ color: "var(--dn-fg)" }}
          >
            № invitation
          </span>
          <span
            className="font-mono text-[10px] tracking-[0.18em] uppercase tabular-nums"
            style={{ color: "var(--dn-fg-mute)" }}
          >
            {t("date.short")}
          </span>
        </div>
        {/* SurvivalKit. zoom scales the entire kit (layout + visual) so
            it sits on the A4 paper as a compact ledger. Letterpress
            text-shadow + tighter letter-spacing nudge the type toward
            ink-on-paper feel. */}
        <div
          className="relative flex-1 px-7 pt-6 pb-8 xl:px-8 xl:pb-10"
          style={{
            zoom: 0.86,
            letterSpacing: "0.005em",
            textShadow: "0 0 0.4px rgba(0, 0, 0, 0.12)"
          }}
        >
          <SurvivalKit variant="embedded" />
        </div>
      </div>
    </div>
  );
}
