import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const source = readFileSync(new URL("./passkey-button.tsx", import.meta.url), "utf8");

describe("PasskeyButton success navigation", () => {
  it("delegates the only post-authentication navigation to the success hook", () => {
    expect(source).toContain("await onSuccess();");
    expect(source).not.toContain("useTransitionRouter");
    expect(source).not.toContain("router.push");
  });
});
