import type { LostFragranceBeatId } from "./fragrance-beats";

export type LostFragranceLightState = {
  /** scene fog / clear color */
  fog: string;
  /** key light color */
  key: string;
  /** rim / counter light color */
  rim: string;
  /** the beat accent surfaced in DOM chrome (eyebrows, glows) */
  accent: string;
  keyIntensity: number;
  rimIntensity: number;
  ambientIntensity: number;
  /** rain particle visibility 0..1 */
  rain: number;
  /** haze / mote visibility 0..1 */
  haze: number;
  /** tone-mapping exposure */
  exposure: number;
  /** wet-asphalt reflectivity 0..1 */
  wet: number;
  /** lit-window brightness 0..1 */
  windows: number;
  /** neon signage intensity 0..1 */
  signs: number;
};

export const LOST_FRAGRANCE_LIGHTS: Record<
  LostFragranceBeatId,
  LostFragranceLightState
> = {
  arrival: {
    fog: "#07080a",
    key: "#aab4c4",
    rim: "#39424f",
    accent: "#9aa3ad",
    keyIntensity: 14,
    rimIntensity: 4,
    ambientIntensity: 0.05,
    rain: 0,
    haze: 0.25,
    exposure: 0.9,
    wet: 0.45,
    windows: 0.85,
    signs: 0.5
  },
  neon: {
    fog: "#0a060d",
    key: "#ff3d7f",
    rim: "#2de2e6",
    accent: "#ff3d7f",
    keyIntensity: 30,
    rimIntensity: 16,
    ambientIntensity: 0.04,
    rain: 0.1,
    haze: 1,
    exposure: 1.05,
    wet: 0.75,
    windows: 0.7,
    signs: 1.0
  },
  rain: {
    fog: "#05070b",
    key: "#4f6b8f",
    rim: "#8fa3bd",
    accent: "#8fa3bd",
    keyIntensity: 22,
    rimIntensity: 10,
    ambientIntensity: 0.06,
    rain: 1,
    haze: 0.35,
    exposure: 0.95,
    wet: 1.0,
    windows: 0.5,
    signs: 0.55
  },
  sodium: {
    fog: "#0a0703",
    key: "#ff9f45",
    rim: "#b56a1e",
    accent: "#ffb45e",
    keyIntensity: 26,
    rimIntensity: 8,
    ambientIntensity: 0.05,
    rain: 0.15,
    haze: 0.6,
    exposure: 1,
    wet: 0.6,
    windows: 0.35,
    signs: 0.3
  },
  dawn: {
    fog: "#191a1e",
    key: "#e8ded2",
    rim: "#93a0b4",
    accent: "#e8ded2",
    keyIntensity: 18,
    rimIntensity: 12,
    ambientIntensity: 0.22,
    rain: 0,
    haze: 0.2,
    exposure: 1.12,
    wet: 0.35,
    windows: 0.15,
    signs: 0.1
  },
  reveal: {
    fog: "#111214",
    key: "#d29a5a",
    rim: "#6b7280",
    accent: "#d29a5a",
    keyIntensity: 20,
    rimIntensity: 6,
    ambientIntensity: 0.16,
    rain: 0,
    haze: 0.3,
    exposure: 1.08,
    wet: 0.55,
    windows: 0.25,
    signs: 0.2
  }
};
