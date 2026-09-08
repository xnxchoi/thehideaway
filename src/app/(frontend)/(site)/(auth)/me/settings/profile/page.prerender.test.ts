import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const src = readFileSync(resolve(import.meta.dirname, "page.tsx"), "utf8");

describe("settings profile Instant UI contract", () => {
  it("does not wrap the page in Suspense so the previous pane stays until ready", () => {
    expect(src).toMatch(/export default async function ProfileSettingsPage\(/);
    expect(src).not.toMatch(/<Suspense/);
  });
});
