import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const source = readFileSync(
  join(dirname(fileURLToPath(import.meta.url)), "index.tsx"),
  "utf8"
);

describe("Footer", () => {
  it("keeps shop and legal links on the lostinseoul tree", () => {
    expect(source).toContain('href="/lostinseoul"');
    expect(source).toContain('href="/lostinseoul#products"');
    expect(source).toContain('href="/lostinseoul/privacy"');
    expect(source).toContain('href="/lostinseoul/terms"');
    expect(source).toContain('href="/lostinseoul/refund"');
    expect(source).not.toContain('href="/public"');
    expect(source).not.toContain('href="/privacy"');
  });

  it("renders disclosure through getLostBusinessDisclosure", () => {
    expect(source).toContain("getLostBusinessDisclosure");
    expect(source).not.toContain("Privacy Desk");
  });
});
