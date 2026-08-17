import { describe, expect, it } from "vitest";
import {
  getLostFragranceReactionCamera,
  getLostFragranceReactionIntensity,
  LOST_FRAGRANCE_REACTION_CURVE,
  LOST_FRAGRANCE_REACTION_FRAG,
  LOST_FRAGRANCE_REACTION_LOOK
} from "./fragrance-reaction";

describe("getLostFragranceReactionIntensity", () => {
  it("stays colourless before ignition", () => {
    expect(getLostFragranceReactionIntensity(0)).toBe(0);
    expect(
      getLostFragranceReactionIntensity(
        LOST_FRAGRANCE_REACTION_CURVE.igniteStart
      )
    ).toBe(0);
  });

  it("rises monotonically through ignition to full intensity", () => {
    const { igniteStart, igniteEnd } = LOST_FRAGRANCE_REACTION_CURVE;
    let prev = 0;
    for (let i = 1; i <= 10; i++) {
      const p = igniteStart + ((igniteEnd - igniteStart) * i) / 10;
      const v = getLostFragranceReactionIntensity(p);
      expect(v).toBeGreaterThanOrEqual(prev);
      prev = v;
    }
    expect(getLostFragranceReactionIntensity(igniteEnd)).toBe(1);
  });

  it("holds peak between ignition end and afterglow start", () => {
    const { igniteEnd, afterStart } = LOST_FRAGRANCE_REACTION_CURVE;
    const mid = (igniteEnd + afterStart) / 2;
    expect(getLostFragranceReactionIntensity(mid)).toBe(1);
  });

  it("eases into afterglow, settling at half intensity", () => {
    const { afterStart, afterDepth } = LOST_FRAGRANCE_REACTION_CURVE;
    const during = getLostFragranceReactionIntensity((afterStart + 1) / 2);
    expect(during).toBeLessThan(1);
    expect(during).toBeGreaterThan(1 - afterDepth);
    expect(getLostFragranceReactionIntensity(1)).toBeCloseTo(
      1 - afterDepth,
      10
    );
  });
});

describe("LOST_FRAGRANCE_REACTION_FRAG", () => {
  it("bakes the founder's look values into the shader source", () => {
    expect(LOST_FRAGRANCE_REACTION_FRAG).toContain(
      String(LOST_FRAGRANCE_REACTION_LOOK.plumeGain)
    );
    expect(LOST_FRAGRANCE_REACTION_FRAG).toContain(
      String(LOST_FRAGRANCE_REACTION_LOOK.waterY)
    );
    expect(LOST_FRAGRANCE_REACTION_FRAG).toContain(
      String(LOST_FRAGRANCE_REACTION_LOOK.exposure)
    );
  });

  it("bakes the curve boundaries into the shader source", () => {
    expect(LOST_FRAGRANCE_REACTION_FRAG).toContain(
      String(LOST_FRAGRANCE_REACTION_CURVE.igniteEnd)
    );
    expect(LOST_FRAGRANCE_REACTION_FRAG).toContain(
      String(LOST_FRAGRANCE_REACTION_CURVE.afterStart)
    );
  });

  it("emits whole-number look values as GLSL floats, never bare ints", () => {
    // sparkle is 4.4 — but a value like 2 must render as "2.0" in GLSL.
    // Guard the generator: no interpolated bare-int multiplications.
    expect(LOST_FRAGRANCE_REACTION_FRAG).toContain(
      String(LOST_FRAGRANCE_REACTION_LOOK.sparkle)
    );
    expect(LOST_FRAGRANCE_REACTION_FRAG).not.toMatch(/\*\s+\d+\s*;/);
  });

  it("contains no bottle — the reaction is the hero", () => {
    const source = LOST_FRAGRANCE_REACTION_FRAG.toLowerCase();
    expect(source).not.toContain("bottle");
    expect(source).not.toContain("flacon");
  });

  it("declares only the runtime uniforms — look values stay baked", () => {
    const uniforms = LOST_FRAGRANCE_REACTION_FRAG.match(/uniform\s+\w+\s+\w+/g);
    expect(uniforms).toEqual([
      "uniform vec2 uRes",
      "uniform float uTime",
      "uniform float uProg",
      "uniform float uCamZoom",
      "uniform float uCamY"
    ]);
  });

  it("keeps the water dark-but-visible before ignition", () => {
    expect(LOST_FRAGRANCE_REACTION_FRAG).toContain("dormantLight");
  });
});

describe("getLostFragranceReactionCamera", () => {
  it("opens low and close over the water", () => {
    const cam = getLostFragranceReactionCamera(0);
    expect(cam.zoom).toBeGreaterThan(1);
    expect(cam.y).toBeLessThan(0);
  });

  it("pulls back as the plume takes the frame", () => {
    const open = getLostFragranceReactionCamera(0);
    const wide = getLostFragranceReactionCamera(0.55);
    expect(wide.zoom).toBeLessThan(open.zoom);
    expect(wide.y).toBeGreaterThan(open.y);
  });

  it("clamps outside the scroll range", () => {
    expect(getLostFragranceReactionCamera(-1)).toEqual(
      getLostFragranceReactionCamera(0)
    );
    expect(getLostFragranceReactionCamera(2)).toEqual(
      getLostFragranceReactionCamera(1)
    );
  });

  it("interpolates continuously between keys", () => {
    let prev = getLostFragranceReactionCamera(0);
    for (let p = 0.02; p <= 1; p += 0.02) {
      const cam = getLostFragranceReactionCamera(p);
      expect(Number.isFinite(cam.zoom)).toBe(true);
      expect(Number.isFinite(cam.y)).toBe(true);
      expect(Math.abs(cam.zoom - prev.zoom)).toBeLessThan(0.06);
      expect(Math.abs(cam.y - prev.y)).toBeLessThan(0.03);
      prev = cam;
    }
  });
});
