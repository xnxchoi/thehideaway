import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const releaseScript = readFileSync(
  join(__dirname, "../../scripts/cut-release.sh"),
  "utf8"
);

describe("cut-release", () => {
  it("runs the local build with the decrypted production env it just validated", () => {
    const buildSection =
      releaseScript.match(
        /step "6\/8\s+build \(verifies pnpm install \+ pnpm build \+ standalone\)"[\s\S]*?info "standalone present"/
      )?.[0] ?? "";

    expect(buildSection).toContain('. "${TMP_ENV}"');
    expect(buildSection).toMatch(
      /set -a[\s\S]*\. "\$\{TMP_ENV\}"[\s\S]*set \+a[\s\S]*pnpm build/
    );
    expect(buildSection).not.toContain("\npnpm build\nif [[");
  });
});
