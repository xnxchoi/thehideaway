"use client";

import { Suspense, useState } from "react";
import { View } from "@react-three/drei";
import { TURNTABLE } from "./content";
import { MarbleScene } from "./DemimondeMarble";
import { RecordScene } from "./DemimondeRecord";
import { Button } from "../../../../../../../src/components/core/Button";
import { useCanvasClaim } from "../../../../../../../src/stores/CanvasFrameloop";

/**
 * YM.FM turntable — clickable disc that toggles spin.
 *
 * Architecture: this component portals two scenes into the site-wide
 * shared <Canvas> mounted by MainInternal — there is no local <Canvas>
 * anywhere on this page. Each <View> uses drei's tunnel-to-View.Port
 * mechanism to render its children at the View element's DOM rect.
 *
 * Composition inside the button (all three layered at the same DOM
 * rect — drei portals each scene into its own scissor region within
 * MainInternal's shared canvas):
 *   1. Marble <View>           — the warm-stone backdrop. Fragment
 *                                shader does a circle discard so the
 *                                rectangular View region appears as a
 *                                disc cleanly inscribed in the button's
 *                                rounded-full clip.
 *   2. Record <View>           — the spinning vinyl: dark PBR disc,
 *                                tomato-red center label, YM/FM text.
 *                                Has its own <PerspectiveCamera
 *                                makeDefault> because MainInternal's
 *                                default camera is orthographic (good
 *                                for the marble's ScreenQuad, wrong
 *                                for a perspective-shaded disc).
 *   3. <Tape3DScene>           — the foreground tape player (drop-in
 *                                slot; see the comment below). Wired
 *                                as a separate component so it portals
 *                                its TapeModel scene into the same
 *                                shared canvas without overlapping
 *                                MarbleScene/RecordScene's depth or
 *                                material concerns.
 *   4. Play / pause glyph DOM  — plain HTML, sits at the button's
 *                                bottom-right corner. It's a regular
 *                                React node, not part of the WebGL
 *                                rendering, so it can be styled with
 *                                Tailwind without touching shaders.
 *
 * Click anywhere on the button toggles `spinning`. Default is on — the
 * disc/tape should feel alive on load; the click affordance is for
 * pausing the motion, not starting it. There is intentionally no hover
 * transform on the button itself — the motion in the canvas IS the
 * affordance.
 *
 * Stacking caveat: MainInternal's canvas wrapper sits at z=40. The page
 * wrapper (<RPage>) uses `isolate`, which traps any z-index inside the
 * page's stacking context. The play-glyph at z-2 therefore composites
 * as part of that trapped context and would render visually behind the
 * canvas overlay. We accept this for now — the button still receives
 * clicks because the canvas has pointer-events:none. If the glyph needs
 * to layer above the WebGL output, it has to escape the page wrapper
 * (portal to body, or RPage drops `isolate`).
 */
