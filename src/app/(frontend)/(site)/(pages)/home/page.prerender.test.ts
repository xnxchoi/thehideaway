import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const src = readFileSync(resolve(import.meta.dirname, "page.tsx"), "utf8");

describe("home Instant UI contract", () => {
  it("caches home posts like the reception page", () => {
    expect(src).toMatch(/async function getHomePosts\(\) \{\s*"use cache";/);
    expect(src).toMatch(/cacheLife\("hours"\)/);
    expect(src).toMatch(/cacheTag\("posts-sitemap"\)/);
  });
});
