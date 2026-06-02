import { Metadata } from "next";
import { RPage } from "../../../../../../src/components/UX/Transition";
import DemimondePageClient from "./page.client";
import { DemimondeCursor } from "./DemimondeCursor";
import { DemimondeHero } from "./DemimondeHero";
import { DemimondeFacts } from "./DemimondeFacts";
import { DemimondeWelcome } from "./DemimondeWelcome";
import { DemimondeTurntable } from "./DemimondeTurntable";
import { DemimondePacking } from "./DemimondePacking";
import { DemimondeSchedule } from "./DemimondeSchedule";
import { DemimondeMap } from "./DemimondeMap";
import { DemimondeDirections } from "./DemimondeDirections";
import { DemimondePhrases } from "./DemimondePhrases";
import { DemimondeFAQ } from "./DemimondeFAQ";
import { DemimondeClosing } from "./DemimondeClosing";

export const metadata: Metadata = {
  title: "Demimonde · Garden cookout — The Hideaway",
  description:
    "One Sunday in the garden. Linen, second courses, songs you brought. RSVP by Friday."
};

/**
 * Demimonde shell — defines the page-scoped design tokens (warm
 * sun-bleached cookout palette) once on the root element. Children
 * read them through Tailwind arbitrary values like `bg-[var(--paper)]`
 * so we don't ship a separate stylesheet for the surface treatment.
 *
 * The paper-grain blanket and cursor-tracked sun glow are real DOM
 * nodes (not pseudo-elements) because Tailwind's arbitrary-value
 * pseudo-selectors get unwieldy with the calc() + var() math the
 * cursor reveal needs.
 */
const SHELL_TOKENS: React.CSSProperties = {
  ["--paper" as string]: "oklch(0.965 0.022 88)",
  ["--paper-soft" as string]: "oklch(0.93 0.035 82)",
  ["--paper-deep" as string]: "oklch(0.88 0.06 80)",
  ["--ink" as string]: "oklch(0.22 0.04 80)",
  ["--ink-soft" as string]: "oklch(0.36 0.04 78)",
  ["--ink-muted" as string]: "oklch(0.5 0.03 80)",
  ["--citrus" as string]: "oklch(0.82 0.18 95)",
  ["--tomato" as string]: "oklch(0.62 0.21 30)",
  ["--herb" as string]: "oklch(0.58 0.12 140)",
  ["--terracotta" as string]: "oklch(0.65 0.13 45)",
  ["--rule" as string]: "oklch(0.78 0.04 80)",
  ["--rule-soft" as string]: "oklch(0.84 0.035 80)",
  ["--cursor-x" as string]: "0.5",
  ["--cursor-y" as string]: "0.5",
  ["--cursor-dx" as string]: "0",
  ["--cursor-dy" as string]: "0",
  fontFeatureSettings: '"ss01", "kern"'
};

const PAPER_GRAIN_SVG =
  "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='320' height='320'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='2' stitchTiles='stitch'/><feColorMatrix values='0 0 0 0 0.32  0 0 0 0 0.22  0 0 0 0 0.12  0 0 0 0.08 0'/></filter><rect width='100%' height='100%' filter='url(%23n)'/></svg>\")";

const SUN_GLOW_GRADIENT =
  "radial-gradient(ellipse 60vw 60vh at calc(var(--cursor-x) * 100%) calc(var(--cursor-y) * 100%), oklch(0.95 0.12 80 / 0.5) 0%, oklch(0.95 0.12 80 / 0.18) 30%, transparent 60%)";

export default function DemimondePage() {
  return (
    <RPage
      slug={[]}
      type="pages"
      className="relative isolate min-h-screen overflow-x-hidden bg-[var(--paper)] text-[var(--ink)]"
      style={SHELL_TOKENS}
    >
      <DemimondePageClient />
      <DemimondeCursor />

      {/* Paper-grain blanket — viewport-fixed so it doesn't move on scroll. */}
      <div
        aria-hidden
        className="pointer-events-none fixed inset-0 z-0 opacity-45 mix-blend-multiply"
        style={{ backgroundImage: PAPER_GRAIN_SVG }}
      />

      {/* Cursor-tracked sun glow — drifts with the pointer across the
          whole page, soft-light blended so it warms the paper. */}
      <div
        aria-hidden
        className="pointer-events-none fixed inset-0 z-0 opacity-85 mix-blend-soft-light"
        style={{ background: SUN_GLOW_GRADIENT }}
      />

      <DemimondeHero />
      <DemimondeFacts />
      <DemimondeWelcome />
      <DemimondeTurntable />
      <DemimondePacking />
      <DemimondeSchedule />
      <DemimondeMap />
      <DemimondeDirections />
      <DemimondePhrases />
      <DemimondeFAQ />
      <DemimondeClosing />
    </RPage>
  );
}
