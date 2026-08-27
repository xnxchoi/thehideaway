import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const src = readFileSync(resolve(import.meta.dirname, "page.tsx"), "utf8");

describe("settings hub Instant UI contract", () => {
  it("exports a synchronous page so cookies do not block the shell", () => {
    expect(src).toMatch(/export default function SettingsHubPage\(/);
    expect(src).not.toMatch(/export default async function SettingsHubPage\(/);
  });

  it("reads cookies inside a Suspense child", () => {
    expect(src).toMatch(/<Suspense/);
    const pageFn = src.slice(
      src.indexOf("export default function SettingsHubPage"),
      src.indexOf("async function")
    );
    expect(pageFn).not.toMatch(/cookies\s*\(/);
  });
});
