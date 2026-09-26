import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const source = readFileSync(__dirname + "/index.tsx", "utf8");

describe("global cursor motion", () => {
  it("binds pointer coordinates directly without a trailing position spring", () => {
    expect(source).toContain("useCoordinator((store) => store.x)");
    expect(source).toContain("useCoordinator((store) => store.y)");
    expect(source).not.toContain('document.addEventListener("pointermove"');
    expect(source).toContain("x: cursorX,");
    expect(source).toContain("y: cursorY,");
    expect(source).not.toContain("cursorXSpring");
    expect(source).not.toContain("cursorYSpring");
  });

  it("keeps a two-tone point cursor legible without route-theme resets", () => {
    expect(source).toContain('stroke="black"');
    expect(source).toContain('stroke="white"');
    expect(source).toContain('fill="white"');
    expect(source).not.toContain("pageIsTransitioning");
    expect(source).not.toContain("resetCursorTheme()");
  });
});
