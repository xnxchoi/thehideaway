export const DURATION = Object.freeze({
  S: 0.6
});
export const EASE = Object.freeze({
  p3eo: "Power3.easeOut",
  p3eio: "Power3.easeInOut",
  p3ei: "Power3.easeIn"
});
export const VIEW_DIMENSIONS = Object.freeze({
  top: 10,
  right: 10,
  bottom: 20,
  left: 10
});
const ee = Object.freeze({
  power1: {
    in: [0.55, 0.085, 0.68, 0.53],
    out: [0.25, 0.46, 0.45, 0.94],
    inOut: [0.445, 0.05, 0.55, 0.95]
  },
  power2: {
    in: [0.55, 0.055, 0.675, 0.19],
    out: [0.25, 0.46, 0.45, 0.94],
    inOut: [0.455, 0.03, 0.515, 0.955]
  },
  power3: {
    in: [0.895, 0.03, 0.685, 0.22],
    out: [0.165, 0.84, 0.44, 1],
    inOut: [0.77, 0, 0.175, 1]
  },
  power4: {
    in: [0.895, 0.03, 0.685, 0.22],
    out: [0.165, 0.84, 0.44, 1],
    inOut: [0.76, 0, 0.24, 1]
  }
});
export type EASE_NAMES = keyof typeof ee;
export type EASE_VARIANT = Readonly<
  Record<
    EASE_NAMES,
    Record<"in" | "out" | "inOut", [number, number, number, number]>
  >
>;
export const EASING = ee as EASE_VARIANT;