export function DemimondeTurntable() {
  const [spinning, setSpinning] = useState(true);
  // Claim continuous frameloop on the shared canvas — marble + record
  // scenes animate via useFrame.
  useCanvasClaim();

  return (
    <section
      className="relative z-[1] overflow-hidden px-8 py-24 max-sm:px-6 max-sm:py-18"
      aria-label="Soundtrack"
    >
      <div className="mx-auto grid max-w-[1200px] grid-cols-1 items-center gap-14 md:grid-cols-[minmax(0,1fr)_minmax(280px,380px)] md:gap-24">
        <div className="min-w-0">
          <span className="mb-5 inline-flex items-center gap-3 font-sans text-[11px] tracking-[0.32em] text-[var(--tomato)] uppercase before:h-px before:w-6 before:bg-[var(--tomato)] before:content-['']">
            {TURNTABLE.eyebrow}
          </span>
          <h2 className="m-0 font-serif text-[clamp(36px,5.5vw,68px)] leading-[0.96] font-normal tracking-[-0.025em] text-balance text-[var(--ink)] italic">
            {TURNTABLE.titleLead}
            <br />
            <em className="text-[var(--tomato)] italic">
              {TURNTABLE.titleAccent}
            </em>
          </h2>
          <p className="mt-6 max-w-[52ch] text-base leading-[1.65] text-[var(--ink-soft)]">
            {TURNTABLE.blurb}
          </p>
          <p className="mt-7 border-t border-[var(--rule)] pt-4 text-[13px] leading-[1.5] text-[var(--ink-muted)]">
            <span className="mr-2 font-sans text-[10px] tracking-[0.3em] text-[var(--ink-muted)] uppercase">
              {TURNTABLE.creditsLabel}
            </span>{" "}
            {TURNTABLE.credits}
          </p>
        </div>

        <Button
          aria-label={TURNTABLE.cta.aria}
          onClick={() => setSpinning((r) => !r)}
          data-spinning={spinning ? "true" : "false"}
          className="relative mx-auto block aspect-square w-full max-w-[380px] cursor-pointer overflow-hidden rounded-full border-0 bg-transparent p-0 shadow-[0_4px_8px_oklch(0.3_0.04_60/0.2),0_24px_60px_-16px_oklch(0.3_0.04_60/0.45),inset_0_1px_0_oklch(1_0_0/0.5)] outline-none focus-visible:outline-2 focus-visible:outline-offset-[6px] focus-visible:outline-[var(--tomato)]"
        >
          {/* Marble backdrop. The View is sized via className (matching
              the Tape3DScene pattern in the codebase) — Tailwind's
              `absolute inset-0` resolves to the parent button's rect,
              which is 380×380 thanks to `aspect-square max-w-[380px]`.
              Suspense lives inside the View so a slow HDR load doesn't
              defer the play-glyph's render. */}
          {/* Single <View> holds both the marble backdrop and the
              vinyl record in one scene. We tried two separate Views,
              but they share MainInternal's depth buffer — the marble
              ScreenQuad's clip-space z=0 wins the depth test against
              the disc's projected depth, occluding it. With one scene
              we control draw order via renderOrder + depthWrite on
              the marble (see DemimondeMarble.tsx), so the marble
              paints first as a depth-less background and the record
              renders on top via normal depth test. */}
          <View aria-hidden className="pointer-events-none absolute inset-0">
            <Suspense fallback={null}>
              <MarbleScene />
              <RecordScene spinning={spinning} />
            </Suspense>
          </View>

          {/*
           * SLOT — <Tape3DScene> goes here, on top of the record.
           *
           * Wiring plan when you drop it in:
           *
           *   <Tape3DScene
           *     scrollTriggerId="demimonde_turntable_trigger"
           *     className="!absolute !inset-0 !h-full !w-full"
           *   />
           *
           * Notes:
           *  - Tape3DScene's own wrapper uses `h-screen w-full` + an
           *    aspect-ratio, sized for full-viewport hero use. Inside
           *    this 380px round button we need to override that with
           *    `!h-full !w-full` (Tailwind important so it beats the
           *    component's own classNames).
           *  - The internal <View> uses `inset-[auto_0%_.5%]` (bottom-
           *    anchored). For a centered tape over the record we'll
           *    want `inset-0` — that's what the className prop on
           *    Tape3DScene forwards to (spread on the inner View).
           *  - TapeModel takes a `scrollTriggerId` — provide a unique
           *    one for this section and add a sibling `<div id="…" />`
           *    somewhere reasonable (probably wrapping this whole grid)
           *    so GSAP has a real element to bind to.
           *  - The `spinning` state can drive TapeModel's animation if
           *    its API exposes a play/pause prop. Currently it drives
           *    only RecordScene's rotation; once the tape is wired,
           *    decide whether the same toggle controls both, or
           *    whether the tape always plays while the disc spin
           *    toggles independently.
           *  - Stacking: this slot renders after the record View in
           *    DOM order, so its WebGL scissor region paints on top
           *    of both marble and record. If the tape mesh has alpha
           *    edges, marble/record show through; otherwise the tape
           *    occludes them where it draws.
           */}

          {/* Play / pause glyph — bottom-right, doesn't move with the
              WebGL scene because it lives outside the canvas. See the
              stacking caveat at the top of this file. */}
          <span
            aria-hidden
            className="absolute right-[14%] bottom-[14%] z-2 flex h-[18%] min-h-9 w-[18%] min-w-9 items-center justify-center rounded-full bg-[oklch(0.18_0.02_60)] text-[oklch(0.96_0.02_85)] shadow-[0_3px_6px_oklch(0_0_0/0.35),inset_0_1px_0_oklch(1_0_0/0.3)]"
          >
            <svg
              viewBox="0 0 24 24"
              width="22"
              height="22"
              aria-hidden
              focusable="false"
            >
              {spinning ? (
                <g fill="currentColor">
                  <rect x="6" y="5" width="4" height="14" rx="1" />
                  <rect x="14" y="5" width="4" height="14" rx="1" />
                </g>
              ) : (
                <path fill="currentColor" d="M9 5v14l11-7z" />
              )}
            </svg>
          </span>
        </Button>
      </div>
    </section>
  );
}
