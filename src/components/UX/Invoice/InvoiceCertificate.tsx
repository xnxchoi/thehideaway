"use client";

import { AnimatePresence, useReducedMotion } from "motion/react";
import * as m from "motion/react-m";
import { useEffect, useId, useMemo, useState } from "react";
import { instrumentSerif } from "./fonts";
import { InvoiceMeta } from "./InvoiceMeta";
import { InvoicePaper } from "./InvoicePaper";
import { InvoiceScene } from "./r3f/InvoiceScene";
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

  // Hold sealed briefly, then trigger the sleeve descent. Spring physics in
  // the R3F scene takes over from here — the timing below just kicks the
  // animation off and marks when the meta card should resolve.
  useEffect(() => {
    if (reduce) {
      setPhase("presenting");
      return;
    }
    const t1 = setTimeout(() => setPhase("revealing"), 450);
    const t2 = setTimeout(() => setPhase("presenting"), 2400);
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
    <div
      className={cn(instrumentSerif.className, "relative w-full", className)}
    >
      <div className="relative grid w-full grid-cols-1 gap-10 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] xl:gap-16">
        {/* Left: R3F scene rendered into the shared <View.Port />. The scene
            holds everything — cream paper plane mesh, leather sleeve mesh,
            and the paper text content as <Html transform> living inside the
            3D space. The sleeve mesh occludes the text via Drei's `occlude`
            prop, so as the sleeve descends the text is naturally revealed
            without any manual opacity gating. */}
        <div className="relative mx-auto w-full max-w-[440px]">
          <div className="relative aspect-1/1.5 w-full">
            <InvoiceScene
              invoice={invoice}
              revealed={sleeveCleared}
              containerProps={{ className: "absolute inset-0" }}
            />

            {/* Tap-to-focus surface */}
            {phase === "presenting" ? (
              <button
                type="button"
                aria-label="Inspect invoice"
                onClick={() => setPhase("focused")}
                className="absolute inset-0 z-[60] cursor-zoom-in"
              />
            ) : null}
          </div>
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

      {/* Focus mode overlay — kept as a CSS-only enlarged paper for crisp
          text and easy print/save. The R3F scene is for entrance choreography. */}
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
