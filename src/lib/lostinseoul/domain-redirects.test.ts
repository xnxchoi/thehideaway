import { describe, expect, it, vi } from "vitest";
import { unstable_getResponseFromNextConfig } from "next/experimental/testing/server";
import config from "../../../next.config";

vi.mock("@payloadcms/next/withPayload", () => ({
  withPayload: (config: unknown) => config
}));
vi.mock("next-intl/plugin", () => ({
  default: () => (config: unknown) => config
}));

describe("LOST auth redirect precedence", () => {
  it.each(["lostinseoul.com", "www.lostinseoul.com"])(
    "lets %s sign-in reach the host proxy",
    async (host) => {
      const response = await unstable_getResponseFromNextConfig({
        url: `https://${host}/auth/sign-in?redirectTo=%2Fcheckout`,
        nextConfig: config
      });
      expect(response.headers.get("location")).toBeNull();
    }
  );
  it("keeps the Hideaway legacy sign-in redirect", async () => {
    const response = await unstable_getResponseFromNextConfig({
      url: "https://hideawayseoul.com/auth/sign-in?redirectTo=%2Fme",
      nextConfig: config
    });
    expect(response.headers.get("location")).toBe(
      "https://hideawayseoul.com/sign-in?redirectTo=%2Fme"
    );
  });
});
