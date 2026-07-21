import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const source = readFileSync(
  new URL("./product.client.tsx", import.meta.url),
  "utf8"
);

describe("LOSTINSEOUL product accessibility", () => {
  it("exposes the selected order mode", () => {
    expect(source).toContain("aria-pressed={mode === item}");
  });

  it("labels the private quote note field", () => {
    expect(source).toContain("aria-label={labels.privateQuote}");
  });
});
