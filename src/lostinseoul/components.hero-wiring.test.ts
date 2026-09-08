import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const here = dirname(fileURLToPath(import.meta.url));
const components = readFileSync(join(here, "components.tsx"), "utf8");

describe("home hero wiring", () => {
  it("lazy-loads the retail scene instead of statically importing Three.js", () => {
    expect(components).toContain("@lostinseoul/maisonderetail");
    expect(components).toContain("module.LostHeroScene");
    expect(components).toContain("ssr: false");
    expect(components).not.toContain('from "./hero-three"');
    expect(components).not.toContain('import("./hero-three")');
  });

  it("reads hero copy from next-intl", () => {
    expect(components).toContain('useTranslations("LOSTINSEOUL")');
    expect(components).toContain('t("home.collection")');
    expect(components).toContain('t("actions.watchVideo")');
  });

  it("uses chrome context instead of bag/search props", () => {
    expect(components).toContain("useCartOpen");
    expect(components).toContain("useSearch");
    expect(components).toContain("useEntry");
    expect(components).not.toContain("useLostBag");
    expect(components).not.toContain("LOST_ENTRY_PHASE_EVENT");
  });
});
