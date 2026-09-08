import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const src = readFileSync(
  resolve(import.meta.dirname, "page.client.tsx"),
  "utf8"
);

describe("security settings partial prerender contract", () => {
  it("does not block the whole page on session or account queries", () => {
    const root = src.slice(
      src.indexOf("export default function SecuritySectionClient"),
      src.indexOf("function TwoFactorPanel")
    );
    expect(root).not.toMatch(/\buse\(/);
    expect(root).toMatch(/<SubRouteHeader/);
    expect(root).toMatch(/<SessionsPanel/);
    expect(root).toMatch(/<ProvidersPanel/);
    expect(root).toMatch(/<PasskeysPanel/);
  });

  it("suspends session rows and provider status independently", () => {
    expect(src).toMatch(/<Suspense[\s\S]*<SessionRows/);
    expect(src).toMatch(/<Suspense[\s\S]*<ProviderRows/);
  });
});
