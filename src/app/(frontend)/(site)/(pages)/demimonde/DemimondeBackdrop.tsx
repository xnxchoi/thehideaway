"use client";

import * as m from "motion/react-m";
import { useReducedMotion, type MotionValue } from "motion/react";
import s from "./Demimonde.module.scss";

interface DemimondeBackdropProps {
  dustY: MotionValue<string>;
  opacity: MotionValue<number>;
}

export function DemimondeBackdrop({ dustY, opacity }: DemimondeBackdropProps) {
  const reduced = useReducedMotion();

  return (
    <m.div className={s.backdrop} style={{ opacity }} aria-hidden>
      {/* Slow base wash. */}
      <div className={s.bdBase} />

      {/* Two drifting light leaks at different speeds. */}
      <m.div
        className={s.bdLeakA}
        animate={
          reduced
            ? undefined
            : { x: ["-6%", "6%", "-6%"], y: ["-4%", "4%", "-4%"] }
        }
        transition={{ duration: 22, repeat: Infinity, ease: "easeInOut" }}
      />
      <m.div
        className={s.bdLeakB}
        animate={
          reduced
            ? undefined
            : { x: ["8%", "-8%", "8%"], y: ["6%", "-6%", "6%"] }
        }
        transition={{ duration: 30, repeat: Infinity, ease: "easeInOut" }}
      />

      {/* Drifting dust — two grain planes at slightly different scroll speeds. */}
      <m.div
        className={s.bdDustNear}
        style={reduced ? undefined : { y: dustY }}
      />
      <m.div
        className={s.bdDustFar}
        animate={
          reduced ? undefined : { backgroundPosition: ["0% 0%", "100% 100%"] }
        }
        transition={{ duration: 40, repeat: Infinity, ease: "linear" }}
      />

      {/* Animated grain — fine noise that breathes. */}
      <m.div
        className={s.bdNoise}
        animate={reduced ? undefined : { opacity: [0.55, 0.8, 0.55] }}
        transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
      />

      {/* Vignette to keep edges from going flat. */}
      <div className={s.bdVignette} />
    </m.div>
  );
}
