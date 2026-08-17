import { describe, expect, it } from "vitest";
import { getLostFragranceRenderTier } from "./fragrance-tier";

const base = {
  prefersReducedMotion: false,
  webglSupported: true,
  deviceMemoryGb: 8,
  isMobile: false
};

describe("LOSTINSEOUL fragrance render tier", () => {
  it("gives reduced-motion users the editorial twin unconditionally", () => {
    expect(
      getLostFragranceRenderTier({ ...base, prefersReducedMotion: true })
    ).toBe("editorial");
    expect(
      getLostFragranceRenderTier({
        ...base,
        prefersReducedMotion: true,
        webglSupported: false
      })
    ).toBe("editorial");
  });

  it("falls back to video without webgl support", () => {
    expect(getLostFragranceRenderTier({ ...base, webglSupported: false })).toBe(
      "video"
    );
  });

  it("keeps low- and mid-memory mobile devices on the video tier", () => {
    expect(
      getLostFragranceRenderTier({ ...base, isMobile: true, deviceMemoryGb: 2 })
    ).toBe("video");
    expect(
      getLostFragranceRenderTier({ ...base, isMobile: true, deviceMemoryGb: 4 })
    ).toBe("video");
  });

  it("lets capable mobile devices run webgl", () => {
    expect(
      getLostFragranceRenderTier({ ...base, isMobile: true, deviceMemoryGb: 8 })
    ).toBe("webgl");
    expect(
      getLostFragranceRenderTier({
        ...base,
        isMobile: true,
        deviceMemoryGb: null
      })
    ).toBe("webgl");
  });

  it("defaults capable desktop to webgl", () => {
    expect(getLostFragranceRenderTier(base)).toBe("webgl");
  });
});
