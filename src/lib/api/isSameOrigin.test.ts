import { afterEach, beforeEach, describe, expect, it } from "vitest";
import type { NextRequest } from "next/server";

function makeReq(origin?: string, referer?: string): NextRequest {
  const headers = new Headers();
  if (origin) headers.set("origin", origin);
  if (referer) headers.set("referer", referer);
  return {
    headers: {
      get: (key: string) => headers.get(key)
    }
  } as unknown as NextRequest;
}

const SITE = "https://hideawayseoul.com";

describe("isSameOrigin", () => {
  let orig: string | undefined;
  let lostOrig: string | undefined;

  beforeEach(() => {
    orig = process.env.NEXT_PUBLIC_SERVER_URL;
    lostOrig = process.env.NEXT_PUBLIC_LOSTINSEOUL_URL;
    process.env.NEXT_PUBLIC_SERVER_URL = SITE;
    process.env.NEXT_PUBLIC_LOSTINSEOUL_URL = "https://lostinseoul.com";
  });

  afterEach(() => {
    process.env.NEXT_PUBLIC_SERVER_URL = orig;
    process.env.NEXT_PUBLIC_LOSTINSEOUL_URL = lostOrig;
  });

  it("accepts a matching origin header", async () => {
    const { isSameOrigin } = await import("./isSameOrigin");
    expect(isSameOrigin(makeReq(SITE))).toBe(true);
  });

  it("accepts a matching referer header when origin is absent", async () => {
    const { isSameOrigin } = await import("./isSameOrigin");
    expect(isSameOrigin(makeReq(undefined, `${SITE}/some/path`))).toBe(true);
  });

  it("accepts the LOSTINSEOUL storefront origin", async () => {
    const { isSameOrigin } = await import("./isSameOrigin");
    expect(isSameOrigin(makeReq("https://lostinseoul.com"))).toBe(true);
  });

  it("accepts LOSTINSEOUL storefront origin when optional env is absent", async () => {
    delete process.env.NEXT_PUBLIC_LOSTINSEOUL_URL;

    const { isSameOrigin } = await import("./isSameOrigin");

    expect(isSameOrigin(makeReq("https://lostinseoul.com"))).toBe(true);
    expect(isSameOrigin(makeReq("https://www.lostinseoul.com"))).toBe(true);
  });

  it("rejects a different host", async () => {
    const { isSameOrigin } = await import("./isSameOrigin");
    expect(isSameOrigin(makeReq("https://evil.com"))).toBe(false);
  });

  it("rejects a different protocol (http vs https)", async () => {
    const { isSameOrigin } = await import("./isSameOrigin");
    expect(isSameOrigin(makeReq("http://hideawayseoul.com"))).toBe(false);
  });

  it("rejects when no origin or referer header is present", async () => {
    const { isSameOrigin } = await import("./isSameOrigin");
    expect(isSameOrigin(makeReq())).toBe(false);
  });

  it("fails closed when NEXT_PUBLIC_SERVER_URL is unset", async () => {
    delete process.env.NEXT_PUBLIC_SERVER_URL;
    const { isSameOrigin } = await import("./isSameOrigin");
    expect(isSameOrigin(makeReq(SITE))).toBe(false);
  });

  it("rejects a subdomain of the allowed host", async () => {
    const { isSameOrigin } = await import("./isSameOrigin");
    expect(isSameOrigin(makeReq("https://sub.hideawayseoul.com"))).toBe(false);
  });

  it("rejects a malformed origin header", async () => {
    const { isSameOrigin } = await import("./isSameOrigin");
    expect(isSameOrigin(makeReq("not-a-url"))).toBe(false);
  });
});
