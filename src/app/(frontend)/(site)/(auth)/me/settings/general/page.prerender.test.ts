import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const src = readFileSync(resolve(import.meta.dirname, "page.tsx"), "utf8");

describe("settings general Instant UI contract", () => {
  it("exports a synchronous page so cookies do not block the shell", () => {
    expect(src).toMatch(/export default function GeneralSettingsPage\(/);
    expect(src).not.toMatch(
      /export default async function GeneralSettingsPage\(/
    );
  });

  it("reads cookies inside a Suspense child", () => {
    expect(src).toMatch(/<Suspense/);
    const pageFn = src.slice(
      src.indexOf("export default function GeneralSettingsPage"),
      src.indexOf("async function")
    );
    expect(pageFn).not.toMatch(/cookies\s*\(/);
  });
});
