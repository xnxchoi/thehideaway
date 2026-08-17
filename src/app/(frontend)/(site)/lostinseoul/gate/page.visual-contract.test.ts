import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const pageSource = readFileSync(new URL("./page.tsx", import.meta.url), "utf8");
const transitionSource = readFileSync(
  join(process.cwd(), "src/components/UX/Transition/index.tsx"),
  "utf8"
);

describe("LOSTINSEOUL gate visual contract", () => {
  it("uses theme tokens instead of forcing a black canvas", () => {
    expect(pageSource).toContain("bg-background");
    expect(pageSource).toContain("text-foreground");
    expect(pageSource).not.toContain("bg-[var(--black)]");
  });

  it("keeps the access form in the primary reading flow", () => {
    expect(pageSource).toContain(
      "lg:grid-cols-[minmax(0,1.2fr)_minmax(22rem,0.8fr)]"
    );
    expect(pageSource).toContain('autoComplete="current-password"');
    expect(pageSource).toContain('aria-live="polite"');
  });

  it("returns theme ownership to RPage without a LOST-specific bridge", () => {
    expect(pageSource).toContain("theme={null}");
    expect(pageSource).not.toContain("GateCursorTone");
    expect(transitionSource).toContain("theme === null");
    expect(transitionSource).toContain("clearPageTheme()");
  });
});
