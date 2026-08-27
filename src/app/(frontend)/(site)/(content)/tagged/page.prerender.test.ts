import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const src = readFileSync(resolve(import.meta.dirname, "page.tsx"), "utf8");

describe("tagged index Instant UI contract", () => {
  it("caches the tags query with use cache", () => {
    expect(src).toMatch(
      /async function get\w+\([^)]*\)(?::[^{]+)? \{\s*"use cache";/
    );
    expect(src).toMatch(/cacheTag\(/);
  });
});
