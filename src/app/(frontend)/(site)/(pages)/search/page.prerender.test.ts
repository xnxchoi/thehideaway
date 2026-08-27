import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const src = readFileSync(resolve(import.meta.dirname, "page.tsx"), "utf8");

describe("search Instant UI contract", () => {
  it("exports a synchronous page so searchParams do not block the shell", () => {
    expect(src).toMatch(/export default function Page\(/);
    expect(src).not.toMatch(/export default async function Page\(/);
  });

  it("wraps the searchParams reader in server Suspense", () => {
    expect(src).toMatch(/<Suspense[\s\S]*searchParams/);
  });
});
