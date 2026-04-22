"use client";

import { useState } from "react";
import {
  CHIP_KEYS,
  DISPATCH_KEYS,
  TOAST_KEYS,
  TOOLTIP_KEYS,
  ComingSoonCard,
  ComingSoonDialog,
  ComingSoonPanel,
  ComingSoonSection,
  ComingSoonTag,
  useComingSoon,
  type ChipLabel,
  type DispatchKey,
  type ToastKey,
  type TooltipKey
} from "@/components/UX/ComingSoon";

export default function PageClient() {
  const { nudge } = useComingSoon();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [activeChip, setActiveChip] = useState<ChipLabel>("default");
  const [activeDispatch, setActiveDispatch] = useState<DispatchKey>("default");

  return (
    <div className="mx-auto max-w-7xl px-6 py-16 xl:px-10">
      <header className="mb-16 border-b border-border/30 pb-8">
        <p className="font-mono text-[10px] tracking-[0.2em] text-muted-foreground/60 uppercase">
          Dev / ComingSoon
        </p>
        <h1 className="mt-2 text-3xl font-light tracking-tight xl:text-4xl">
          Coming Soon System
        </h1>
        <p className="mt-3 max-w-xl font-mono text-[11px] leading-relaxed text-muted-foreground/70">
          All variants and copy keys. Switch locale in the site header to verify
          EN ↔ KO rendering.
        </p>
      </header>

      {/* Tags */}
      <DevSection title="Tag — all chip presets">
        <div className="flex flex-wrap gap-3">
          {CHIP_KEYS.map((key) => (
            <ComingSoonTag key={key} preset={key as ChipLabel} tone="soft" />
          ))}
        </div>
        <div className="mt-4 flex flex-wrap gap-3">
          {CHIP_KEYS.map((key) => (
            <ComingSoonTag key={key} preset={key as ChipLabel} tone="firm" />
          ))}
        </div>
      </DevSection>

      <DevSection title="Tag — tooltip variants">
        <div className="flex flex-wrap gap-3">
          {TOOLTIP_KEYS.map((key) => (
            <ComingSoonTag
              key={key}
              preset="default"
              tooltip={key as TooltipKey}
              label={key}
            />
          ))}
          <ComingSoonTag preset="default" tooltip={false} label="no tooltip" />
        </div>
      </DevSection>

      <DevSection title="Tag — interactive (onClick)">
        <div className="flex flex-wrap gap-3">
          {CHIP_KEYS.map((key) => (
            <ComingSoonTag
              key={key}
              preset={key as ChipLabel}
              tone="soft"
              onClick={() => setActiveChip(key as ChipLabel)}
            />
          ))}
        </div>
        <p className="mt-3 font-mono text-[11px] text-muted-foreground/60">
          Active: <span className="text-foreground/80">{activeChip}</span>
        </p>
      </DevSection>

      {/* Toasts */}
      <DevSection title="useComingSoon — toast nudges">
        <div className="flex flex-wrap gap-3">
          {TOAST_KEYS.map((key) => (
            <button
              key={key}
              type="button"
              onClick={() => nudge(key as ToastKey)}
              className="border border-border/40 px-4 py-2 font-mono text-[11px] tracking-widest text-foreground/70 uppercase transition-colors hover:border-border hover:text-foreground"
            >
              {key}
            </button>
          ))}
        </div>
      </DevSection>

      {/* Cards */}
      <DevSection title="Card — all presets, portrait aspect">
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4 xl:grid-cols-8">
          {CHIP_KEYS.map((key) => (
            <ComingSoonCard
              key={key}
              preset={key as ChipLabel}
              aspect="portrait"
            />
          ))}
        </div>
      </DevSection>

      <DevSection title="Card — aspect ratios">
        <div className="flex flex-wrap gap-8">
          {(
            [
              { aspect: "square", w: "w-48" },
              { aspect: "portrait", w: "w-40" },
              { aspect: "video", w: "w-64" }
            ] as const
          ).map(({ aspect, w }) => (
            <figure key={aspect} className={`flex flex-col gap-2 ${w}`}>
              <figcaption className="font-mono text-[9px] tracking-[0.2em] text-muted-foreground/50 uppercase">
                {aspect}
              </figcaption>
              <ComingSoonCard aspect={aspect} />
            </figure>
          ))}
        </div>
      </DevSection>

      {/* Section strip */}
      <DevSection title="Section — all presets">
        <div className="flex flex-col">
          {CHIP_KEYS.map((key) => (
            <ComingSoonSection key={key} preset={key as ChipLabel} />
          ))}
        </div>
      </DevSection>

      {/* Dialog */}
      <DevSection title="Dialog — dispatch variants">
        <div className="flex flex-wrap gap-3">
          {DISPATCH_KEYS.map((key) => (
            <button
              key={key}
              type="button"
              onClick={() => {
                setActiveDispatch(key as DispatchKey);
                setDialogOpen(true);
              }}
              className="border border-border/40 px-4 py-2 font-mono text-[11px] tracking-widest text-foreground/70 uppercase transition-colors hover:border-border hover:text-foreground"
            >
              {key}
            </button>
          ))}
        </div>
        <ComingSoonDialog
          title="Something, eventually."
          dispatch={activeDispatch}
          open={dialogOpen}
          onOpenChange={setDialogOpen}
        />
      </DevSection>

      {/* Panel */}
      <DevSection title="Panel — all dispatch variants">
        <div className="divide-y divide-border/20 border border-border/20">
          {DISPATCH_KEYS.map((key) => (
            <ComingSoonPanel
              key={key}
              title="Something, eventually."
              dispatch={key as DispatchKey}
              notify={false}
              className="min-h-0 py-12"
            />
          ))}
        </div>
      </DevSection>

      <DevSection title="Panel — full with notify form">
        <ComingSoonPanel
          title="Something, eventually."
          dispatch="composing"
          preset="wetInk"
          topic="dev-test"
        />
      </DevSection>
    </div>
  );
}

function DevSection({
  title,
  children
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="mt-16">
      <div className="mb-6 border-b border-border/20 pb-3">
        <p className="font-mono text-[10px] tracking-[0.2em] text-muted-foreground/60 uppercase">
          {title}
        </p>
      </div>
      {children}
    </section>
  );
}
