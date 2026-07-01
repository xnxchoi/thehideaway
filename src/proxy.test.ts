import { NextRequest } from "next/server";
import { describe, expect, it } from "vitest";
import { config, proxy } from "./proxy";

function makeRequest(
  pathname: string,
  cookie?: string,
  origin = "https://hideaway.test"
): NextRequest {
  return new NextRequest(`${origin}${pathname}`, {
    headers: cookie ? { cookie } : undefined
  });
}

function makeForwardedHostRequest(pathname: string, host: string): NextRequest {
  return new NextRequest(`http://payload:3000${pathname}`, {
    headers: { host, "x-forwarded-proto": "https" }
  });
}

describe("proxy routing", () => {
  it("lets anonymous routes reach the path they requested", async () => {
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

  it("does not rewrite nested /plans paths", async () => {
    const res = await proxy(
      makeRequest("/plans/subscription", "better-auth.session_token=abc")
    );

    expect(res.headers.get("x-middleware-rewrite")).toBeNull();
  });

  it("still redirects protected routes when no session is present", async () => {
    const res = await proxy(makeRequest("/me"));

    expect(res.headers.get("x-middleware-rewrite")).toBeNull();
    expect(res.headers.get("location")).toBe(
      "https://hideaway.test/sign-in?redirectTo=%2Fme"
    );
  });

  it("redirects anonymous LOST checkout users back to checkout after sign-in", async () => {
    const res = await proxy(makeRequest("/lostinseoul/checkout"));

    expect(res.headers.get("x-middleware-rewrite")).toBeNull();
    expect(res.headers.get("location")).toBe(
      "https://hideaway.test/lostinseoul/auth/sign-in?redirectTo=%2Flostinseoul%2Fcheckout"
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

    expect(res.headers.get("x-middleware-rewrite")).toBeNull();
    expect(res.headers.get("location")).toBe(
      "https://lostinseoul.com/lostinseoul"
    );
  });

  it("host-routes forwarded lostinseoul.com root requests behind the production proxy", async () => {
    const res = await proxy(makeForwardedHostRequest("/", "lostinseoul.com"));

    expect(res.headers.get("x-middleware-rewrite")).toBeNull();
    expect(res.headers.get("location")).toBe(
      "https://lostinseoul.com/lostinseoul"
    );
  });

  it("lets scoped lostinseoul.com product paths pass through", async () => {
    const res = await proxy(
      makeRequest(
        "/lostinseoul/products/coat",
        undefined,
        "https://lostinseoul.com"
      )
    );

    expect(res.headers.get("x-middleware-rewrite")).toBeNull();
    expect(res.headers.get("location")).toBeNull();
  });

  it("does not expose root-level product shortcuts on lostinseoul.com", async () => {
    const res = await proxy(
      makeRequest("/products/coat", undefined, "https://lostinseoul.com")
    );

    expect(res.status).toBe(404);
    expect(res.headers.get("x-middleware-rewrite")).toBeNull();
    expect(res.headers.get("location")).toBeNull();
  });

  it("does not expose Hideaway page routes on lostinseoul.com", async () => {
    const res = await proxy(
      makeRequest("/plans", undefined, "https://lostinseoul.com")
    );

    expect(res.status).toBe(404);
    expect(res.headers.get("x-middleware-rewrite")).toBeNull();
    expect(res.headers.get("location")).toBeNull();
  });

  it("does not expose vanity author routes on lostinseoul.com", async () => {
    const res = await proxy(
      makeRequest("/@sean/essays/post", undefined, "https://lostinseoul.com")
    );

    expect(res.status).toBe(404);
    expect(res.headers.get("x-middleware-rewrite")).toBeNull();
    expect(res.headers.get("location")).toBeNull();
  });

  it("keeps api routes available on lostinseoul.com", async () => {
    const res = await proxy(
      makeRequest("/api/auth/session", undefined, "https://lostinseoul.com")
    );

    expect(res.status).toBe(200);
    expect(res.headers.get("x-middleware-rewrite")).toBeNull();
    expect(res.headers.get("location")).toBeNull();
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

  it("runs proxy on public page routes so LOST host routing can fire", () => {
    expect(config.matcher[0]).toBe(
      "/((?!_next/static|_next/image|assets/|fonts/|images/|.*\\.(?:png|jpg|jpeg|gif|webp|avif|svg|ico|css|js|map|woff|woff2|ttf|otf|mp3|mp4|webm|mov|json|txt|xml)).*)"
    );
  });

  it("keeps the proxy matcher scoped to operational routes", () => {
    expect(config.matcher).toEqual([
      "/((?!_next/static|_next/image|assets/|fonts/|images/|.*\\.(?:png|jpg|jpeg|gif|webp|avif|svg|ico|css|js|map|woff|woff2|ttf|otf|mp3|mp4|webm|mov|json|txt|xml)).*)",
      "/api/:path*",
      "/me/:path*",
      "/prive/:path*",
      "/account/:path*",
      "/admin-ba/:path*",
      "/lostinseoul/checkout/:path*",
      "/lostinseoul/orders/:path*"
    ]);
  });
});
