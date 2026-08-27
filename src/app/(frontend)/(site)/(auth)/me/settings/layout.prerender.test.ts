import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const src = readFileSync(resolve(import.meta.dirname, "layout.tsx"), "utf8");

describe("settings layout Instant UI contract", () => {
  it("exports a synchronous layout so session cookies do not block the shell", () => {
    expect(src).toMatch(/export default function SettingsLayout\(/);
    expect(src).not.toMatch(/export default async function SettingsLayout\(/);
  });

  it("reads currentUser inside a Suspense child", () => {
    expect(src).toMatch(/<Suspense/);
    const layoutFn = src.slice(
      src.indexOf("export default function SettingsLayout"),
      src.indexOf("async function")
    );
    expect(layoutFn).not.toMatch(/currentUser\(/);
  });
});
