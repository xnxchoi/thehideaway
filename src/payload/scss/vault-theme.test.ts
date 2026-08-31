import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const here = dirname(fileURLToPath(import.meta.url));
const theme = readFileSync(join(here, "vault-theme.scss"), "utf8");

describe("vault-theme spine", () => {
  it("paints Payload variables instead of inventing a third palette", () => {
    expect(theme).toContain("@layer payload-default");
    expect(theme).toContain("--color-base-900");
    expect(theme).toContain("--font-body");
    expect(theme).toContain("--style-radius-l: 16px");
    expect(theme).toContain("--nav-width: 232px");
  });

  it("does not import Fey/Oscura product hex", () => {
    expect(theme).not.toMatch(/#0B0B0F|#479FFA|#489FFA/i);
  });
});
