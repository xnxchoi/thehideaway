import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import {
  getLostHeroTextureMediaRatio,
  getLostHeroVideoUrl,
  shouldShowLostHeroVideoControls
} from "./hero-media-state";

describe("LOSTINSEOUL hero media state", () => {
  it("only exposes video controls when a usable video URL exists", () => {
    expect(shouldShowLostHeroVideoControls("/media/night.mp4")).toBe(true);
    expect(shouldShowLostHeroVideoControls("   /media/night.mp4   ")).toBe(
      true
    );
    expect(shouldShowLostHeroVideoControls(null)).toBe(false);
    expect(shouldShowLostHeroVideoControls(undefined)).toBe(false);
    expect(shouldShowLostHeroVideoControls("")).toBe(false);
    expect(shouldShowLostHeroVideoControls("   ")).toBe(false);
  });

  it("normalizes hero video URLs before passing them to media runtimes", () => {
    expect(getLostHeroVideoUrl(" /media/night.mp4 ")).toBe("/media/night.mp4");
    expect(getLostHeroVideoUrl(" ")).toBeNull();
    expect(getLostHeroVideoUrl(null)).toBeNull();
    expect(getLostHeroVideoUrl(undefined)).toBeNull();
  });

  it("uses the normalized hero video URL at scene and player boundaries", () => {
    const source = readFileSync(join(__dirname, "components.tsx"), "utf8");

    expect(source).toContain(
      "const heroVideoUrl = getLostHeroVideoUrl(videoUrl)"
    );
    expect(source).toContain("videoUrl={heroVideoUrl}");
    expect(source).toContain("src={heroVideoUrl}");
    expect(source).not.toContain("videoUrl={videoUrl}");
    expect(source).not.toContain("src={videoUrl}");
  });

  it("uses loaded image dimensions for still texture cover fitting", () => {
    expect(
      getLostHeroTextureMediaRatio({ height: 1000, width: 800 }, 21 / 9)
    ).toBeCloseTo(0.8);
    expect(
      getLostHeroTextureMediaRatio({ height: 900, width: 2100 }, 21 / 9)
    ).toBeCloseTo(21 / 9);
  });

  it("falls back to target ratio when loaded image dimensions are not usable", () => {
    expect(
      getLostHeroTextureMediaRatio({ height: 0, width: 800 }, 21 / 9)
    ).toBe(21 / 9);
    expect(
      getLostHeroTextureMediaRatio({ height: 900, width: 0 }, 21 / 9)
    ).toBe(21 / 9);
    expect(getLostHeroTextureMediaRatio(null, 21 / 9)).toBe(21 / 9);
  });
});
