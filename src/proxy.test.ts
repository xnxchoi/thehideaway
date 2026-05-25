import { NextRequest } from "next/server";
import { describe, expect, it } from "vitest";
import { proxy } from "./proxy";

function makeRequest(pathname: string, cookie?: string): NextRequest {
  return new NextRequest(`https://hideaway.test${pathname}`, {
    headers: cookie ? { cookie } : undefined
  });
}

describe("proxy navigation gate", () => {
  it("rewrites anonymous non-allowlisted routes to the generic gate", async () => {
    const res = await proxy(makeRequest("/essays"));

    expect(res.status).toBe(200);
    expect(res.headers.get("x-middleware-rewrite")).toBe(
      "https://hideaway.test/gate"
    );
    expect(res.headers.get("location")).toBeNull();
  });

  it("lets signed-in users keep the route they requested", async () => {
    const res = await proxy(
      makeRequest("/essays", "better-auth.session_token=abc")
    );

    expect(res.headers.get("x-middleware-rewrite")).toBeNull();
    expect(res.headers.get("location")).toBeNull();
  });

  it("locks /plans even for signed-in users while the membership surface is paused", async () => {
    const res = await proxy(
      makeRequest("/plans", "better-auth.session_token=abc")
    );

    expect(res.status).toBe(200);
    expect(res.headers.get("x-middleware-rewrite")).toBe(
      "https://hideaway.test/gate"
    );
    expect(res.headers.get("location")).toBeNull();
  });

  it("locks nested /plans paths as well", async () => {
    const res = await proxy(
      makeRequest("/plans/subscription", "better-auth.session_token=abc")
    );

    expect(res.headers.get("x-middleware-rewrite")).toBe(
      "https://hideaway.test/gate"
    );
  });
});
