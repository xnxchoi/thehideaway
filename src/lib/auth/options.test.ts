import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const source = readFileSync(new URL("./options.ts", import.meta.url), {
  encoding: "utf8"
});

describe("auth options", () => {
  it("derives the passkey RP ID from the configured app URL", () => {
    expect(source).toContain("const appHost = new URL(appURL).hostname");
    expect(source).toContain("rpID: appHost");
    expect(source).not.toContain('rpID: new URL("http://localhost:3000")');
  });
});
