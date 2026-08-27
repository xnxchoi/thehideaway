import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const src = readFileSync(resolve(import.meta.dirname, "page.tsx"), "utf8");

describe("day-n-night Instant UI contract", () => {
  it("exports a synchronous page so cookies and session do not block the shell", () => {
    expect(src).toMatch(/export default function DayNNightPage\(/);
    expect(src).not.toMatch(/export default async function DayNNightPage\(/);
  });

  it("reads cookies inside a Suspense child", () => {
    expect(src).toMatch(/<Suspense/);
    const pageFn = src.slice(
      src.indexOf("export default function DayNNightPage"),
      src.indexOf("async function")
    );
    expect(pageFn).not.toMatch(/cookies\s*\(/);
  });

  it("caches the public event query", () => {
    expect(src).toMatch(/"use cache"/);
    expect(src).toMatch(/cacheTag\(/);
  });
});
