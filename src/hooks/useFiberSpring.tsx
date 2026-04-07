import { useSpring, type SpringConfig } from "@react-spring/three";
import { useEffect } from "react";

type EaseMap<T> = {
  in: T;
  out: T;
  inOut: T;
};

type SpringEase = EaseMap<SpringConfig>;
type PowerEase = `power${1 | 2 | 3 | 4}`;

export const REASE: Record<
  PowerEase | "sine" | "circ" | "expo" | "elastic",
  SpringEase
> & {
  back: (overshoot?: number) => SpringEase;
} = {
  power1: {
    in: { tension: 100, friction: 24, mass: 1, velocity: 0, precision: 0.001 },
    out: { tension: 150, friction: 28, mass: 1, velocity: 2, precision: 0.001 },
    inOut: {
      tension: 130,
      friction: 26,
      mass: 1,
      velocity: 0,
      precision: 0.001
    }
  },
  power2: {
    in: { tension: 180, friction: 32, mass: 1, velocity: 0, precision: 0.001 },
    out: { tension: 230, friction: 36, mass: 1, velocity: 2, precision: 0.001 },
    inOut: {
      tension: 210,
      friction: 34,
      mass: 1,
      velocity: 0,
      precision: 0.001
    }
  },
  power3: {
    in: { tension: 260, friction: 38, mass: 1, velocity: 0, precision: 0.001 },
    out: { tension: 320, friction: 42, mass: 1, velocity: 2, precision: 0.001 },
    inOut: {
      tension: 300,
      friction: 40,
      mass: 1,
      velocity: 0,
      precision: 0.001
    }
  },
  power4: {
    in: { tension: 360, friction: 46, mass: 1, velocity: 0, precision: 0.001 },
    out: { tension: 440, friction: 50, mass: 1, velocity: 2, precision: 0.001 },
    inOut: {
      tension: 400,
      friction: 48,
      mass: 1,
      velocity: 0,
      precision: 0.001
    }
  },

  // Sine — gentle, relaxed, lower tension than power1
  sine: {
    in: { tension: 80, friction: 22, mass: 1, velocity: 0 },
    out: { tension: 120, friction: 24, mass: 1, velocity: 1 },
    inOut: { tension: 100, friction: 23, mass: 1, velocity: 0 }
  },

  // Circ — swift start, heavily damped/rounded off at the end
  circ: {
    in: { tension: 200, friction: 45, mass: 1, velocity: 0 },
    out: { tension: 350, friction: 45, mass: 1, velocity: 3 },
    inOut: { tension: 280, friction: 45, mass: 1, velocity: 0 }
  },

  // Expo — extremely sharp initial acceleration, extremely long tail
  expo: {
    in: { tension: 400, friction: 70, mass: 1, velocity: 0 },
    out: { tension: 550, friction: 65, mass: 1, velocity: 4 },
    inOut: { tension: 480, friction: 68, mass: 1, velocity: 0 }
  },

  back: (overshoot: number = 1.7): SpringEase => {
    const getFriction = (tension: number, os: number) => {
      const critical = 2 * Math.sqrt(tension);
      return Math.max(critical - os * 8, 2);
    };

    return {
      in: {
        tension: 200,
        friction: getFriction(200, overshoot),
        mass: 1,
        velocity: -5 * (overshoot / 1.7)
      },
      out: {
        tension: 250,
        friction: getFriction(250, overshoot),
        mass: 1,
        velocity: 0
      },
      inOut: {
        tension: 225,
        friction: getFriction(225, overshoot),
        mass: 1,
        velocity: -2 * (overshoot / 1.7)
      }
    };
  },

  // Elastic — wobbly, highly under-damped
  elastic: {
    in: { tension: 300, friction: 25, mass: 1, velocity: -10 },
    out: { tension: 400, friction: 10, mass: 1, velocity: 0 },
    inOut: { tension: 350, friction: 15, mass: 1, velocity: -5 }
  }
};
export function useFiberSpring(
  values: Record<string, any>,
  config: SpringConfig | (() => SpringConfig),
  deps: ReadonlyArray<unknown>
) {
  const [springs, api] = useSpring(() => ({
    ...values,
    config: typeof config === "function" ? config() : config
  }));

  useEffect(() => {
    api.start({
      ...values,
      config: typeof config === "function" ? config() : config
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  return springs;
}
