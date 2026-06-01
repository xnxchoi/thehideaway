import { NextRequest } from "next/server";
import { describe, expect, it } from "vitest";
import { proxy } from "./proxy";

function makeRequest(
  pathname: string,
  cookie?: string,
  origin = "https://hideaway.test"
): NextRequest {
  return new NextRequest(`${origin}${pathname}`, {
    headers: cookie ? { cookie } : undefined
  });
}

describe("proxy routing", () => {
  it("lets anonymous site routes keep the route they requested", async () => {
    const res = await proxy(makeRequest("/essays"));

    expect(res.headers.get("x-middleware-rewrite")).toBeNull();
    expect(res.headers.get("location")).toBeNull();
  });

  it("lets signed-in users keep the route they requested", async () => {
    const res = await proxy(
      makeRequest("/essays", "better-auth.session_token=abc")
    );

    expect(res.headers.get("x-middleware-rewrite")).toBeNull();
    expect(res.headers.get("location")).toBeNull();
  });

  it("lets /plans pass through now that the launch gate is lifted", async () => {
    const res = await proxy(makeRequest("/plans"));

    expect(res.headers.get("x-middleware-rewrite")).toBeNull();
    expect(res.headers.get("location")).toBeNull();
  });

  it("still redirects protected routes when no session is present", async () => {
    const res = await proxy(makeRequest("/me"));

    expect(res.headers.get("x-middleware-rewrite")).toBeNull();
    expect(res.headers.get("location")).toBe(
      "https://hideaway.test/sign-in?callbackUrl=%2Fme"
    );
  });

  it("lets signed-in users keep protected routes", async () => {
    const res = await proxy(
      makeRequest("/me", "better-auth.session_token=abc")
    );

    expect(res.headers.get("x-middleware-rewrite")).toBeNull();
    expect(res.headers.get("location")).toBeNull();
  });

  it("host-routes lostinseoul.com root into the internal storefront route", async () => {
    const res = await proxy(
      makeRequest("/", undefined, "https://lostinseoul.com")
    );

    expect(res.headers.get("x-middleware-rewrite")).toBe(
      "https://lostinseoul.com/lostinseoul"
    );
  });

  it("host-routes lostinseoul.com products without exposing the internal prefix", async () => {
    const res = await proxy(
      makeRequest("/products/coat", undefined, "https://lostinseoul.com")
    );

    expect(res.headers.get("x-middleware-rewrite")).toBe(
      "https://lostinseoul.com/lostinseoul/products/coat"
    );
  });

  it("does not host-route localhost when the local LOSTINSEOUL URL points at the dev server", async () => {
    const previousLostUrl = process.env.NEXT_PUBLIC_LOSTINSEOUL_URL;
    process.env.NEXT_PUBLIC_LOSTINSEOUL_URL = "http://localhost:3000";

    try {
      const res = await proxy(
        makeRequest(
          "/",
          "better-auth.session_token=abc",
          "http://localhost:3000"
        )
      );

      expect(res.headers.get("x-middleware-rewrite")).toBeNull();
      expect(res.headers.get("location")).toBeNull();
    } finally {
      if (previousLostUrl === undefined) {
        delete process.env.NEXT_PUBLIC_LOSTINSEOUL_URL;
      } else {
        process.env.NEXT_PUBLIC_LOSTINSEOUL_URL = previousLostUrl;
      }
    }
  });
});
