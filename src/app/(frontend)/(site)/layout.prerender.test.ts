import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const layoutSrc = readFileSync(
  resolve(import.meta.dirname, "layout.tsx"),
  "utf8"
);

describe("(site) layout prerender contract", () => {
  it("does not read draftMode cookies in the layout body", () => {
    expect(layoutSrc).not.toMatch(/draftMode\s*\(/);
  });

  it("wraps Footer in a server Suspense so getTranslations does not block instant UI", () => {
    expect(layoutSrc).toMatch(
      /<Suspense[\s\S]*?<LegalFooterGate>[\s\S]*?<Footer\s*\/>/
    );
  });
});
