import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const src = readFileSync(resolve(import.meta.dirname, "page.tsx"), "utf8");

describe("saved Instant UI contract", () => {
  it("exports a synchronous page so session cookies do not block the shell", () => {
    expect(src).toMatch(/export default function SavedPage\(/);
    expect(src).not.toMatch(/export default async function SavedPage\(/);
  });

  it("reads currentUser inside a Suspense child", () => {
    expect(src).toMatch(/<Suspense/);
    const pageFn = src.slice(
      src.indexOf("export default function SavedPage"),
      src.indexOf("async function")
    );
    expect(pageFn).not.toMatch(/currentUser\(/);
  });
});
