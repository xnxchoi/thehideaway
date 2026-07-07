import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const css = readFileSync(join(__dirname, "index.css"), "utf8");
const components = readFileSync(join(__dirname, "components.tsx"), "utf8");

describe("LOST footer visibility CSS", () => {
  it("does not hide the storefront footer with the global footer suppression rule", () => {
    expect(css).toContain("footer:not(.lost-footer)");
    expect(css).not.toContain("body:has(.lost-commerce-root) footer,");
  });

  it("does not ship placeholder social media links in the storefront footer", () => {
    expect(components).not.toContain('"Instagram"');
    expect(components).not.toContain('"Threads"');
    expect(components).not.toContain('"YouTube"');
  });

  it("keeps LOST legal footer links clean instead of leaking the internal route prefix", () => {
    expect(components).toContain('className="lost-footer-link" href="/"');
    expect(components).toContain('href="/privacy"');
    expect(components).toContain('href="/terms"');
    expect(components).toContain('href="/refund"');
    expect(components).not.toContain('href="/lostinseoul/privacy"');
    expect(components).not.toContain('href="/lostinseoul/terms"');
    expect(components).not.toContain('href="/lostinseoul/refund"');
  });
});
