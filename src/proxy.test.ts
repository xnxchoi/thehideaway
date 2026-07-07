import { NextRequest } from "next/server";
import { describe, expect, it } from "vitest";
import {
  LOST_GATE_COOKIE_NAME,
  LOST_GATE_COOKIE_VALUE
} from "@/lib/lostinseoul/gate";
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

const lostGateCookie = `${LOST_GATE_COOKIE_NAME}=${LOST_GATE_COOKIE_VALUE}`;

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

  it("password-gates anonymous LOST checkout users before sign-in", async () => {
    const res = await proxy(makeRequest("/lostinseoul/checkout"));

    expect(res.headers.get("x-middleware-rewrite")).toBeNull();
    expect(res.headers.get("location")).toBe(
      "https://hideaway.test/lostinseoul/gate?returnTo=%2Flostinseoul%2Fcheckout"
    );
  });

  it("redirects gated anonymous LOST checkout users back to checkout after sign-in", async () => {
    const res = await proxy(
      makeRequest("/lostinseoul/checkout", lostGateCookie)
    );

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

  it("redirects ungated lostinseoul.com root requests to the public gate", async () => {
    const res = await proxy(
      makeRequest("/", undefined, "https://lostinseoul.com")
    );

    expect(res.headers.get("x-middleware-rewrite")).toBeNull();
    expect(res.headers.get("location")).toBe(
      "https://lostinseoul.com/gate?returnTo=%2F"
    );
  });

  it("host-routes gated lostinseoul.com root into the internal storefront route", async () => {
    const res = await proxy(
      makeRequest("/", lostGateCookie, "https://lostinseoul.com")
    );

    expect(res.headers.get("x-middleware-rewrite")).toBe(
      "https://lostinseoul.com/lostinseoul"
    );
  });

  it("host-routes gated forwarded lostinseoul.com root requests behind the production proxy", async () => {
    const res = await proxy(
      new NextRequest("http://payload:3000/", {
        headers: {
          cookie: lostGateCookie,
          host: "lostinseoul.com"
        }
      })
    );

    expect(res.headers.get("x-middleware-rewrite")).toBe(
      "http://payload:3000/lostinseoul"
    );
  });

  it.each(["/privacy", "/terms", "/refund"])(
    "redirects ungated lostinseoul.com %s requests to the public gate",
    async (publicPath) => {
      const res = await proxy(
        makeRequest(publicPath, undefined, "https://lostinseoul.com")
      );

      expect(res.headers.get("x-middleware-rewrite")).toBeNull();
      expect(res.headers.get("location")).toBe(
        `https://lostinseoul.com/gate?returnTo=${encodeURIComponent(publicPath)}`
      );
    }
  );

  it.each([
    ["/privacy", "/lostinseoul/privacy"],
    ["/terms", "/lostinseoul/terms"],
    ["/refund", "/lostinseoul/refund"]
  ])(
    "host-routes gated lostinseoul.com %s into the LOST legal route",
    async (publicPath, internalPath) => {
      const res = await proxy(
        makeRequest(publicPath, lostGateCookie, "https://lostinseoul.com")
      );

      expect(res.headers.get("x-middleware-rewrite")).toBe(
        `https://lostinseoul.com${internalPath}`
      );
      expect(res.headers.get("location")).toBeNull();
    }
  );

  it("redirects ungated scoped LOST paths to the internal gate", async () => {
    const res = await proxy(makeRequest("/lostinseoul/products/coat"));

    expect(res.headers.get("x-middleware-rewrite")).toBeNull();
    expect(res.headers.get("location")).toBe(
      "https://hideaway.test/lostinseoul/gate?returnTo=%2Flostinseoul%2Fproducts%2Fcoat"
    );
  });

  it("lets gated scoped lostinseoul.com product paths pass through", async () => {
    const res = await proxy(
      makeRequest(
        "/lostinseoul/products/coat",
        lostGateCookie,
        "https://lostinseoul.com"
      )
    );

    expect(res.headers.get("x-middleware-rewrite")).toBeNull();
    expect(res.headers.get("location")).toBeNull();
  });

  it("lets the LOST gate page and submit endpoint pass without a gate cookie", async () => {
    const publicGate = await proxy(
      makeRequest("/gate", undefined, "https://lostinseoul.com")
    );
    const internalGate = await proxy(makeRequest("/lostinseoul/gate"));
    const gatePost = await proxy(
      makeRequest("/api/lost/gate", undefined, "https://lostinseoul.com")
    );

    expect(publicGate.headers.get("x-middleware-rewrite")).toBe(
      "https://lostinseoul.com/lostinseoul/gate"
    );
    expect(internalGate.headers.get("location")).toBeNull();
    expect(gatePost.headers.get("location")).toBeNull();
  });

  it("password-gates LOST API routes except the gate submit endpoint", async () => {
    const ungated = await proxy(
      makeRequest("/api/lost/products", undefined, "https://lostinseoul.com")
    );
    const gated = await proxy(
      makeRequest(
        "/api/lost/products",
        lostGateCookie,
        "https://lostinseoul.com"
      )
    );

    expect(ungated.headers.get("location")).toBe(
      "https://lostinseoul.com/gate?returnTo=%2Fapi%2Flost%2Fproducts"
    );
    expect(gated.headers.get("location")).toBeNull();
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
      "/checkout/:path*",
      "/lostinseoul/checkout/:path*",
      "/lostinseoul/orders/:path*"
    ]);
  });
});
