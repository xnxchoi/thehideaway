import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const css = readFileSync(join(__dirname, "index.css"), "utf8");

describe("LOST footer visibility CSS", () => {
  it("does not hide the storefront footer with the global footer suppression rule", () => {
    expect(css).toContain("footer:not(.lost-footer)");
    expect(css).not.toContain("body:has(.lost-commerce-root) footer,");
  });
});
