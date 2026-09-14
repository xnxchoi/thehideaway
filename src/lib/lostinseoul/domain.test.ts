import { describe, expect, it } from "vitest";
import {
  isLostHost,
  lostInternalPath,
  lostPublicHref,
  lostHostRedirectPattern
} from "./domain";

describe("LOST domain boundary", () => {
  it.each(["lostinseoul.com", "WWW.LOSTINSEOUL.COM:443", " lostinseoul.com "])(
    "recognizes %s",
    (host) => expect(isLostHost(host, "")).toBe(true)
  );
  it.each([
    null,
    undefined,
    "",
    "hideawayseoul.com",
    "lostinseoul.com.evil.test",
    "localhost:3000",
    "lostinseoul.com:443@evil.test",
    "lostinseoul.com/path",
    "lostinseoul.com?query=1",
    "lostinseoul.com#hash",
    "lostinseoul.com:abc",
    "lostinseoul.com:65536",
    "lostinseoul.com:"
  ])("rejects other host %s", (host) =>
    expect(isLostHost(host, "")).toBe(false)
  );
  it("recognizes a configured non-local host", () => {
    expect(isLostHost("shop.test:443", "https://shop.test")).toBe(true);
    expect(isLostHost("localhost:3000", "http://localhost:3000")).toBe(false);
    expect(isLostHost("127.0.0.1", "http://127.0.0.1")).toBe(false);
    expect(isLostHost("[::1]:3000", "http://[::1]:3000")).toBe(false);
    expect(isLostHost("shop.test", "invalid")).toBe(false);
  });
  it("uses exact public route shapes", () => {
    expect(lostInternalPath("/products/한글")).toBe(
      "/lostinseoul/products/한글"
    );
    expect(lostInternalPath("/checkout/")).toBe("/lostinseoul/checkout");
    expect(lostInternalPath("/essays/a")).toBeNull();
    expect(lostInternalPath("/products/a/extra")).toBeNull();
    expect(lostInternalPath("/auth/sign-up")).toBeNull();
  });
  it("normalizes only scoped internal hrefs on a LOST host", () => {
    expect(
      lostPublicHref("/lostinseoul/products/coat?variant=blue#buy", true)
    ).toBe("/products/coat?variant=blue#buy");
    expect(lostPublicHref("/lostinseoul?currency=KRW", true)).toBe(
      "/?currency=KRW"
    );
    for (const href of [
      "/lostinseoul-other",
      "/lostinseoul/unknown",
      "/essays",
      "#buy",
      "https://elsewhere.test/lostinseoul",
      "//elsewhere.test/lostinseoul"
    ]) {
      expect(lostPublicHref(href, true)).toBe(href);
    }
    expect(lostPublicHref("/lostinseoul/cart", false)).toBe(
      "/lostinseoul/cart"
    );
  });
  it("excludes LOST hosts from legacy auth redirects", () => {
    const pattern = new RegExp(
      `^(?:${lostHostRedirectPattern("https://shop.test")})$`,
      "i"
    );
    expect(pattern.test("lostinseoul.com")).toBe(true);
    expect(pattern.test("www.lostinseoul.com")).toBe(true);
    expect(pattern.test("shop.test")).toBe(true);
    expect(pattern.test("hideawayseoul.com")).toBe(false);
    expect(pattern.test("lostinseoulXcom")).toBe(false);
  });
});
