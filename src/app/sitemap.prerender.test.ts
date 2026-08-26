import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const sitemapSrc = readFileSync(resolve(import.meta.dirname, "sitemap.ts"), "utf8");

describe("sitemap cacheComponents contract", () => {
  it("does not export a revalidate segment config", () => {
    expect(sitemapSrc).not.toMatch(/export\s+const\s+revalidate\s*=/);
  });
});
