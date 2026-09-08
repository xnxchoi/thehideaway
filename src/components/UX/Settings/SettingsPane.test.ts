import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const src = readFileSync(resolve(import.meta.dirname, "SettingsPane.tsx"), "utf8");
const layout = readFileSync(
  resolve(
    import.meta.dirname,
    "../../../app/(frontend)/(site)/(auth)/me/settings/layout.tsx"
  ),
  "utf8"
);

describe("SettingsPane", () => {
  it("does not remount or translate the pane on path change", () => {
    expect(src).not.toMatch(/key=\{pathname\}/);
    expect(src).not.toMatch(/y:\s*8/);
  });

  it("starts fading the pane as soon as a rail click is pending", () => {
    expect(src).toMatch(/pendingHref/);
    expect(src).toMatch(/opacity:\s*leaving \? 0 : 1/);
  });

  it("is mounted from the settings layout around the main slot", () => {
    expect(layout).toMatch(/SettingsPane/);
    expect(layout).toMatch(/SettingsNavProvider/);
  });
});
