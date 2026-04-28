"use client";

import { AnimatePresence, useReducedMotion } from "motion/react";
import * as m from "motion/react-m";
import { useEffect, useId, useMemo, useState } from "react";
import { instrumentSerif } from "./fonts";
import { InvoiceMeta } from "./InvoiceMeta";
import { InvoicePaper } from "./InvoicePaper";
import { InvoiceSleeve } from "./InvoiceSleeve";
import type { InvoiceCertificateProps } from "./types";

type Phase = "sealed" | "revealing" | "presenting" | "focused";

const cn = (...c: Array<string | false | null | undefined>) =>
  c.filter(Boolean).join(" ");

// Filmic out-expo. Long tail, no bounce — reads as cinematography, not physics.
const FILMIC = [0.22, 1, 0.36, 1] as const;

export function InvoiceCertificate({
  invoice,
  onPrint,
  onDownload,
  className
}: InvoiceCertificateProps) {
  const reduce = useReducedMotion();
  const reactId = useId();
  const textureId = useMemo(
    () => `inv-tex-${reactId.replace(/:/g, "")}`,
    [reactId]
  );
  const [phase, setPhase] = useState<Phase>("sealed");

  // The composition holds as a still life, then dissolves slowly.
  useEffect(() => {
    if (reduce) {
      setPhase("presenting");
      return;
    }
    const t1 = setTimeout(() => setPhase("revealing"), 450);
    const t2 = setTimeout(() => setPhase("presenting"), 2100);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, [reduce]);

  const isFocused = phase === "focused";
  const sleeveCleared =
    phase === "revealing" || phase === "presenting" || isFocused;

  const handlePrint = () => {
    if (onPrint) return onPrint();
    if (typeof window !== "undefined") window.print();
  };

  const handleDownload = () => {
    if (onDownload) void onDownload();
  };

  return (
    <div className={cn(instrumentSerif.variable, "relative w-full", className)}>
      <div className="relative grid w-full grid-cols-1 gap-10 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] xl:gap-16">
        {/* Left: photographed still life */}
        <div className="relative mx-auto w-full max-w-[480px]">
          <PhotoStage>
            {/* Composition — slight rotational offset, like a styled flat-lay.
                overflow-hidden clips the sleeve as it slides behind the bottom
                edge so it never appears as a stranded panel below the paper. */}
            <div
              className="relative aspect-[1/1.414] w-full overflow-hidden"
              style={{ transform: "rotate(-1.2deg)" }}
            >
              {/* Paper — barely-perceptible parallax during reveal */}
              <m.div
                className="absolute inset-0"
                initial={{ y: 0, opacity: reduce ? 1 : 0.92 }}
                animate={{
                  y: sleeveCleared ? -2 : 0,
                  opacity: 1
                }}
                transition={{ duration: 1.8, ease: FILMIC }}
              >
                <InvoicePaper invoice={invoice} textureId={textureId} />
              </m.div>

              {/* Sleeve — slides down and behind the paper's bottom edge.
                  Opacity holds at 1 until the last third, so we never see a
                  pink crossfade tint over the cream paper. */}
              <m.div
                className="absolute inset-0"
                style={{ transformOrigin: "50% 100%" }}
                initial={{ y: 0, opacity: 1 }}
                animate={{
                  y: sleeveCleared ? "100%" : 0,
                  opacity: sleeveCleared ? [1, 1, 0] : 1
                }}
                transition={{
                  y: { duration: 1.8, ease: FILMIC },
                  opacity: {
                    duration: 1.8,
                    times: [0, 0.7, 1],
                    ease: "linear"
                  }
                }}
              >
                <InvoiceSleeve />
              </m.div>
            </div>
          </PhotoStage>

          {/* Tap-to-focus surface */}
          {phase === "presenting" ? (
            <button
              type="button"
              aria-label="Inspect invoice"
              onClick={() => setPhase("focused")}
              className="absolute inset-0 cursor-zoom-in"
            />
          ) : null}
        </div>

        {/* Right: meta card */}
        <div className="relative">
          <AnimatePresence>
            {phase === "presenting" ? (
              <m.div
                key="meta"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 1.1, ease: FILMIC }}
                className="flex h-full min-h-[460px] flex-col"
              >
                <InvoiceMeta invoice={invoice} />
              </m.div>
            ) : null}
          </AnimatePresence>
        </div>
      </div>

      {/* Focus mode overlay */}
      <AnimatePresence>
        {isFocused ? (
          <m.div
            className="fixed inset-0 z-50 flex items-center justify-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5, ease: FILMIC }}
          >
            <button
              type="button"
              aria-label="Close inspection"
              onClick={() => setPhase("presenting")}
              className="absolute inset-0 bg-background/90 backdrop-blur-md"
            />

            <m.div
              className="relative z-10 w-full max-w-[640px] px-6"
              initial={{ scale: 0.96, y: 8, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.97, y: 6, opacity: 0 }}
              transition={{ duration: 0.7, ease: FILMIC }}
            >
              <InvoicePaper
                invoice={invoice}
                textureId={`${textureId}-focus`}
              />
            </m.div>

            <m.div
              className="fixed right-8 bottom-8 z-20 flex items-center gap-3"
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.5, ease: FILMIC, delay: 0.2 }}
            >
              <ActionButton onClick={handlePrint} label="Print" />
              {onDownload ? (
                <ActionButton onClick={handleDownload} label="Save" />
              ) : null}
              <ActionButton
                onClick={() => setPhase("presenting")}
                label="Close"
                muted
              />
            </m.div>
          </m.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}

/**
 * The "photo set" — a dim, vignetted surface with a single warm key light
 * baked in. Composition sits inside this; the still-life conceit lives here.
 */
function PhotoStage({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="relative isolate w-full px-[8%] py-[10%]"
      style={{
        background:
          // Warm key light upper-left, deep cool shadow lower-right
          "radial-gradient(120% 90% at 18% 12%, rgba(190,160,120,0.10), transparent 55%), radial-gradient(140% 100% at 100% 100%, rgba(0,0,0,0.45), transparent 60%), linear-gradient(160deg, #1a1815 0%, #0d0c0a 100%)"
      }}
    >
      {/* Vignette */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse at center, transparent 35%, rgba(0,0,0,0.55) 100%)"
        }}
      />
      {/* Subtle grain across the whole stage */}
      <svg
        aria-hidden
        className="pointer-events-none absolute inset-0 h-full w-full opacity-[0.08]"
      >
        <defs>
          <filter id="stage-grain">
            <feTurbulence
              type="fractalNoise"
              baseFrequency="2.4"
              numOctaves={2}
              stitchTiles="stitch"
            />
            <feColorMatrix
              type="matrix"
              values="0 0 0 0 0
                      0 0 0 0 0
                      0 0 0 0 0
                      0 0 0 1 0"
            />
          </filter>
        </defs>
        <rect width="100%" height="100%" filter="url(#stage-grain)" />
      </svg>

      <div className="relative">{children}</div>
    </div>
  );
}

type ActionButtonProps = {
  label: string;
  onClick: () => void;
  muted?: boolean;
};

function ActionButton({ label, onClick, muted }: ActionButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "border px-5 py-2.5 font-mono text-[11px] tracking-widest uppercase transition-colors",
        muted
          ? "border-border/30 text-muted-foreground/70 hover:border-border/60 hover:text-foreground"
          : "border-border/40 bg-background/60 text-foreground/80 backdrop-blur-md hover:border-border hover:text-foreground"
      )}
    >
      {label}
    </button>
  );
}
