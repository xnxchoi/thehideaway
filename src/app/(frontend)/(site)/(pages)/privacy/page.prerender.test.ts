import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const src = readFileSync(resolve(import.meta.dirname, "page.tsx"), "utf8");

describe("privacy Instant UI contract", () => {
  it("exports a synchronous page so locale cookies do not block the shell", () => {
    expect(src).toMatch(/export default function PrivacyPage\(/);
    expect(src).not.toMatch(/export default async function PrivacyPage\(/);
  });

  it("reads getLocale inside a Suspense child", () => {
    expect(src).toMatch(/<Suspense/);
    const pageFn = src.slice(
      src.indexOf("export default function PrivacyPage"),
      src.indexOf("async function")
    );
    expect(pageFn).not.toMatch(/getLocale\(/);
  });
});
