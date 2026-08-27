import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const src = readFileSync(resolve(import.meta.dirname, "page.tsx"), "utf8");

describe("CMS slug Instant UI contract", () => {
  it("exports a synchronous page so draft cookies do not block the shell", () => {
    expect(src).toMatch(/export default function Page\(/);
    expect(src).not.toMatch(/export default async function Page\(/);
  });

  it("reads draftMode inside a Suspense child, not the page shell", () => {
    expect(src).toMatch(/<Suspense[\s\S]*params/);
    const pageFn = src.slice(
      src.indexOf("export default function Page"),
      src.indexOf("async function")
    );
    expect(pageFn).not.toMatch(/draftMode\s*\(/);
  });

  it("caches published page lookups", () => {
    expect(src).toMatch(/"use cache"/);
  });
});
