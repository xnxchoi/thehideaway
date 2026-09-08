import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const here = dirname(fileURLToPath(import.meta.url));
const source = readFileSync(join(here, "BlurredText.tsx"), "utf8");

describe("BlurredText", () => {
  it("renders split lines instead of an empty motion span", () => {
    expect(source).toContain("{line}");
    expect(source).not.toMatch(/!\s*content\s*\|\|/);
    expect(source).not.toMatch(
      /whileInView=\{\{ filter: "blur\(0px\)" \}\}\s*><\/m\.span>/
    );
  });

  it("uses the blur-motion delay helper", () => {
    expect(source).toContain("getLostBlurLineDelay");
  });
});
