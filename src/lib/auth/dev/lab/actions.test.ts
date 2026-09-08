import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/payload", () => ({
  getPayload: vi.fn()
}));

vi.mock("next/headers", () => ({
  headers: vi.fn(async () => new Headers())
}));

describe("runAuthLabAction", () => {
  const originalEnv = process.env.NODE_ENV;
  const originalPassword = process.env.DEV_BUTLER_PASSWORD;

  afterEach(() => {
    process.env.NODE_ENV = originalEnv;
    process.env.DEV_BUTLER_PASSWORD = originalPassword;
    vi.resetModules();
  });

  it("refuses to run in production", async () => {
    process.env.NODE_ENV = "production";
    process.env.DEV_BUTLER_PASSWORD = "hideaway-dev-2026";
    const { runAuthLabAction } = await import("./actions");
    await expect(runAuthLabAction("signInButler")).rejects.toThrow(
      /disabled in production/i
    );
  });

  it("refuses to run without DEV_BUTLER_PASSWORD", async () => {
    process.env.NODE_ENV = "development";
    delete process.env.DEV_BUTLER_PASSWORD;
    const { runAuthLabAction } = await import("./actions");
    await expect(runAuthLabAction("signInButler")).rejects.toThrow(
      /DEV_BUTLER_PASSWORD/i
    );
  });

  it("rejects unknown actions", async () => {
    process.env.NODE_ENV = "development";
    process.env.DEV_BUTLER_PASSWORD = "hideaway-dev-2026";
    const { runAuthLabAction } = await import("./actions");
    await expect(
      runAuthLabAction("not-a-real-action" as never)
    ).resolves.toMatchObject({
      ok: false,
      error: expect.stringMatching(/unknown/i)
    });
  });
});
