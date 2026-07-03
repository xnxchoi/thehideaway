import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const lostRouteDir = __dirname;

const sourceFiles = [
  "storefront.tsx",
  "components.tsx",
  "hero-three.tsx",
  "index.css"
];

const forbiddenBorrowedAssetMarkers = [
  "oflyn",
  "hero-reference.mp4",
  "unsplash-"
];

describe("LOSTINSEOUL brand asset boundaries", () => {
  it("does not hardcode borrowed or random fallback asset markers in the storefront source", () => {
    const routeSource = sourceFiles
      .map((fileName) => readFileSync(join(lostRouteDir, fileName), "utf8"))
      .join("\n");

    for (const marker of forbiddenBorrowedAssetMarkers) {
      expect(routeSource.toLowerCase()).not.toContain(marker);
    }
  });
});
