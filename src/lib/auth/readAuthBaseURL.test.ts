import { afterEach, describe, expect, it } from "vitest";
import { readAuthBaseURL } from "./readAuthBaseURL";

const originalEnv = { ...process.env };

function resetEnv() {
  for (const key of [
    "NEXT_PUBLIC_BETTER_AUTH_URL",
    "NEXT_PUBLIC_SERVER_URL",
    "NEXT_PUBLIC_LOSTINSEOUL_URL",
    "NEXT_PUBLIC_PRODUCTION_URL"
  ] as const) {
    const value = originalEnv[key];
    if (value === undefined) {
      delete process.env[key];
    } else {
      process.env[key] = value;
    }
  }
}

describe("readAuthBaseURL", () => {
  afterEach(() => {
    resetEnv();
  });

  it("uses the configured Better Auth URL outside the browser", () => {
    process.env.NEXT_PUBLIC_BETTER_AUTH_URL = "https://hideawayseoul.com";

    expect(readAuthBaseURL()).toBe("https://hideawayseoul.com");
  });

  it("keeps LOSTINSEOUL auth requests same-origin without requiring an env var", () => {
    process.env.NEXT_PUBLIC_BETTER_AUTH_URL = "https://hideawayseoul.com";
    delete process.env.NEXT_PUBLIC_LOSTINSEOUL_URL;

    expect(
      readAuthBaseURL({
        hostname: "lostinseoul.com",
        origin: "https://lostinseoul.com"
      })
    ).toBe("https://lostinseoul.com");
  });

  it("keeps configured alternate origins same-origin", () => {
    process.env.NEXT_PUBLIC_BETTER_AUTH_URL = "https://hideawayseoul.com";
    process.env.NEXT_PUBLIC_PRODUCTION_URL =
      "https://preview.hideawayseoul.com";

    expect(
      readAuthBaseURL({
        hostname: "preview.hideawayseoul.com",
        origin: "https://preview.hideawayseoul.com"
      })
    ).toBe("https://preview.hideawayseoul.com");
  });
});
