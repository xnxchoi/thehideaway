import { describe, expect, it } from "vitest";
import {
  applyLostFragranceTuning,
  isLostFragranceTuningEnabled,
  LOST_FRAGRANCE_TUNING_DEFAULTS,
  type LostFragranceTuning,
  type LostFragranceTuningTargets
} from "./fragrance-tuning";

describe("isLostFragranceTuningEnabled", () => {
  it("opens the panel on ?tune=1 outside production", () => {
    expect(
      isLostFragranceTuningEnabled({
        search: "?tune=1",
        nodeEnv: "development"
      })
    ).toBe(true);
  });

  it("stays shut in production even with ?tune=1", () => {
    expect(
      isLostFragranceTuningEnabled({ search: "?tune=1", nodeEnv: "production" })
    ).toBe(false);
  });

  it("stays shut without the flag", () => {
    expect(
      isLostFragranceTuningEnabled({ search: "", nodeEnv: "development" })
    ).toBe(false);
    expect(
      isLostFragranceTuningEnabled({
        search: "?tune=0",
        nodeEnv: "development"
      })
    ).toBe(false);
    expect(
      isLostFragranceTuningEnabled({
        search: "?other=1",
        nodeEnv: "development"
      })
    ).toBe(false);
  });

  it("tolerates a malformed search string", () => {
    expect(
      isLostFragranceTuningEnabled({ search: "???", nodeEnv: "development" })
    ).toBe(false);
  });
});

function makeTargets(): LostFragranceTuningTargets {
  return {
    water: {
      uDistortion: { value: 0 },
      uReflStrength: { value: 0 },
      uRippleAmp: { value: 0 },
      uRippleSpeed: { value: 0 }
    },
    glass: {
      ior: 0,
      thickness: 0,
      roughness: 0,
      envMapIntensity: 0,
      clearcoat: 0,
      attenuationDistance: 0
    },
    lights: { emberBack: { intensity: 0 }, capRim: { intensity: 0 } },
    setExposure: () => undefined
  };
}

describe("applyLostFragranceTuning", () => {
  it("writes water uniforms onto the live shader", () => {
    const targets = makeTargets();
    applyLostFragranceTuning(targets, LOST_FRAGRANCE_TUNING_DEFAULTS);
    expect(targets.water?.uRippleAmp.value).toBe(
      LOST_FRAGRANCE_TUNING_DEFAULTS.rippleAmp
    );
    expect(targets.water?.uRippleSpeed.value).toBe(
      LOST_FRAGRANCE_TUNING_DEFAULTS.rippleSpeed
    );
    expect(targets.water?.uDistortion.value).toBe(
      LOST_FRAGRANCE_TUNING_DEFAULTS.distortion
    );
  });

  it("writes glass material properties", () => {
    const targets = makeTargets();
    const tuning: LostFragranceTuning = {
      ...LOST_FRAGRANCE_TUNING_DEFAULTS,
      ior: 1.7,
      roughness: 0.25
    };
    applyLostFragranceTuning(targets, tuning);
    expect(targets.glass?.ior).toBe(1.7);
    expect(targets.glass?.roughness).toBe(0.25);
  });

  it("scales light intensity rather than overwriting the reaction curve", () => {
    const targets = makeTargets();
    if (!targets.lights) throw new Error("lights missing");
    targets.lights.emberBack.intensity = 10;
    targets.lights.capRim.intensity = 2;
    applyLostFragranceTuning(targets, {
      ...LOST_FRAGRANCE_TUNING_DEFAULTS,
      emberScale: 0.5,
      capRimScale: 2
    });
    expect(targets.lights.emberBack.intensity).toBe(5);
    expect(targets.lights.capRim.intensity).toBe(4);
  });

  it("pushes exposure through the provided setter", () => {
    let seen = -1;
    const targets: LostFragranceTuningTargets = {
      ...makeTargets(),
      setExposure: (v: number) => {
        seen = v;
      }
    };
    applyLostFragranceTuning(targets, {
      ...LOST_FRAGRANCE_TUNING_DEFAULTS,
      exposure: 1.42
    });
    expect(seen).toBe(1.42);
  });

  it("leaves water untouched when the scene has none (product mode)", () => {
    const targets: LostFragranceTuningTargets = {
      ...makeTargets(),
      water: null
    };
    expect(() =>
      applyLostFragranceTuning(targets, LOST_FRAGRANCE_TUNING_DEFAULTS)
    ).not.toThrow();
  });
});
