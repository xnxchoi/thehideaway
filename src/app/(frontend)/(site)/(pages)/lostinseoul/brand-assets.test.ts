import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { LostHeroScene } from "./hero-three";

const lostRouteDir = __dirname;

const sourceFiles = [
  "storefront.tsx",
  "components.tsx",
  "hero-three.tsx",
  "index.css"
];

const requiredHeroSceneAssets = [
  "scene.glb",
  "Banc.glb",
  "Cables.glb",
  "Wall.glb",
  "normal.jpg",
  "shadows.png"
];

const forbiddenMediaMarkers = ["hero-reference.mp4", "unsplash-"];
const forbiddenPlaceholderMarkers = ["/assets/lostinseoul/brand"];

describe("LOSTINSEOUL brand asset boundaries", () => {
  it("does not hardcode borrowed reference media or random fallback assets in storefront source", () => {
    const routeSource = sourceFiles
      .map((fileName) => readFileSync(join(lostRouteDir, fileName), "utf8"))
      .join("\n");

    for (const marker of forbiddenMediaMarkers) {
      expect(routeSource.toLowerCase()).not.toContain(marker);
    }

    for (const marker of forbiddenPlaceholderMarkers) {
      expect(routeSource.toLowerCase()).not.toContain(marker);
    }
  });

  it("keeps the GLB-backed hero scene importable by storefront", () => {
    const source = readFileSync(join(lostRouteDir, "hero-three.tsx"), "utf8");

    expect(source).toContain("GLTFLoader");
    expect(source).toContain("/assets/lostinseoul/oflyn/scene.glb");
    expect(typeof LostHeroScene).toBe("function");
  });

  it("ships only the 3D scene assets, not the old reference video", () => {
    const sceneAssetDir = join(process.cwd(), "public/assets/lostinseoul/oflyn");

    for (const assetName of requiredHeroSceneAssets) {
      expect(existsSync(join(sceneAssetDir, assetName))).toBe(true);
    }

    expect(existsSync(join(sceneAssetDir, "hero-reference.mp4"))).toBe(false);
    expect(existsSync(join(process.cwd(), "public/assets/lostinseoul/brand"))).toBe(
      false
    );
  });
});
