"use client";

import { AnimatePresence, useReducedMotion } from "motion/react";
import * as m from "motion/react-m";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { instrumentSerif } from "./fonts";
import { InvoiceMeta } from "./InvoiceMeta";
import { InvoiceScene } from "./r3f/InvoiceScene";
import type { InvoiceCertificateProps } from "./types";
import { usePaperSounds } from "./usePaperSounds";

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
  const [phase, setPhase] = useState<Phase>("sealed");
  const sounds = usePaperSounds();

  // Track the inline grid slot's screen position so the fixed-positioned
  // View can sit exactly on top of it while presenting, then animate to a
  // centered fullscreen rect when focused. ResizeObserver + scroll watch so
  // it stays aligned across viewport changes.
  const inlineSlotRef = useRef<HTMLDivElement>(null);
  const [inlineRect, setInlineRect] = useState<{
    top: number;
    left: number;
    width: number;
    height: number;
  } | null>(null);

  useLayoutEffect(() => {
    const el = inlineSlotRef.current;
    if (!el) return;
    const update = () => {
      const r = el.getBoundingClientRect();
      setInlineRect({
        top: r.top,
        left: r.left,
        width: r.width,
        height: r.height
      });
    };
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    window.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    return () => {
      ro.disconnect();
      window.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
    };
  }, []);

  // Hold sealed briefly, then trigger the sleeve descent. Spring physics in
  // the R3F scene takes over from here.
  useEffect(() => {
    if (reduce) {
      setPhase("presenting");
      return;
    }
    const t1 = setTimeout(() => {
      setPhase("revealing");
      sounds.play("sleeve");
    }, 450);
    const t2 = setTimeout(() => setPhase("presenting"), 2400);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, [reduce, sounds]);

  const isFocused = phase === "focused";

  const handlePrint = () => {
    if (onPrint) return onPrint();
    if (typeof window !== "undefined") window.print();
  };

  const handleDownload = () => {
    if (onDownload) void onDownload();
  };

  const handleFocus = () => {
    sounds.play("focus");
    setPhase("focused");
  };

  const handleUnfocus = () => {
    sounds.play("unfocus");
    setPhase("presenting");
  };

  return (
    <div
      className={cn(instrumentSerif.className, "relative w-full", className)}
    >
      <div className="relative grid w-full grid-cols-1 gap-10 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] xl:gap-16">
        {/* Left: the R3F scene's inline slot. The View element itself lives
            here while presenting; it pops out to a fullscreen overlay on
            focus (see m.div below) — Framer Motion `layout` handles the
            transition without unmounting the scene. */}
        <div
          ref={inlineSlotRef}
          className="relative mx-auto aspect-[1/1.55] w-full max-w-[440px]"
        />

        {/* Right: meta card — fades out when focused so the close-up has room */}
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

      {/* Dimming backdrop when focused */}
      <AnimatePresence>
        {isFocused ? (
          <m.button
            key="backdrop"
            type="button"
            aria-label="Close inspection"
            onClick={handleUnfocus}
            className="fixed inset-0 z-30 bg-background/85 backdrop-blur-md"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4, ease: FILMIC }}
          />
        ) : null}
      </AnimatePresence>

      {/* Single View element — fixed-positioned, animates between the inline
          slot's bounds (tracked via getBoundingClientRect on inlineSlotRef)
          and a centered fullscreen-ish rect when focused. One InvoiceScene
          instance throughout, so the R3F scene never re-mounts. */}
      <m.div
        className="fixed z-40"
        animate={
          isFocused
            ? {
                top: "6vh",
                left: "50%",
                width: "auto",
                height: "88vh",
                x: "-50%",
                y: 0
              }
            : inlineRect
              ? {
                  top: inlineRect.top,
                  left: inlineRect.left,
                  width: inlineRect.width,
                  height: inlineRect.height,
                  x: 0,
                  y: 0
                }
              : { opacity: 0 }
        }
        transition={{ duration: 0.8, ease: FILMIC }}
        style={{ aspectRatio: "1 / 1.55" }}
      >
        <InvoiceScene
          invoice={invoice}
          phase={phase}
          containerProps={{ className: "absolute inset-0" }}
        />

        {phase === "presenting" || isFocused ? (
          <button
            type="button"
            aria-label={isFocused ? "Close inspection" : "Inspect invoice"}
            onClick={isFocused ? handleUnfocus : handleFocus}
            className={cn(
              "absolute inset-0 z-[60]",
              isFocused ? "cursor-zoom-out" : "cursor-zoom-in"
            )}
          />
        ) : null}
      </m.div>

      {/* Floating action rail — only when focused. Buttons are DOM (so they
          stay crisp / accessible / clickable); the scene is the visual. */}
      <AnimatePresence>
        {isFocused ? (
          <m.div
            className="fixed right-8 bottom-8 z-50 flex items-center gap-3"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5, ease: FILMIC, delay: 0.2 }}
          >
            <ActionButton onClick={handlePrint} label="Print" />
            {onDownload ? (
              <ActionButton onClick={handleDownload} label="Save" />
            ) : null}
            <ActionButton onClick={handleUnfocus} label="Close" muted />
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
