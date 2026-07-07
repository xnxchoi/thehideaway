import { describe, expect, it } from "vitest";
import {
  getLostFragranceBuildings,
  getLostFragranceSigns,
  getLostFragranceWindows,
  LOST_FRAGRANCE_MAX_WINDOWS
} from "./fragrance-city";

describe("lostinseoul fragrance city layout", () => {
  it("is deterministic between calls", () => {
    expect(getLostFragranceBuildings()).toEqual(getLostFragranceBuildings());
    expect(getLostFragranceWindows()).toEqual(getLostFragranceWindows());
    expect(getLostFragranceSigns()).toEqual(getLostFragranceSigns());
  });

  it("keeps the street lane clear of buildings", () => {
    for (const building of getLostFragranceBuildings()) {
      expect(Math.abs(building.x) - building.width / 2).toBeGreaterThan(3);
      expect(building.z).toBeLessThan(0);
      expect(building.height).toBeGreaterThan(0);
    }
  });

  it("places every window on its building front face", () => {
    const buildings = getLostFragranceBuildings();
    const windows = getLostFragranceWindows();
    expect(windows.length).toBeGreaterThan(80);
    expect(windows.length).toBeLessThanOrEqual(LOST_FRAGRANCE_MAX_WINDOWS);
    for (const win of windows) {
      const building = buildings[win.buildingIndex];
      expect(building).toBeDefined();
      expect(Math.abs(win.x - building.x)).toBeLessThanOrEqual(
        building.width / 2
      );
      expect(win.y).toBeGreaterThan(0);
      expect(win.y).toBeLessThanOrEqual(building.height);
      // sits just in front of the face, never inside the volume
      expect(win.z).toBeGreaterThan(building.z + building.depth / 2 - 0.01);
    }
  });

  it("attaches each sign to a real building with a usable palette color", () => {
    const buildings = getLostFragranceBuildings();
    const signs = getLostFragranceSigns();
    expect(signs.length).toBeGreaterThanOrEqual(4);
    for (const sign of signs) {
      const building = buildings[sign.buildingIndex];
      expect(building).toBeDefined();
      expect(sign.color).toMatch(/^#[0-9a-f]{6}$/i);
      expect(sign.width).toBeGreaterThan(0);
      expect(sign.height).toBeGreaterThan(0);
      expect(sign.y).toBeLessThanOrEqual(building.height);
      expect(sign.z).toBeGreaterThan(building.z);
    }
  });
});
