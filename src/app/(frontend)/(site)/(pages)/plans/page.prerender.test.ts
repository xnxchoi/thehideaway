import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const src = readFileSync(resolve(import.meta.dirname, "page.tsx"), "utf8");

describe("plans Instant UI contract", () => {
  it("exports a synchronous page so translations do not block the shell", () => {
    expect(src).toMatch(/export default function PlansPage\(/);
    expect(src).not.toMatch(/export default async function PlansPage\(/);
  });

  it("reads getTranslations inside a Suspense child", () => {
    expect(src).toMatch(/<Suspense/);
    const pageFn = src.slice(
      src.indexOf("export default function PlansPage"),
      src.indexOf("async function")
    );
    expect(pageFn).not.toMatch(/getTranslations\(/);
    expect(src).toMatch(/getTranslations\(/);
  });
});
