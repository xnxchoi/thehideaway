export type TapePlayerVariant = "hero" | "sidebar" | "drawer" | "full";

export type SpeedDialMode = "rate" | "scrub";

export type TapePlayerProps = {
  variant: TapePlayerVariant;
  scrollHint?: boolean;
  className?: string;
};

export type LayoutSize = {
  reelDiameter: number;
  counterHeight: number;
  transportHeight: number;
};

export type HapticPattern = "tick" | "impact" | "heavy" | "selection";

export type TransportControlProps = {
  compact?: boolean;
  showDial?: boolean;
  className?: string;
};

export type TapeReelProps = {
  diameter: number;
  progress: number; // 0–1
  playing: boolean;
  playbackRate: number;
  className?: string;
};

export type ProgressRailProps = {
  thin?: boolean;
  className?: string;
};
