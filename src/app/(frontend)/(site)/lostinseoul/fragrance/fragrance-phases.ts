/**
 * Content phases for the Catalyst chapter — the five scenes of the reaction.
 *
 * These are ANCHORS for the editorial layer (the discrete sections of the
 * reduced-motion twin, and where commerce resolves). They are the psychology
 * and the chemistry at once: inert → contact → ignition → peak → afterglow.
 *
 * The WebGL scene does NOT step through these as hard chapters. The ember
 * reaction field (see fragrance-light.ts) is a continuous function of raw
 * scroll progress so it breathes; the phases exist for the type and for
 * commerce, not to quantise the light.
 *
 * See readmes/LOSTINSEOUL_FRAGRANCE.md §8 for the locked script.
 */

export type LostFragrancePhaseId =
  "dormant" | "contact" | "ignition" | "peak" | "held";

export type LostFragrancePhase = {
  id: LostFragrancePhaseId;
  start: number;
  end: number;
};

export const LOST_FRAGRANCE_PHASES: LostFragrancePhase[] = [
  { id: "dormant", start: 0, end: 0.18 },
  { id: "contact", start: 0.18, end: 0.34 },
  { id: "ignition", start: 0.34, end: 0.6 },
  { id: "peak", start: 0.6, end: 0.82 },
  { id: "held", start: 0.82, end: 1 }
];

export function getLostFragranceActivePhase(
  progress: number,
  phases: LostFragrancePhase[] = LOST_FRAGRANCE_PHASES
): LostFragrancePhaseId {
  if (!Number.isFinite(progress) || phases.length === 0) return "dormant";
  const clamped = Math.min(Math.max(progress, 0), 1);
  const active = phases.find(
    (phase) => clamped >= phase.start && clamped < phase.end
  );
  return active?.id ?? phases[phases.length - 1].id;
}

export function getLostFragrancePhaseProgress(
  progress: number,
  phase: LostFragrancePhase
): number {
  const span = phase.end - phase.start;
  if (!Number.isFinite(progress) || span <= 0) return 0;
  const clamped = Math.min(Math.max(progress, phase.start), phase.end);
  return (clamped - phase.start) / span;
}
