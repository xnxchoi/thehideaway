import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
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

const forbiddenProductionMarkers = [
  ["of", "lyn"].join(""),
  ["hero", "-reference", ".mp4"].join(""),
  ["uns", "plash-"].join(""),
  ["/assets/lostinseoul/", "brand"].join("")
];

function listPublicLostAssetPaths(root: string) {
  if (!existsSync(root)) return [];

  return readdirSync(root).flatMap((entryName) => {
    const entryPath = join(root, entryName);
    if (statSync(entryPath).isDirectory()) {
      return [entryPath, ...listPublicLostAssetPaths(entryPath)];
    }

    return [entryPath];
  });
}

describe("LOSTINSEOUL brand asset boundaries", () => {
  it("does not hardcode borrowed reference media or random fallback assets in storefront source", () => {
    const routeSource = sourceFiles
      .map((fileName) => readFileSync(join(lostRouteDir, fileName), "utf8"))
      .join("\n");

    for (const marker of forbiddenProductionMarkers) {
      expect(routeSource.toLowerCase()).not.toContain(marker);
    }
  });

  it("keeps the GLB-backed hero scene importable by storefront", () => {
    const source = readFileSync(join(lostRouteDir, "hero-three.tsx"), "utf8");

    expect(source).toContain("GLTFLoader");
    expect(source).toContain("/assets/lostinseoul/home-scene/scene.glb");
    expect(typeof LostHeroScene).toBe("function");
  });

  it("ships the 3D scene assets under LOST home naming", () => {
    const publicLostAssetDir = join(process.cwd(), "public/assets/lostinseoul");
    const sceneAssetDir = join(publicLostAssetDir, "home-scene");

    for (const assetName of requiredHeroSceneAssets) {
      expect(existsSync(join(sceneAssetDir, assetName))).toBe(true);
    }

    const publicAssetPaths = listPublicLostAssetPaths(publicLostAssetDir).join(
      "\n"
    );

    for (const marker of forbiddenProductionMarkers) {
      expect(publicAssetPaths.toLowerCase()).not.toContain(marker);
    }
  });

  it("ships LOST home video and wires it into the storefront fallback", () => {
    const source = readFileSync(join(lostRouteDir, "storefront.tsx"), "utf8");

    expect(
      existsSync(join(process.cwd(), "public/assets/lostinseoul/home-video.mov"))
    ).toBe(true);
    expect(source).toContain(
      'const LOST_HOME_VIDEO_URL = "/assets/lostinseoul/home-video.mov";'
    );
    expect(source).toContain("products[0]?.heroVideoUrl ?? LOST_HOME_VIDEO_URL");
  });
});
