import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const lostRouteDir = __dirname;
const read = (fileName: string) =>
  readFileSync(join(lostRouteDir, fileName), "utf8");

describe("LOSTINSEOUL home hero wiring", () => {
  it("lazy-loads the WebGL hero scene from the storefront components, not as a static Three.js import", () => {
    const components = read("components.tsx");

    expect(components).toContain('import("./hero-three")');
    expect(components).toContain("module.LostHeroScene");
    expect(components).toContain("ssr: false");
    expect(components).not.toContain('from "./hero-three"');
  });

  it("reads hero and video copy from next-intl instead of drilling label props", () => {
    const components = read("components.tsx");
    const heroFn = components.slice(
      components.indexOf("export function LostHero"),
      components.indexOf("function LostVideoPlayer")
    );
    const player = components.slice(
      components.indexOf("function LostVideoPlayer"),
      components.indexOf("export function LostStatement")
    );

    expect(heroFn).toContain('useTranslations("LOSTINSEOUL")');
    expect(heroFn).toContain('t("home.collection")');
    expect(heroFn).toContain('t("home.year")');
    expect(heroFn).toContain('t("actions.watchVideo")');
    expect(player).toContain('useTranslations("LOSTINSEOUL.video")');
    expect(player).toContain('t("play")');
    expect(player).toContain('t("mute")');
  });

  it("shares bag, search, and entry phase through split contexts instead of document events or header props", () => {
    const state = read("lost-page-state.tsx");
    const components = read("components.tsx");
    const storefront = read("storefront.tsx");
    const layout = read("layout.tsx");
    const hookPath = join(lostRouteDir, "use-lost-entry-sequence.ts");

    expect(existsSync(hookPath)).toBe(true);
    const hook = readFileSync(hookPath, "utf8");

    expect(state).toContain("LostBagContext");
    expect(state).toContain("LostSearchContext");
    expect(state).toContain("LostEntryPhaseContext");
    expect(state).toContain("export function LostChromeProvider");
    expect(state).toContain("export function LostEntryProvider");
    expect(layout).toContain("LostChromeProvider");
    expect(storefront).toContain("LostEntryProvider");
    expect(storefront).not.toContain("entryPhase={");
    expect(storefront).not.toContain("bagOpen={");
    expect(storefront).not.toContain("searchQuery={");
    expect(components).not.toContain("LOST_ENTRY_PHASE_EVENT");
    expect(components).toContain("useLostEntryPhase");
    expect(components).toContain("useLostBag");
    expect(hook).toContain("document.body.dataset.lostEntry");
    expect(hook).toContain("shouldFinishLostEntry");
  });
});
