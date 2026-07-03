export type LostFragranceBeatId =
  | "arrival"
  | "neon"
  | "rain"
  | "sodium"
  | "dawn"
  | "reveal";

export type LostFragranceBeat = {
  id: LostFragranceBeatId;
  start: number;
  end: number;
};

export const LOST_FRAGRANCE_BEATS: LostFragranceBeat[] = [
  { id: "arrival", start: 0, end: 0.16 },
  { id: "neon", start: 0.16, end: 0.36 },
  { id: "rain", start: 0.36, end: 0.56 },
  { id: "sodium", start: 0.56, end: 0.74 },
  { id: "dawn", start: 0.74, end: 0.88 },
  { id: "reveal", start: 0.88, end: 1 }
];

export function getLostFragranceActiveBeat(
  progress: number,
  beats: LostFragranceBeat[] = LOST_FRAGRANCE_BEATS
): LostFragranceBeatId {
  if (!Number.isFinite(progress) || beats.length === 0) return "arrival";
  const clamped = Math.min(Math.max(progress, 0), 1);
  const active = beats.find(
    (beat) => clamped >= beat.start && clamped < beat.end
  );
  return active?.id ?? beats[beats.length - 1].id;
}

export function getLostFragranceBeatProgress(
  progress: number,
  beat: LostFragranceBeat
): number {
  const span = beat.end - beat.start;
  if (!Number.isFinite(progress) || span <= 0) return 0;
  const clamped = Math.min(Math.max(progress, beat.start), beat.end);
  return (clamped - beat.start) / span;
}
