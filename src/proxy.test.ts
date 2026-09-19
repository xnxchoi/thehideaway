import { NextRequest } from "next/server";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import {
  createLostGateCookieValue,
  LOST_GATE_COOKIE_NAME
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

const previousBetterAuthSecret = process.env.BETTER_AUTH_SECRET;
let lostGateCookie = "";

beforeAll(async () => {
  process.env.BETTER_AUTH_SECRET = "proxy-test-gate-secret";
  const value = await createLostGateCookieValue();
  if (!value) throw new Error("Failed to create the test LOST gate cookie");
  lostGateCookie = `${LOST_GATE_COOKIE_NAME}=${value}`;
});

afterAll(() => {
  if (previousBetterAuthSecret === undefined) {
    delete process.env.BETTER_AUTH_SECRET;
  } else {
    process.env.BETTER_AUTH_SECRET = previousBetterAuthSecret;
  }
});

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

  it("lets anonymous development users preview LOST checkout", async () => {
    vi.stubEnv("NODE_ENV", "development");
    try {
      const res = await proxy(makeRequest("/lostinseoul/checkout"));

      expect(res.headers.get("x-middleware-rewrite")).toBeNull();
      expect(res.headers.get("location")).toBeNull();
    } finally {
      vi.unstubAllEnvs();
    }
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

  it.each([
    "/lostinseoul",
    "/lostinseoul/auth/sign-in",
    "/lostinseoul/cart",
    "/lostinseoul/checkout",
    "/lostinseoul/collections/archive",
    "/lostinseoul/fragrance",
    "/lostinseoul/orders/order-ref",
    "/lostinseoul/payment/failure",
    "/lostinseoul/payment/return",
    "/lostinseoul/payment/success",
    "/lostinseoul/privacy",
    "/lostinseoul/products/coat",
    "/lostinseoul/refund",
    "/lostinseoul/terms"
  ])("password-gates concrete LOST page route %s", async (pathname) => {
    const res = await proxy(makeRequest(pathname));

    expect(res.headers.get("location")).toBe(
      `https://hideaway.test/lostinseoul/gate?returnTo=${encodeURIComponent(pathname)}`
    );
  });

  it.each(["/api/lost/private-quotes", "/api/lost/inventory/commands"])(
    "password-gates concrete LOST API route %s",
    async (pathname) => {
      const res = await proxy(
        makeRequest(pathname, undefined, "https://lostinseoul.com")
      );

      expect(res.headers.get("location")).toBe(
        `https://lostinseoul.com/gate?returnTo=${encodeURIComponent(pathname)}`
      );
    }
  );

  it.each([
    "/api/lost/cart",
    "/api/lost/checkout/cancel",
    "/api/lost/checkout/intent",
    "/api/lost/checkout/verify",
    "/api/commerce/orders",
    "/api/commerce/payments/card/confirm",
    "/api/commerce/payments/card/webhook"
  ])("retires the old commerce API after the gate", async (pathname) => {
    const res = await proxy(
      makeRequest(pathname, lostGateCookie, "https://lostinseoul.com")
    );

    expect(res.status).toBe(410);
    await expect(res.json()).resolves.toEqual({
      success: false,
      error: "commerce-api-retired"
    });
  });

  it("retires the legacy invoice API on the primary host", async () => {
    const res = await proxy(makeRequest("/api/invoice/pdf"));

    expect(res.status).toBe(410);
    await expect(res.json()).resolves.toEqual({
      success: false,
      error: "commerce-api-retired"
    });
  });

  it("lets PortOne plugin webhooks reach Payload without a gate cookie", async () => {
    const res = await proxy(
      makeRequest(
        "/api/payments/portone/webhooks",
        undefined,
        "https://lostinseoul.com"
      )
    );

    expect(res.headers.get("location")).toBeNull();
  });

  it("lets signed card webhooks reach verification without a gate cookie", async () => {
    const res = await proxy(
      makeRequest(
        "/api/lost/webhooks/portone",
        undefined,
        "https://lostinseoul.com"
      )
    );

    expect(res.headers.get("location")).toBeNull();
  });

  it("canonicalizes gated scoped lostinseoul.com product paths", async () => {
    const res = await proxy(
      makeRequest(
        "/lostinseoul/products/coat",
        lostGateCookie,
        "https://lostinseoul.com"
      )
    );

    expect(res.headers.get("x-middleware-rewrite")).toBeNull();
    expect(res.headers.get("location")).toBe(
      "https://lostinseoul.com/products/coat"
    );
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
      makeRequest(
        "/products/coat/unknown",
        undefined,
        "https://lostinseoul.com"
      )
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

  it("password-gates non-LOST API routes on lostinseoul.com", async () => {
    const res = await proxy(
      makeRequest("/api/auth/session", undefined, "https://lostinseoul.com")
    );

    expect(res.headers.get("location")).toBe(
      "https://lostinseoul.com/gate?returnTo=%2Fapi%2Fauth%2Fsession"
    );
  });

  it.each(["/api/users/me", "/api/addresses"])(
    "allows the exact plugin identity route %s",
    async (path) => {
      const response = await proxy(
        makeRequest(path, lostGateCookie, "https://lostinseoul.com")
      );
      expect(response.status).toBe(200);
      expect(response.headers.get("x-middleware-next")).toBe("1");
    }
  );

  it.each([
    "/api/users",
    "/api/users/other",
    "/api/users/me/other",
    "/api/addresses/other",
    "/api/unknown",
    "/vault"
  ])("denies unrelated LOST host route %s", async (path) => {
    const response = await proxy(
      makeRequest(path, lostGateCookie, "https://lostinseoul.com")
    );
    expect(response.status).toBe(404);
  });

  it("password-gates the exact API root on lostinseoul.com", async () => {
    const res = await proxy(
      makeRequest("/api", undefined, "https://lostinseoul.com")
    );

    expect(res.headers.get("location")).toBe(
      "https://lostinseoul.com/gate?returnTo=%2Fapi"
    );
  });

  it("keeps deployment health checks public on lostinseoul.com", async () => {
    const res = await proxy(
      makeRequest("/api/health", undefined, "https://lostinseoul.com")
    );

    expect(res.headers.get("location")).toBeNull();
  });

  it("password-gates LOST-host public media while allowing it after unlock", async () => {
    const ungated = await proxy(
      makeRequest(
        "/assets/lostinseoul/campaign.webp",
        undefined,
        "https://lostinseoul.com"
      )
    );
    const gated = await proxy(
      makeRequest(
        "/assets/lostinseoul/campaign.webp",
        lostGateCookie,
        "https://lostinseoul.com"
      )
    );

    expect(ungated.headers.get("location")).toBe(
      "https://lostinseoul.com/gate?returnTo=%2Fassets%2Flostinseoul%2Fcampaign.webp"
    );
    expect(gated.headers.get("location")).toBeNull();
    expect(gated.status).toBe(200);
  });

  it("password-gates the LOST-host image optimizer alias", async () => {
    const pathname =
      "/_next/image?url=%2Fassets%2Flostinseoul%2Fcampaign.webp&w=1920&q=75";
    const res = await proxy(
      makeRequest(pathname, undefined, "https://lostinseoul.com")
    );

    expect(res.headers.get("location")).toBe(
      `https://lostinseoul.com/gate?returnTo=${encodeURIComponent("/_next/image")}`
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

  it("runs proxy on public page routes so LOST host routing can fire", () => {
    expect(config.matcher[0]).toBe("/((?!_next/static|fonts/).*)");
  });

  it("keeps the proxy matcher scoped to operational routes", () => {
    expect(config.matcher).toEqual([
      "/((?!_next/static|fonts/).*)",
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

describe("guest order detail routing", () => {
  it.each(["/lostinseoul/orders/LIS-guest", "/lostinseoul/orders/LIS-guest/"])(
    "lets an unlocked anonymous visitor reach the capability form at %s",
    async (path) => {
      const response = await proxy(makeRequest(path, lostGateCookie));

      expect(response.headers.get("location")).toBeNull();
      expect(response.headers.get("x-middleware-next")).toBe("1");
    }
  );

  it("rewrites an anonymous canonical LOST detail request to the capability form", async () => {
    const response = await proxy(
      makeRequest(
        "/orders/LIS-guest",
        lostGateCookie,
        "https://lostinseoul.com"
      )
    );

    expect(response.headers.get("location")).toBeNull();
    expect(response.headers.get("x-middleware-rewrite")).toBe(
      "https://lostinseoul.com/lostinseoul/orders/LIS-guest"
    );
  });

  it("canonicalizes the prefixed LOST detail route before guest lookup", async () => {
    const response = await proxy(
      makeRequest(
        "/lostinseoul/orders/LIS-guest",
        lostGateCookie,
        "https://lostinseoul.com"
      )
    );

    expect(response.status).toBe(308);
    expect(response.headers.get("location")).toBe(
      "https://lostinseoul.com/orders/LIS-guest"
    );
  });

  it.each([
    "/lostinseoul/orders",
    "/lostinseoul/orders/",
    "/lostinseoul/orders/LIS-guest/extra",
    "/lostinseoul/checkout",
    "/me/orders",
    "/prive"
  ])("retains anonymous sign-in protection for %s", async (path) => {
    const response = await proxy(makeRequest(path, lostGateCookie));

    expect(response.status).toBe(307);
    const location = new URL(response.headers.get("location")!);
    expect(location.pathname).toBe(
      path.startsWith("/lostinseoul/")
        ? "/lostinseoul/auth/sign-in"
        : "/sign-in"
    );
    expect(location.searchParams.get("redirectTo")).toBe(path);
  });

  it.each(["/orders/LIS-guest/extra", "/orders-extra/LIS-guest"])(
    "does not expose an unrelated canonical LOST route %s",
    async (path) => {
      const response = await proxy(
        makeRequest(path, lostGateCookie, "https://lostinseoul.com")
      );

      expect(response.status).toBe(404);
      expect(response.headers.get("x-middleware-rewrite")).toBeNull();
    }
  );

  it.each([
    [
      "https://hideaway.test",
      "/lostinseoul/orders/LIS-guest",
      "/lostinseoul/gate"
    ],
    ["https://lostinseoul.com", "/orders/LIS-guest", "/gate"]
  ])(
    "retains the launch gate before guest lookup on %s",
    async (origin, path, gate) => {
      const response = await proxy(makeRequest(path, undefined, origin));

      expect(response.status).toBe(307);
      const location = new URL(response.headers.get("location")!);
      expect(location.pathname).toBe(gate);
      expect(location.searchParams.get("returnTo")).toBe(path);
    }
  );
});

describe("canonical LOST storefront routes", () => {
  it.each(["/orders", "/orders/"])(
    "requires sign-in for canonical account history %s",
    async (path) => {
      const response = await proxy(
        makeRequest(path, lostGateCookie, "https://lostinseoul.com")
      );

      expect(response.status).toBe(307);
      expect(response.headers.get("location")).toBe(
        "https://lostinseoul.com/auth/sign-in?redirectTo=%2Forders"
      );
    }
  );

  // Cloned NextURL serialization retains the incoming trailing slash.
  it.each([
    ["/orders", "/lostinseoul/orders"],
    ["/orders/", "/lostinseoul/orders/"]
  ])(
    "rewrites signed-in canonical account history %s to its server-validated page",
    async (path, internalPath) => {
      const response = await proxy(
        makeRequest(
          `${path}?page=2`,
          `${lostGateCookie}; better-auth.session_token=abc`,
          "https://lostinseoul.com"
        )
      );

      expect(response.headers.get("location")).toBeNull();
      expect(response.headers.get("x-middleware-rewrite")).toBe(
        `https://lostinseoul.com${internalPath}?page=2`
      );
    }
  );

  it("canonicalizes prefixed account history while preserving its page query", async () => {
    const response = await proxy(
      makeRequest(
        "/lostinseoul/orders?page=2",
        lostGateCookie,
        "https://lostinseoul.com"
      )
    );
    expect(response.status).toBe(308);
    expect(response.headers.get("location")).toBe(
      "https://lostinseoul.com/orders?page=2"
    );
  });

  it("keeps canonical account history behind the launch gate", async () => {
    const response = await proxy(
      makeRequest("/orders", undefined, "https://lostinseoul.com")
    );
    expect(response.status).toBe(307);
    expect(response.headers.get("location")).toBe(
      "https://lostinseoul.com/gate?returnTo=%2Forders"
    );
  });

  it.each([
    "/",
    "/products/coat",
    "/collections/archive",
    "/fragrance",
    "/cart",
    "/checkout",
    "/orders/order-ref",
    "/payment/return",
    "/payment/success",
    "/payment/failure",
    "/payment/pending",
    "/auth/sign-in",
    "/policy",
    "/policy/privacy"
  ])("rewrites %s only on the LOST host, preserving query", async (path) => {
    const cookie = `${lostGateCookie}; better-auth.session_token=abc`;
    const res = await proxy(
      makeRequest(`${path}?currency=KRW`, cookie, "https://lostinseoul.com")
    );
    expect(res.headers.get("x-middleware-rewrite")).toBe(
      `https://lostinseoul.com/lostinseoul${path === "/" ? "" : path}?currency=KRW`
    );
    expect(res.headers.get("location")).toBeNull();
    const primary = await proxy(makeRequest(path, cookie));
    expect(primary.headers.get("x-middleware-rewrite")).toBeNull();
  });

  it.each(["GET", "HEAD"])(
    "canonicalizes legacy %s links with query preserved",
    async (method) => {
      const res = await proxy(
        new NextRequest(
          "https://lostinseoul.com/lostinseoul/products/coat?variant=blue",
          { method, headers: { cookie: lostGateCookie } }
        )
      );
      expect(res.status).toBe(308);
      expect(res.headers.get("location")).toBe(
        "https://lostinseoul.com/products/coat?variant=blue"
      );
    }
  );

  it.each([
    "lostinseoul.com:443@evil.test",
    "lostinseoul.com:443/evil",
    "lostinseoul.com:443?evil",
    "lostinseoul.com:65536"
  ])("does not redirect a malformed Host %s", async (host) => {
    const response = await proxy(
      new NextRequest("https://hideawayseoul.com/lostinseoul/products/coat", {
        headers: { host, cookie: lostGateCookie }
      })
    );
    expect(response.headers.get("location")).toBeNull();
  });

  it("preserves a valid non-default public port", async () => {
    const response = await proxy(
      new NextRequest("http://payload:3000/lostinseoul/cart", {
        headers: {
          host: "lostinseoul.com:8443",
          "x-forwarded-proto": "https",
          cookie: lostGateCookie
        }
      })
    );
    expect(response.headers.get("location")).toBe(
      "https://lostinseoul.com:8443/cart"
    );
  });

  it("canonicalizes behind nginx to the public host and protocol", async () => {
    const response = await proxy(
      new NextRequest("http://payload:3000/lostinseoul/cart?currency=KRW", {
        headers: {
          host: "lostinseoul.com",
          "x-forwarded-proto": "https",
          cookie: lostGateCookie
        }
      })
    );
    expect(response.headers.get("location")).toBe(
      "https://lostinseoul.com/cart?currency=KRW"
    );
  });

  it("forwards legacy server action POST bodies without canonical redirect", async () => {
    const res = await proxy(
      new NextRequest("https://lostinseoul.com/lostinseoul/products/coat", {
        method: "POST",
        body: "action-body",
        headers: { cookie: lostGateCookie, "next-action": "example" }
      })
    );
    expect(res.headers.get("location")).toBeNull();
    expect(res.status).toBe(200);
  });

  it.each([
    "/essays",
    "/products",
    "/products/coat/extra",
    "/lostinseoul/unknown",
    "/auth/sign-up",
    "/payment/unknown"
  ])("rejects unrelated route %s", async (path) => {
    const res = await proxy(
      makeRequest(path, lostGateCookie, "https://lostinseoul.com")
    );
    expect(res.status).toBe(404);
  });

  it("keeps guest checkout on the existing storefront sign-in flow", async () => {
    const res = await proxy(
      makeRequest("/checkout", lostGateCookie, "https://lostinseoul.com")
    );
    expect(res.headers.get("location")).toBe(
      "https://lostinseoul.com/auth/sign-in?redirectTo=%2Fcheckout"
    );
  });
});
