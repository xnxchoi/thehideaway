"use client";

import { useState } from "react";
import * as m from "motion/react-m";
import s from "./Demimonde.module.scss";
import { TURNTABLE } from "./content";
import { DemimondeMarble } from "./DemimondeMarble";
import { DemimondeRecord } from "./DemimondeRecord";
import { Link } from "@/components/core/Link/Link";

/**
 * YM.FM turntable — circular CTA that links to the radio. Visually a
 * vinyl record on a sun-warmed-stone disc; on hover the disc reveals a
 * metallic radial gradient driven by `--cursor-x/y` CSS vars (set by
 * DemimondeCursor). When clicked it scales briefly and toggles a
 * spinning state — the record continues spinning until the user
 * navigates away.
 *
 * This is the "Curated by Anna" element in Athens-26, restyled as a
 * tactile record player rather than a slick Spotify play-button.
 */
export function DemimondeTurntable() {
  const [spinning, setSpinning] = useState(false);

  return (
    <section className={s.turntable} aria-label="Soundtrack">
      <div className={s.turntableInner}>
        <div className={s.turntableSide}>
          <span className={s.turntableEyebrow}>{TURNTABLE.eyebrow}</span>
          <h2 className={s.turntableTitle}>
            {TURNTABLE.titleLead}
            <br />
            <em>{TURNTABLE.titleAccent}</em>
          </h2>
          <p className={s.turntableBlurb}>{TURNTABLE.blurb}</p>
          <p className={s.turntableCredits}>
            <span className={s.turntableCreditsLabel}>
              {TURNTABLE.creditsLabel}
            </span>{" "}
            {TURNTABLE.credits}
          </p>
        </div>

        <span
          className={s.turntableDisc}
          aria-label={TURNTABLE.cta.aria}
          onClick={() => setSpinning(r=>!r)}
          data-spinning={spinning ? "true" : "false"}
        >
          {/* Real marble — WebGL2 fragment shader (domain-warped fBM) that
              tracks the cursor. Sits at the back of the disc. */}
          <DemimondeMarble scale={2.0} className={s.turntableMarble} />

          {/* PBR vinyl record — Three.js mesh lit by the same HDR the
              marble uses. base/grooves/grooves_op75 are wired as
              albedo/bump/roughness maps so real specular highlights
              sweep across actual ridges as the record spins. Label,
              text, and spindle are part of the same rotating group
              and ride along with the record (as real vinyl does). */}
          <DemimondeRecord
            spinning={spinning}
            className={s.turntableRecord3D}
          />
          {/* Play overlay — pulses subtly on idle */}
          <m.span
            className={s.turntablePlay}
            aria-hidden
            animate={
  spinning
                ? undefined
                : { scale: [1, 1.06, 1], opacity: [0.85, 1, 0.85] }
            }
            transition={
  spinning
                ? undefined
                : { duration: 2.4, repeat: Infinity, ease: "easeInOut" }
            }
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
                <path fill="currentColor" d="M8 5v14l11-7z" />
              )}
            </svg>
          </m.span>
        </span>
      </div>
    </section>
  );
}
