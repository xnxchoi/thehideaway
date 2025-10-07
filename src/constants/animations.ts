export const DURATION = Object.freeze({
  S: 0.6
});
export const EASE = Object.freeze({
  p3eo: "power3.out",
  p3eio: "power3.inOut",
  p3ei: "power3.in"
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

type SpringCfg = {
  stiffness: number;
  damping: number;
  mass?: number;
  velocity?: number;
  restDelta?: number;
  restSpeed?: number;
};

export const springGSAP: {
  power1: { in: SpringCfg; out: SpringCfg; inOut: SpringCfg };
  power2: { in: SpringCfg; out: SpringCfg; inOut: SpringCfg };
  power3: { in: SpringCfg; out: SpringCfg; inOut: SpringCfg };
  power4: { in: SpringCfg; out: SpringCfg; inOut: SpringCfg };
} = {
  power1: {
    in: {
      stiffness: 100,
      damping: 24,
      mass: 1,
      velocity: 0,
      restDelta: 0.001,
      restSpeed: 0.01
    },
    out: {
      stiffness: 150,
      damping: 28,
      mass: 1,
      velocity: 2,
      restDelta: 0.001,
      restSpeed: 0.01
    },
    inOut: {
      stiffness: 130,
      damping: 26,
      mass: 1,
      velocity: 0,
      restDelta: 0.001,
      restSpeed: 0.01
    }
  },
  power2: {
    in: {
      stiffness: 180,
      damping: 32,
      mass: 1,
      velocity: 0,
      restDelta: 0.001,
      restSpeed: 0.01
    },
    out: {
      stiffness: 230,
      damping: 36,
      mass: 1,
      velocity: 2,
      restDelta: 0.001,
      restSpeed: 0.01
    },
    inOut: {
      stiffness: 210,
      damping: 34,
      mass: 1,
      velocity: 0,
      restDelta: 0.001,
      restSpeed: 0.01
    }
  },
  power3: {
    in: {
      stiffness: 260,
      damping: 38,
      mass: 1,
      velocity: 0,
      restDelta: 0.001,
      restSpeed: 0.01
    },
    out: {
      stiffness: 320,
      damping: 42,
      mass: 1,
      velocity: 2,
      restDelta: 0.001,
      restSpeed: 0.01
    },
    inOut: {
      stiffness: 300,
      damping: 40,
      mass: 1,
      velocity: 0,
      restDelta: 0.001,
      restSpeed: 0.01
    }
  },
  power4: {
    in: {
      stiffness: 360,
      damping: 46,
      mass: 1,
      velocity: 0,
      restDelta: 0.001,
      restSpeed: 0.01
    },
    out: {
      stiffness: 440,
      damping: 50,
      mass: 1,
      velocity: 2,
      restDelta: 0.001,
      restSpeed: 0.01
    },
    inOut: {
      stiffness: 400,
      damping: 48,
      mass: 1,
      velocity: 0,
      restDelta: 0.001,
      restSpeed: 0.01
    }
  }
};

// Helper: if animating toward a lower target, flip velocity sign on the "out" presets
export function orientSpring(
  cfg: SpringCfg,
  from: number,
  to: number
): SpringCfg {
  if (cfg.velocity && to < from)
    return { ...cfg, velocity: -Math.abs(cfg.velocity) };
  return cfg;
}
