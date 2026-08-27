import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const src = readFileSync(
  resolve(import.meta.dirname, "authProviders.tsx"),
  "utf8"
);

describe("AuthUIProvider sign-up fields", () => {
  it("does not treat email or password as additional fields", () => {
    const fieldsMatch = src.match(/signUp=\{\{[\s\S]*?fields:\s*\[([^\]]+)\]/);
    expect(fieldsMatch).not.toBeNull();
    const fields = fieldsMatch![1];
    expect(fields).not.toMatch(/["']email["']/);
    expect(fields).not.toMatch(/["']password["']/);
    expect(fields).toMatch(/["']name["']/);
  });
});
