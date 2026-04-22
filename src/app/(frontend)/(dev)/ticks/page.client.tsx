"use client";

import { useEffect, useState } from "react";

import { TickDial, TickIndicator } from "@/components/ui/tick-indicator";

export default function PageClient() {
  const [value, setValue] = useState(0.42);
  const [autoplay, setAutoplay] = useState(false);
  const [ticks, setTicks] = useState(48);
  const [magnifyRadius, setMagnifyRadius] = useState(4);
  const [magnifyStrength, setMagnifyStrength] = useState(0.55);
  const [stiffness, setStiffness] = useState(700);
  const [damping, setDamping] = useState(28);
  const [mass, setMass] = useState(0.6);
  const [magnifyAtEnds, setMagnifyAtEnds] = useState(false);
  const [accent, setAccent] = useState<string>("oklch(78% 0.16 82)");
  const [useAccent, setUseAccent] = useState(true);
  const [accentIntensity, setAccentIntensity] = useState(0.5);
  const [entranceStagger, setEntranceStagger] = useState(18);
  const [entranceKey, setEntranceKey] = useState(0);

  const springConfig = { stiffness, damping, mass };
  const effectiveAccent = useAccent ? accent : undefined;
  const replayEntrance = () => setEntranceKey((k) => k + 1);

  useEffect(() => {
    if (!autoplay) return;
    let raf = 0;
    let start = performance.now();
    const loop = (t: number) => {
      const elapsed = (t - start) / 4000;
      setValue(elapsed % 1);
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [autoplay]);

  return (
    <div className="mx-auto max-w-7xl px-6 py-16 xl:px-10">
      <header className="mb-16 border-b border-border/30 pb-8">
        <p className="font-mono text-[10px] tracking-[0.2em] text-muted-foreground/60 uppercase">
          Dev / Indicators
        </p>
        <h1 className="mt-2 text-3xl font-light tracking-tight xl:text-4xl">
          Tick Indicator
        </h1>
        <p className="mt-3 max-w-xl font-mono text-[11px] leading-relaxed text-muted-foreground/70">
          Discrete chronograph-style indicators adapted from Fey into Hideaway
          tokens. Adjust below to verify magnification, focal behavior, and prop
          sync.
        </p>
      </header>

      <Controls
        value={value}
        setValue={setValue}
        autoplay={autoplay}
        setAutoplay={setAutoplay}
        ticks={ticks}
        setTicks={setTicks}
        magnifyRadius={magnifyRadius}
        setMagnifyRadius={setMagnifyRadius}
        magnifyStrength={magnifyStrength}
        setMagnifyStrength={setMagnifyStrength}
        stiffness={stiffness}
        setStiffness={setStiffness}
        damping={damping}
        setDamping={setDamping}
        mass={mass}
        setMass={setMass}
        magnifyAtEnds={magnifyAtEnds}
        setMagnifyAtEnds={setMagnifyAtEnds}
        useAccent={useAccent}
        setUseAccent={setUseAccent}
        accent={accent}
        setAccent={setAccent}
        accentIntensity={accentIntensity}
        setAccentIntensity={setAccentIntensity}
        entranceStagger={entranceStagger}
        setEntranceStagger={setEntranceStagger}
        replayEntrance={replayEntrance}
      />

      <section className="mt-16 grid gap-12 lg:grid-cols-2">
        <Variant label="Linear — fill">
          <TickIndicator
            value={value}
            mode="fill"
            ticks={ticks}
            magnifyRadius={magnifyRadius}
            magnifyStrength={magnifyStrength}
            magnifyAtEnds={magnifyAtEnds}
            accent={effectiveAccent}
            accentIntensity={accentIntensity}
            springConfig={springConfig}
          />
        </Variant>

        <Variant label="Linear — focus (magnification on)">
          <TickIndicator
            value={value}
            mode="focus"
            ticks={ticks}
            magnifyRadius={magnifyRadius}
            magnifyStrength={magnifyStrength}
            magnifyAtEnds={magnifyAtEnds}
            accent={effectiveAccent}
            accentIntensity={accentIntensity}
            springConfig={springConfig}
          />
        </Variant>

        <Variant label="Linear — fill + magnify">
          <TickIndicator
            value={value}
            mode="fill"
            ticks={ticks}
            magnify
            magnifyRadius={magnifyRadius}
            magnifyStrength={magnifyStrength}
            magnifyAtEnds={magnifyAtEnds}
            accent={effectiveAccent}
            accentIntensity={accentIntensity}
            springConfig={springConfig}
          />
        </Variant>

        <Variant label="Linear — focus, no magnify">
          <TickIndicator
            value={value}
            mode="focus"
            ticks={ticks}
            magnify={false}
            accent={effectiveAccent}
            accentIntensity={accentIntensity}
          />
        </Variant>
      </section>

      <section className="mt-20 grid gap-12 lg:grid-cols-3">
        <Variant label="Dial — fill, full loop">
          <TickDial
            value={value}
            mode="fill"
            ticks={60}
            size={180}
            magnifyRadius={magnifyRadius}
            magnifyStrength={magnifyStrength}
            magnifyAtEnds={magnifyAtEnds}
            accent={effectiveAccent}
            accentIntensity={accentIntensity}
            springConfig={springConfig}
          />
        </Variant>

        <Variant label="Dial — focus, full loop">
          <TickDial
            value={value}
            mode="focus"
            ticks={60}
            size={180}
            magnifyRadius={magnifyRadius}
            magnifyStrength={magnifyStrength}
            magnifyAtEnds={magnifyAtEnds}
            accent={effectiveAccent}
            accentIntensity={accentIntensity}
            springConfig={springConfig}
          />
        </Variant>

        <Variant label="Dial — focus arc (−120° → 120°)">
          <TickDial
            value={value}
            mode="focus"
            ticks={40}
            size={180}
            startAngle={-120}
            endAngle={120}
            magnifyRadius={magnifyRadius}
            magnifyStrength={magnifyStrength}
            magnifyAtEnds={magnifyAtEnds}
            accent={effectiveAccent}
            accentIntensity={accentIntensity}
            springConfig={springConfig}
          />
        </Variant>
      </section>

      <section className="mt-20">
        <div className="mb-6 flex items-center justify-between">
          <p className="font-mono text-[10px] tracking-[0.2em] text-muted-foreground/70 uppercase">
            Entrance — staggered radial / horizontal sweep
          </p>
          <button
            type="button"
            onClick={replayEntrance}
            className="border border-border/40 px-4 py-2 font-mono text-[11px] tracking-widest text-foreground/80 uppercase transition-colors hover:border-border hover:text-foreground"
          >
            Replay
          </button>
        </div>
        <div className="grid gap-12 lg:grid-cols-3">
          <Variant label="Dial — radial sweep in">
            <TickDial
              key={`dial-full-${entranceKey}`}
              value={value}
              mode="focus"
              ticks={60}
              size={180}
              entrance
              entranceStagger={entranceStagger}
              accent={effectiveAccent}
              accentIntensity={accentIntensity}
              magnifyRadius={magnifyRadius}
              magnifyStrength={magnifyStrength}
              magnifyAtEnds={magnifyAtEnds}
              springConfig={springConfig}
            />
          </Variant>

          <Variant label="Dial — arc sweep">
            <TickDial
              key={`dial-arc-${entranceKey}`}
              value={value}
              mode="focus"
              ticks={40}
              size={180}
              startAngle={-120}
              endAngle={120}
              entrance
              entranceStagger={entranceStagger}
              accent={effectiveAccent}
              accentIntensity={accentIntensity}
              magnifyRadius={magnifyRadius}
              magnifyStrength={magnifyStrength}
              magnifyAtEnds={magnifyAtEnds}
              springConfig={springConfig}
            />
          </Variant>

          <Variant label="Linear — horizontal sweep">
            <TickIndicator
              key={`linear-${entranceKey}`}
              value={value}
              mode="focus"
              ticks={ticks}
              entrance
              entranceStagger={entranceStagger}
              accent={effectiveAccent}
              accentIntensity={accentIntensity}
              magnifyRadius={magnifyRadius}
              magnifyStrength={magnifyStrength}
              magnifyAtEnds={magnifyAtEnds}
              springConfig={springConfig}
            />
          </Variant>
        </div>
      </section>

      <section className="mt-20">
        <Variant label="Dense linear (120 ticks)">
          <TickIndicator
            value={value}
            mode="focus"
            ticks={120}
            accent={effectiveAccent}
            accentIntensity={accentIntensity}
          />
        </Variant>
      </section>
    </div>
  );
}

interface ControlsProps {
  value: number;
  setValue: (v: number) => void;
  autoplay: boolean;
  setAutoplay: (b: boolean) => void;
  ticks: number;
  setTicks: (n: number) => void;
  magnifyRadius: number;
  setMagnifyRadius: (n: number) => void;
  magnifyStrength: number;
  setMagnifyStrength: (n: number) => void;
  stiffness: number;
  setStiffness: (n: number) => void;
  damping: number;
  setDamping: (n: number) => void;
  mass: number;
  setMass: (n: number) => void;
  magnifyAtEnds: boolean;
  setMagnifyAtEnds: (b: boolean) => void;
  useAccent: boolean;
  setUseAccent: (b: boolean) => void;
  accent: string;
  setAccent: (s: string) => void;
  entranceStagger: number;
  setEntranceStagger: (n: number) => void;
  replayEntrance: () => void;
}

function Controls({
  value,
  setValue,
  autoplay,
  setAutoplay,
  ticks,
  setTicks,
  magnifyRadius,
  setMagnifyRadius,
  magnifyStrength,
  setMagnifyStrength,
  stiffness,
  setStiffness,
  damping,
  setDamping,
  mass,
  setMass,
  magnifyAtEnds,
  setMagnifyAtEnds,
  useAccent,
  setUseAccent,
  accent,
  setAccent,
  entranceStagger,
  setEntranceStagger,
  replayEntrance
}: ControlsProps) {
  const accentPresets = [
    { label: "Amber", value: "oklch(78% 0.16 82)" },
    { label: "Teal", value: "oklch(72% 0.13 190)" },
    { label: "Rose", value: "oklch(72% 0.18 12)" },
    { label: "Violet", value: "oklch(70% 0.18 290)" },
    { label: "Lime", value: "oklch(86% 0.18 120)" }
  ];
  return (
    <div className="grid gap-5 rounded-sm border border-border/20 bg-card p-5 md:grid-cols-2">
      <Field label="Value" hint={value.toFixed(3)}>
        <input
          type="range"
          min={0}
          max={1}
          step={0.001}
          value={value}
          onChange={(e) => setValue(Number(e.target.value))}
          className="w-full"
          disabled={autoplay}
        />
      </Field>

      <Field label="Autoplay" hint={autoplay ? "on" : "off"}>
        <button
          type="button"
          onClick={() => setAutoplay(!autoplay)}
          className="border border-border/40 px-4 py-2 font-mono text-[11px] tracking-widest text-foreground/80 uppercase transition-colors hover:border-border hover:text-foreground"
        >
          {autoplay ? "Pause" : "Start"}
        </button>
      </Field>

      <Field label="Ticks (linear)" hint={String(ticks)}>
        <input
          type="range"
          min={12}
          max={120}
          step={1}
          value={ticks}
          onChange={(e) => setTicks(Number(e.target.value))}
          className="w-full"
        />
      </Field>

      <Field label="Magnify radius" hint={String(magnifyRadius)}>
        <input
          type="range"
          min={1}
          max={12}
          step={1}
          value={magnifyRadius}
          onChange={(e) => setMagnifyRadius(Number(e.target.value))}
          className="w-full"
        />
      </Field>

      <Field label="Magnify strength" hint={magnifyStrength.toFixed(2)}>
        <input
          type="range"
          min={0}
          max={1.5}
          step={0.01}
          value={magnifyStrength}
          onChange={(e) => setMagnifyStrength(Number(e.target.value))}
          className="w-full"
        />
      </Field>

      <Field label="Spring stiffness" hint={String(stiffness)}>
        <input
          type="range"
          min={50}
          max={1500}
          step={10}
          value={stiffness}
          onChange={(e) => setStiffness(Number(e.target.value))}
          className="w-full"
        />
      </Field>

      <Field label="Spring damping" hint={String(damping)}>
        <input
          type="range"
          min={5}
          max={80}
          step={1}
          value={damping}
          onChange={(e) => setDamping(Number(e.target.value))}
          className="w-full"
        />
      </Field>

      <Field label="Spring mass" hint={mass.toFixed(2)}>
        <input
          type="range"
          min={0.1}
          max={3}
          step={0.05}
          value={mass}
          onChange={(e) => setMass(Number(e.target.value))}
          className="w-full"
        />
      </Field>

      <Field
        label="Magnify at ends"
        hint={magnifyAtEnds ? "on (always bump)" : "off (clean 0 / max)"}
      >
        <button
          type="button"
          onClick={() => setMagnifyAtEnds(!magnifyAtEnds)}
          className="border border-border/40 px-4 py-2 font-mono text-[11px] tracking-widest text-foreground/80 uppercase transition-colors hover:border-border hover:text-foreground"
        >
          {magnifyAtEnds ? "Disable" : "Enable"}
        </button>
      </Field>

      <Field label="Accent color" hint={useAccent ? accent : "currentColor"}>
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setUseAccent(!useAccent)}
            className="border border-border/40 px-3 py-1.5 font-mono text-[10px] tracking-widest text-foreground/80 uppercase transition-colors hover:border-border hover:text-foreground"
          >
            {useAccent ? "Mono" : "Accent"}
          </button>
          {accentPresets.map((p) => (
            <button
              key={p.value}
              type="button"
              onClick={() => {
                setAccent(p.value);
                setUseAccent(true);
              }}
              aria-label={p.label}
              className="h-6 w-6 rounded-full border border-border/40 transition-transform hover:scale-110"
              style={{ background: p.value }}
            />
          ))}
        </div>
      </Field>

      <Field label="Entrance stagger (ms)" hint={String(entranceStagger)}>
        <input
          type="range"
          min={0}
          max={60}
          step={1}
          value={entranceStagger}
          onChange={(e) => setEntranceStagger(Number(e.target.value))}
          className="w-full"
        />
      </Field>

      <Field label="Replay entrance" hint="remount + resweep">
        <button
          type="button"
          onClick={replayEntrance}
          className="border border-border/40 px-4 py-2 font-mono text-[11px] tracking-widest text-foreground/80 uppercase transition-colors hover:border-border hover:text-foreground"
        >
          Replay
        </button>
      </Field>
    </div>
  );
}

function Field({
  label,
  hint,
  children
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="flex flex-col gap-2">
      <span className="flex items-baseline justify-between">
        <span className="font-mono text-[10px] tracking-[0.2em] text-muted-foreground/70 uppercase">
          {label}
        </span>
        {hint ? (
          <span className="font-mono text-[10px] text-muted-foreground/60">
            {hint}
          </span>
        ) : null}
      </span>
      {children}
    </label>
  );
}

function Variant({
  label,
  children
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <figure className="flex flex-col gap-4">
      <figcaption className="font-mono text-[10px] tracking-[0.2em] text-muted-foreground/70 uppercase">
        {label}
      </figcaption>
      <div className="flex min-h-[60px] items-center rounded-sm border border-border/20 bg-card p-5">
        {children}
      </div>
    </figure>
  );
}
