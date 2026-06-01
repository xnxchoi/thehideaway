import { NextRequest } from "next/server";
import { describe, expect, it } from "vitest";

function makeRequest(method: "GET" | "HEAD") {
  return new NextRequest("https://hideaway.test/gate", { method });
}

describe("/gate", () => {
  it("redirects GET requests to the normal home route", async () => {
    const { GET } = await import("./route");

    const res = GET(makeRequest("GET"));

    expect(res.status).toBe(307);
    expect(res.headers.get("location")).toBe("https://hideaway.test/");
  });

  it("redirects HEAD requests to the normal home route", async () => {
    const { HEAD } = await import("./route");

    const res = HEAD(makeRequest("HEAD"));

    expect(res.status).toBe(307);
    expect(res.headers.get("location")).toBe("https://hideaway.test/");
  });
});
