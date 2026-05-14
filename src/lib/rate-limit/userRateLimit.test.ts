import { afterEach, describe, expect, it } from "vitest";
import { __resetUserRateLimit, userRateLimit } from "./userRateLimit";

afterEach(() => {
  __resetUserRateLimit();
});

describe("userRateLimit", () => {
  it("allows the first call for a (bucket, user)", () => {
    const r = userRateLimit("b", "u1", 1000, 0);
    expect(r.allowed).toBe(true);
    expect(r.retryAfterMs).toBe(0);
  });

  it("denies a second call within the window and reports retry-after", () => {
    userRateLimit("b", "u1", 1000, 0);
    const r = userRateLimit("b", "u1", 1000, 250);
    expect(r.allowed).toBe(false);
    expect(r.retryAfterMs).toBe(750);
  });

  it("allows after the window elapses", () => {
    userRateLimit("b", "u1", 1000, 0);
    const r = userRateLimit("b", "u1", 1000, 1001);
    expect(r.allowed).toBe(true);
  });

  it("isolates buckets", () => {
    userRateLimit("a", "u1", 1000, 0);
    const r = userRateLimit("b", "u1", 1000, 100);
    expect(r.allowed).toBe(true);
  });

  it("isolates users within the same bucket", () => {
    userRateLimit("b", "u1", 1000, 0);
    const r = userRateLimit("b", "u2", 1000, 100);
    expect(r.allowed).toBe(true);
  });

  it("does not advance the window on denied probes (no sliding flood)", () => {
    userRateLimit("b", "u1", 1000, 0);
    userRateLimit("b", "u1", 1000, 500); // denied — but window must still anchor at 0
    userRateLimit("b", "u1", 1000, 900); // denied
    const r = userRateLimit("b", "u1", 1000, 1001); // allowed (1001 - 0 >= 1000)
    expect(r.allowed).toBe(true);
  });
});
