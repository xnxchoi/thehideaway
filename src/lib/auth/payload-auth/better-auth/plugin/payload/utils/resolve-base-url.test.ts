import { describe, expect, it } from "vitest";

import { resolveBaseURL } from "./resolve-base-url";

describe("resolveBaseURL", () => {
  it("preserves a static Better Auth URL", () => {
    expect(resolveBaseURL("https://hideaway.example")).toBe(
      "https://hideaway.example"
    );
  });

  it("uses the configured fallback when no request headers are available", () => {
    expect(
      resolveBaseURL({
        allowedHosts: ["*.hideaway.example"],
        fallback: "https://hideaway.example"
      })
    ).toBe("https://hideaway.example");
  });
});
