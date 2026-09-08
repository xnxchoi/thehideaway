import { describe, expect, it, vi } from "vitest";
import { initializeLostFooterShader } from "./footer-wordmark-lifecycle";

describe("LOST footer shader initialization", () => {
  it("signals ready only after fonts and the initial render succeed", async () => {
    const onFailure = vi.fn();
    const onReady = vi.fn();

    await initializeLostFooterShader({
      fontsReady: Promise.resolve(),
      initialize: () => true,
      isDisposed: () => false,
      onFailure,
      onReady
    });

    expect(onReady).toHaveBeenCalledOnce();
    expect(onFailure).not.toHaveBeenCalled();
  });

  it("never signals ready when the initial render fails", async () => {
    const onFailure = vi.fn();
    const onReady = vi.fn();

    await initializeLostFooterShader({
      fontsReady: Promise.resolve(),
      initialize: () => false,
      isDisposed: () => false,
      onFailure,
      onReady
    });

    expect(onFailure).toHaveBeenCalledOnce();
    expect(onReady).not.toHaveBeenCalled();
  });

  it("routes font readiness rejection to the fallback", async () => {
    const onFailure = vi.fn();
    const onReady = vi.fn();

    await initializeLostFooterShader({
      fontsReady: Promise.reject(new Error("font load failed")),
      initialize: () => true,
      isDisposed: () => false,
      onFailure,
      onReady
    });

    expect(onFailure).toHaveBeenCalledOnce();
    expect(onReady).not.toHaveBeenCalled();
  });

  it("does nothing after disposal", async () => {
    const onFailure = vi.fn();
    const onReady = vi.fn();

    await initializeLostFooterShader({
      fontsReady: Promise.resolve(),
      initialize: () => true,
      isDisposed: () => true,
      onFailure,
      onReady
    });

    expect(onFailure).not.toHaveBeenCalled();
    expect(onReady).not.toHaveBeenCalled();
  });
});
