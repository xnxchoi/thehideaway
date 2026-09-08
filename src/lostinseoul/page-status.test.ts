import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const source = readFileSync(join(here, "page-status.tsx"), "utf8");

describe("page-status chrome contract", () => {
  it("does not export useCart so Payload plugin useCart stays unshadowed", () => {
    expect(source).toContain("export function useCartOpen");
    expect(source).not.toMatch(/export function useCart\b/);
    expect(source).not.toContain("useLostBag");
  });

  it("provides cart-open, search, and commerce root from ChromeProvider", () => {
    expect(source).toContain("export function ChromeProvider");
    expect(source).toContain("CartOpenCtx.Provider");
    expect(source).toContain("SearchCtx.Provider");
    expect(source).toContain("CommerceRootContext.Provider");
    expect(source).toContain("export function CommerceMain");
    expect(source).toContain("export function useWatchVideo");
  });
});
