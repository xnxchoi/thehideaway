import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const src = readFileSync(resolve(import.meta.dirname, "page.tsx"), "utf8");

describe("refund Instant UI contract", () => {
  it("exports a synchronous page so locale cookies do not block the shell", () => {
    expect(src).toMatch(/export default function RefundPage\(/);
    expect(src).not.toMatch(/export default async function RefundPage\(/);
  });

  it("reads getLocale inside a Suspense child", () => {
    expect(src).toMatch(/<Suspense/);
    const pageFn = src.slice(
      src.indexOf("export default function RefundPage"),
      src.indexOf("async function")
    );
    expect(pageFn).not.toMatch(/getLocale\(/);
  });
});
