"use client";

import { useCallback, useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { RPage } from "@/components/UX/Transition";
import { cn } from "@/lib/utils";
import {
  FriendsTorrent,
  type FriendsTorrentPhoto
} from "@/components/sections/DayNNight/Immersive/FriendsTorrent";
import { SubtitleSequence } from "@/components/sections/DayNNight/Immersive/SubtitleSequence";

const PAST_EVENT_FILENAMES = [
  "KakaoTalk_Image_2026-05-21-03-03-19_001.jpeg",
  "KakaoTalk_Image_2026-05-21-03-03-19_002.jpeg",
  "KakaoTalk_Image_2026-05-21-03-03-19_003.jpeg",
  "KakaoTalk_Image_2026-05-21-03-03-20_004.jpeg",
  "partypic - 1.png",
  "partypic - 2.png",
  "partypic - 3.png",
  "partypic - 4.png",
  "partypic - 6.png",
  "partypic - 7.png",
  "partypic - 8.png",
  "partypic - 9.png",
  "partypic - 10.png",
  "partypic - 11.png",
  "partypic - 12.png",
  "partypic - 13.png",
  "partypica - 2.png",
  "partypica - 3.png",
  "partypica - 4.png",
  "partypica - 5.png"
];

const PHOTOS: FriendsTorrentPhoto[] = PAST_EVENT_FILENAMES.map((f) => ({
  src: encodeURI(`/assets/day-n-night/past-events/${f}`)
}));

type Mode = "flow" | "torrent-only";

export function PageClient() {
  const t = useTranslations("Event.DayNNight.dressCode.captions");
  // Memoized so SubtitleSequence's useEffect (deps include `captions`)
  // doesn't tear down the timeline on every parent re-render — most
  // notably when `torrentCued` flips mid-sequence.
  //
  // Mirrors the production caption sequence in ImmersiveView: Q&A
  // pair (topic + answer) → ownIt → refs (lead-in to the photos).
  const captions = useMemo(
    () => [
      <div key="qa" className="grid gap-3">
        <span className="font-sans text-[10px] tracking-[0.32em] text-white/65 uppercase md:text-[11px]">
          {t("topic")}
        </span>
        <span className="font-serif text-[clamp(1.35rem,2vw,1.85rem)] leading-[1.25] text-white/95">
          {t("answer")}
        </span>
      </div>,
      t("ownIt"),
      t("refs")
    ],
    [t]
  );

  const [mode, setMode] = useState<Mode>("flow");
  const [active, setActive] = useState(true);
  const [darken, setDarken] = useState(0.5);
  const [direction, setDirection] = useState<"left" | "right">("left");
  const [atmosphere, setAtmosphere] = useState(true);

  // Subtitle / orchestration state.
  const [perCardMs, setPerCardMs] = useState(1800);
  const [photoCueOffsetMs, setPhotoCueOffsetMs] = useState(500);
  const [replayKey, setReplayKey] = useState(0);
  const [torrentCued, setTorrentCued] = useState(false);

  const handlePhotoCue = useCallback(() => {
    setTorrentCued(true);
  }, []);

  const handleReplay = useCallback(() => {
    setTorrentCued(false);
    // bump replayKey on the next tick so React picks up the
    // torrentCued reset before the subtitle re-arms.
    setTimeout(() => setReplayKey((k) => k + 1), 16);
  }, []);

  // In "flow" mode the torrent waits for the photo cue. In
  // "torrent-only" mode the user's `active` checkbox controls it
  // directly — useful for isolated torrent iteration.
  const torrentActive = mode === "flow" ? active && torrentCued : active;

  // Row controls — order: back, mid, front. Defaults match component.
  const [speed0, setSpeed0] = useState(105);
  const [speed1, setSpeed1] = useState(68);
  const [speed2, setSpeed2] = useState(44);
  const [y0, setY0] = useState(8);
  const [y1, setY1] = useState(40);
  const [y2, setY2] = useState(70);
  const [scale0, setScale0] = useState(0.6);
  const [scale1, setScale1] = useState(0.9);
  const [scale2, setScale2] = useState(1.2);
  const [op0, setOp0] = useState(0.65);
  const [op1, setOp1] = useState(0.88);
  const [op2, setOp2] = useState(1.0);

  // Remount on speed/scale/y change so GSAP re-measures setWidth.
  // Cheaper than wiring a ResizeObserver into the component for the
  // dev harness; production wiring can keep things stable.
  const remountKey = `${speed0}-${speed1}-${speed2}-${y0}-${y1}-${y2}-${scale0}-${scale1}-${scale2}-${direction}`;

  return (
    <RPage type="pages" slug={["dn-friends-torrent"]}>
      <div
        className="relative h-screen w-full overflow-hidden"
        style={{ backgroundColor: "oklch(8% 0.02 280)" }}
      >
        <FriendsTorrent
          key={remountKey}
          photos={PHOTOS}
          active={torrentActive}
          darkenOpacity={darken}
          direction={direction}
          atmosphere={atmosphere}
          rowSpeeds={[speed0, speed1, speed2]}
          rowYOffsets={[`${y0}%`, `${y1}%`, `${y2}%`]}
          rowScales={[scale0, scale1, scale2]}
          rowOpacities={[op0, op1, op2]}
        />

        {mode === "flow" && (
          <SubtitleSequence
            captions={captions}
            active
            perCardMs={perCardMs}
            photoCueOffsetMs={photoCueOffsetMs}
            onPhotoCue={handlePhotoCue}
            replayKey={replayKey}
          />
        )}

        <ControlsPanel
          mode={mode}
          setMode={setMode}
          perCardMs={perCardMs}
          setPerCardMs={setPerCardMs}
          photoCueOffsetMs={photoCueOffsetMs}
          setPhotoCueOffsetMs={setPhotoCueOffsetMs}
          onReplay={handleReplay}
          active={active}
          setActive={setActive}
          darken={darken}
          setDarken={setDarken}
          direction={direction}
          setDirection={setDirection}
          atmosphere={atmosphere}
          setAtmosphere={setAtmosphere}
          speed0={speed0}
          setSpeed0={setSpeed0}
          speed1={speed1}
          setSpeed1={setSpeed1}
          speed2={speed2}
          setSpeed2={setSpeed2}
          y0={y0}
          setY0={setY0}
          y1={y1}
          setY1={setY1}
          y2={y2}
          setY2={setY2}
          scale0={scale0}
          setScale0={setScale0}
          scale1={scale1}
          setScale1={setScale1}
          scale2={scale2}
          setScale2={setScale2}
          op0={op0}
          setOp0={setOp0}
          op1={op1}
          setOp1={setOp1}
          op2={op2}
          setOp2={setOp2}
        />
      </div>
    </RPage>
  );
}

interface ControlsPanelProps {
  mode: Mode;
  setMode: (v: Mode) => void;
  perCardMs: number;
  setPerCardMs: (v: number) => void;
  photoCueOffsetMs: number;
  setPhotoCueOffsetMs: (v: number) => void;
  onReplay: () => void;
  active: boolean;
  setActive: (v: boolean) => void;
  darken: number;
  setDarken: (v: number) => void;
  direction: "left" | "right";
  setDirection: (v: "left" | "right") => void;
  atmosphere: boolean;
  setAtmosphere: (v: boolean) => void;
  speed0: number;
  setSpeed0: (v: number) => void;
  speed1: number;
  setSpeed1: (v: number) => void;
  speed2: number;
  setSpeed2: (v: number) => void;
  y0: number;
  setY0: (v: number) => void;
  y1: number;
  setY1: (v: number) => void;
  y2: number;
  setY2: (v: number) => void;
  scale0: number;
  setScale0: (v: number) => void;
  scale1: number;
  setScale1: (v: number) => void;
  scale2: number;
  setScale2: (v: number) => void;
  op0: number;
  setOp0: (v: number) => void;
  op1: number;
  setOp1: (v: number) => void;
  op2: number;
  setOp2: (v: number) => void;
}

function ControlsPanel(props: ControlsPanelProps) {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div
      className="absolute top-4 right-4 z-50 flex max-h-[92vh] w-[300px] flex-col gap-3 overflow-y-auto rounded-lg p-4 font-sans text-[11px] text-white/85 backdrop-blur-md"
      style={{ backgroundColor: "rgba(0,0,0,0.55)" }}
    >
      <div className="flex items-center justify-between">
        <span className="text-[10px] tracking-[0.24em] uppercase opacity-70">
          FriendsTorrent · dev
        </span>
        <button
          type="button"
          onClick={() => setCollapsed((c) => !c)}
          className="cursor-pointer rounded border border-white/20 px-2 py-1 text-[10px] hover:border-white/50"
        >
          {collapsed ? "show" : "hide"}
        </button>
      </div>

      {!collapsed && (
        <>
          <Section label="mode">
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => props.setMode("flow")}
                className={cn(
                  "cursor-pointer rounded border px-2 py-1",
                  props.mode === "flow" ? "border-white" : "border-white/20"
                )}
              >
                flow
              </button>
              <button
                type="button"
                onClick={() => props.setMode("torrent-only")}
                className={cn(
                  "cursor-pointer rounded border px-2 py-1",
                  props.mode === "torrent-only"
                    ? "border-white"
                    : "border-white/20"
                )}
              >
                torrent only
              </button>
              {props.mode === "flow" && (
                <button
                  type="button"
                  onClick={props.onReplay}
                  className="ml-auto cursor-pointer rounded border border-white/20 px-2 py-1 hover:border-white/60"
                >
                  ↺ replay
                </button>
              )}
            </div>
          </Section>

          {props.mode === "flow" && (
            <Section label="subtitle timing (ms)">
              <Slider
                label="per card"
                value={props.perCardMs}
                min={600}
                max={4000}
                step={50}
                onChange={props.setPerCardMs}
              />
              <Slider
                label="cue offset"
                value={props.photoCueOffsetMs}
                min={0}
                max={2000}
                step={50}
                onChange={props.setPhotoCueOffsetMs}
              />
            </Section>
          )}

          <div className="flex items-center justify-between gap-3">
            <label className="flex cursor-pointer items-center gap-2">
              <input
                type="checkbox"
                checked={props.active}
                onChange={(e) => props.setActive(e.target.checked)}
              />
              <span>active</span>
            </label>
            <label className="flex cursor-pointer items-center gap-2">
              <input
                type="checkbox"
                checked={props.atmosphere}
                onChange={(e) => props.setAtmosphere(e.target.checked)}
              />
              <span>atmosphere</span>
            </label>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => props.setDirection("left")}
                className={cn(
                  "cursor-pointer rounded border px-2 py-1",
                  props.direction === "left"
                    ? "border-white"
                    : "border-white/20"
                )}
              >
                ← left
              </button>
              <button
                type="button"
                onClick={() => props.setDirection("right")}
                className={cn(
                  "cursor-pointer rounded border px-2 py-1",
                  props.direction === "right"
                    ? "border-white"
                    : "border-white/20"
                )}
              >
                right →
              </button>
            </div>
          </div>

          <Slider
            label="darken"
            value={props.darken}
            min={0}
            max={1}
            step={0.05}
            onChange={props.setDarken}
          />

          <Section label="speed (s/cycle, larger = slower)">
            <Slider
              label="back"
              value={props.speed0}
              min={10}
              max={180}
              step={1}
              onChange={props.setSpeed0}
            />
            <Slider
              label="mid"
              value={props.speed1}
              min={10}
              max={180}
              step={1}
              onChange={props.setSpeed1}
            />
            <Slider
              label="front"
              value={props.speed2}
              min={10}
              max={180}
              step={1}
              onChange={props.setSpeed2}
            />
          </Section>

          <Section label="vertical (%)">
            <Slider
              label="back"
              value={props.y0}
              min={-10}
              max={90}
              step={1}
              onChange={props.setY0}
            />
            <Slider
              label="mid"
              value={props.y1}
              min={-10}
              max={90}
              step={1}
              onChange={props.setY1}
            />
            <Slider
              label="front"
              value={props.y2}
              min={-10}
              max={90}
              step={1}
              onChange={props.setY2}
            />
          </Section>

          <Section label="scale">
            <Slider
              label="back"
              value={props.scale0}
              min={0.3}
              max={1.8}
              step={0.01}
              onChange={props.setScale0}
            />
            <Slider
              label="mid"
              value={props.scale1}
              min={0.3}
              max={1.8}
              step={0.01}
              onChange={props.setScale1}
            />
            <Slider
              label="front"
              value={props.scale2}
              min={0.3}
              max={1.8}
              step={0.01}
              onChange={props.setScale2}
            />
          </Section>

          <Section label="row opacity">
            <Slider
              label="back"
              value={props.op0}
              min={0}
              max={1}
              step={0.05}
              onChange={props.setOp0}
            />
            <Slider
              label="mid"
              value={props.op1}
              min={0}
              max={1}
              step={0.05}
              onChange={props.setOp1}
            />
            <Slider
              label="front"
              value={props.op2}
              min={0}
              max={1}
              step={0.05}
              onChange={props.setOp2}
            />
          </Section>
        </>
      )}
    </div>
  );
}

function Section({
  label,
  children
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="grid gap-1.5 border-t border-white/15 pt-2">
      <span className="text-[9px] tracking-[0.2em] uppercase opacity-60">
        {label}
      </span>
      {children}
    </div>
  );
}

interface SliderProps {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (v: number) => void;
}

function Slider({ label, value, min, max, step, onChange }: SliderProps) {
  return (
    <label className="grid grid-cols-[60px_1fr_50px] items-center gap-2">
      <span className="opacity-70">{label}</span>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        className="cursor-pointer accent-white"
      />
      <span className="text-right tabular-nums opacity-80">
        {Number.isInteger(step) ? value : value.toFixed(2)}
      </span>
    </label>
  );
}
