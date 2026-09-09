import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const src = readFileSync(resolve(import.meta.dirname, "layout.tsx"), "utf8");

describe("settings layout Instant UI contract", () => {
  it("exports a synchronous layout so session cookies do not block the shell", () => {
    expect(src).toMatch(/export default function SettingsLayout\(/);
    expect(src).not.toMatch(/export default async function SettingsLayout\(/);
  });

  it("does not replace the pane with a layout fallback while the next section loads", () => {
    expect(src).not.toMatch(/SettingsMainFallback/);
    expect(src).not.toMatch(/EnsureSettingsUser/);
  });

  it("prerenders the rail outside the page slot", () => {
    expect(src).toMatch(/SettingsRail/);
    expect(src).toMatch(/<aside[\s\S]*SettingsRail/);
  });

  it("keeps the shell clear of the FX frame at both vertical ends", () => {
    expect(src).toMatch(/pt-\[14rem\]/);
    expect(src).toMatch(/pb-\[14rem\]/);
    expect(src).toMatch(/xl:pt-\[18rem\]/);
    expect(src).toMatch(/xl:pb-\[18rem\]/);
    expect(src).toMatch(/xl:top-\[18rem\]/);
    expect(src).toMatch(/xl:max-h-\[calc\(100vh-36rem\)\]/);
  });
});
