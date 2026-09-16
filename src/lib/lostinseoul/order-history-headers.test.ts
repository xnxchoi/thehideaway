import { describe, expect, it, vi } from "vitest";
import { unstable_getResponseFromNextConfig } from "next/experimental/testing/server";
import config from "../../../next.config";

vi.mock("@payloadcms/next/withPayload", () => ({
  withPayload: (config: unknown) => config
}));
vi.mock("next-intl/plugin", () => ({
  default: () => (config: unknown) => config
}));

describe.each(["hideawayseoul.com", "lostinseoul.com"])(
  "%s order history Next config header resolution",
  (host) => {
    it.each([
      "/api/lost/orders",
      "/api/lost/orders?reference=test&secret=test"
    ])("prevents referrer disclosure for %s", async (path) => {
      const response = await unstable_getResponseFromNextConfig({
        url: `https://${host}${path}`,
        nextConfig: config
      });
      expect(response.headers.get("referrer-policy")).toBe("no-referrer");
      expect(response.headers.get("x-content-type-options")).toBe("nosniff");
      expect(response.headers.get("x-frame-options")).toBe("SAMEORIGIN");
    });

    // This helper evaluates config rules, not the HTTP runtime. Next dev emits
    // the automatic 308 without these headers; nginx protects that redirect.
    it("resolves no-referrer for the trailing-slash path in config", async () => {
      const response = await unstable_getResponseFromNextConfig({
        url: `https://${host}/api/lost/orders/?reference=test&secret=test`,
        nextConfig: config
      });
      expect(response.status).toBe(308);
      expect(response.headers.get("location")).toBe(
        `https://${host}/api/lost/orders?reference=test&secret=test`
      );
      expect(response.headers.get("referrer-policy")).toBe("no-referrer");
    });

    it.each([
      "/api/lost/orders/extra",
      "/api/lost/orders-other",
      "/api/health",
      "/vault"
    ])("preserves the general policy for %s", async (path) => {
      const response = await unstable_getResponseFromNextConfig({
        url: `https://${host}${path}`,
        nextConfig: config
      });
      expect(response.headers.get("referrer-policy")).toBe(
        "strict-origin-when-cross-origin"
      );
    });
  }
);
