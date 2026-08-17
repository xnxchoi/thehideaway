import { describe, expect, it } from "vitest";
import { getLostFragranceSceneMode } from "./fragrance-scene-selection";

describe("LOSTINSEOUL fragrance scene selection", () => {
  it("uses the maintained R3F scene by default", () => {
    expect(getLostFragranceSceneMode("")).toBe("r3f");
    expect(getLostFragranceSceneMode("?scene=r3f")).toBe("r3f");
  });

  it("keeps the legacy scene behind its explicit comparison toggle", () => {
    expect(getLostFragranceSceneMode("?scene=legacy")).toBe("legacy");
  });
});
