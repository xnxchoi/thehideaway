import { describe, expect, it } from "vitest";
import {
  getCartChromeTransition,
  getCartAnnouncementChromeState,
  getCartAnnouncementChromeTransition,
  getCartFallbackFrameMetrics,
  getCartFixedDocumentMinHeight,
  getCartFrameMetrics,
  getCartLockScrollY,
  getCartOverlayApertureState,
  getCartOverlayChromeState,
  getCartOverlayChromeTransition,
  getCartOverlayPanelState,
  getCartChromeState,
  getCartRootMotionTarget,
  getCartSurfaceTransition,
  CART_CLOSING_ROOT_Z_INDEX,
  CART_CHROME_CLOSE_DELAY_MS,
  CART_CHROME_MS,
  CART_SURFACE_Z_INDEX,
  CART_TIMELINE_MS,
  cartRootRestTarget,
  cartPower2InOut,
  cartSourceChoreography,
  runCartCloseCleanup,
  shouldSyncCartFrame,
  shouldPreserveCartClosingCleanup,
  toCartFrameStyleVars
} from "./cart-frame";

describe("lostinseoul cart frame geometry", () => {
  it("keeps the source desktop cart timeline duration", () => {
    expect(CART_TIMELINE_MS).toBe(1100);
  });

  it("ports GSAP power2.inOut as a Motion easing function", () => {
    expect(cartPower2InOut(0)).toBe(0);
    expect(cartPower2InOut(0.25)).toBe(0.125);
    expect(cartPower2InOut(0.5)).toBe(0.5);
    expect(cartPower2InOut(0.75)).toBe(0.875);
    expect(cartPower2InOut(1)).toBe(1);
  });

  it("matches the source header/banner fade timing on cart open and close", () => {
    expect(CART_CHROME_MS).toBe(200);
    expect(CART_CHROME_CLOSE_DELAY_MS).toBe(600);
    expect(cartSourceChoreography.desktop.regularChrome.cartOpen).toEqual({
      at: 0,
      duration: 0.2,
      opacity: 0,
      y: "-100%"
    });
    expect(cartSourceChoreography.desktop.regularChrome.cartClosed).toEqual({
      at: 0.6,
      duration: 0.2,
      opacity: 1,
      y: "0%"
    });
    expect(getCartChromeTransition(true)).toEqual({
      delay: 0,
      duration: 0.2,
      ease: cartPower2InOut
    });
    expect(getCartChromeTransition(false)).toEqual({
      delay: 0.6,
      duration: 0.2,
      ease: cartPower2InOut
    });
  });

  it("maps the regular header wipe opposite to the bag overlay chrome", () => {
    expect(getCartChromeState(true)).toEqual({
      opacity: 0,
      y: "-100%"
    });
    expect(getCartChromeState(false)).toEqual({
      opacity: 1,
      y: "0%"
    });
  });

  it("keeps the announcement banner synchronized with the regular header wipe", () => {
    expect(getCartAnnouncementChromeState(true)).toEqual(
      getCartChromeState(true)
    );
    expect(getCartAnnouncementChromeState(false)).toEqual(
      getCartChromeState(false)
    );
  });

  it("defers the announcement banner return until the cart frame is nearly restored", () => {
    expect(getCartAnnouncementChromeTransition(true)).toEqual(
      getCartChromeTransition(true)
    );
    expect(getCartAnnouncementChromeTransition(false)).toEqual({
      delay: 0.9,
      duration: 0.2,
      ease: cartPower2InOut
    });
  });

  it("keeps the cart surface exit on the source close timeline", () => {
    expect(getCartSurfaceTransition(true)).toEqual({
      duration: 0,
      ease: cartPower2InOut
    });
    expect(getCartSurfaceTransition(false)).toEqual({
      duration: 1.1,
      ease: cartPower2InOut
    });
  });

  it("lets the returning frame wipe the cart surface during close", () => {
    expect(CART_CLOSING_ROOT_Z_INDEX).toBeGreaterThan(CART_SURFACE_Z_INDEX);
  });

  it("maps the source bag header/footer vertical chrome motion", () => {
    expect(getCartOverlayChromeTransition()).toEqual({
      duration: 1.1,
      ease: cartPower2InOut
    });
    expect(getCartOverlayChromeState(true)).toEqual({
      opacity: 1,
      y: 0
    });
    expect(getCartOverlayChromeState(false)).toEqual({
      opacity: 0,
      y: "100%"
    });
  });

  it("maps the source bag item/panel horizontal motion", () => {
    expect(getCartOverlayPanelState(true)).toEqual({
      opacity: 1,
      x: 0
    });
    expect(getCartOverlayPanelState(false)).toEqual({
      opacity: 0,
      x: "100%"
    });
  });

  it("moves the aperture frame edges with the source panel exit", () => {
    expect(getCartOverlayApertureState(true)).toEqual({
      opacity: 1,
      x: 0
    });
    expect(getCartOverlayApertureState(false)).toEqual({
      opacity: 0,
      x: "100%"
    });
  });

  it("maps the aperture rect into viewport-relative frame metrics", () => {
    expect(
      getCartFrameMetrics({
        rect: {
          bottom: 690,
          left: 42,
          right: 842,
          top: 90,
          width: 800
        },
        viewport: {
          height: 900,
          width: 1200
        }
      })
    ).toEqual({
      bottom: 210,
      height: 600,
      left: 42,
      right: 358,
      scale: 2 / 3,
      top: 90,
      width: 800
    });
  });

  it("creates fallback mobile frame metrics when the aperture is hidden", () => {
    const metrics = getCartFallbackFrameMetrics({
      height: 844,
      width: 390
    });

    expect(metrics).toMatchObject({
      scale: 0.92,
      width: 358.8
    });
    expect(metrics.bottom).toBeCloseTo(-75.96);
    expect(metrics.height).toBeCloseTo(776.48);
    expect(metrics.left).toBeCloseTo(15.6);
    expect(metrics.right).toBeCloseTo(15.6);
    expect(metrics.top).toBeCloseTo(143.48);
  });

  it("guards collapsed apertures before mutating CSS variables", () => {
    expect(
      getCartFrameMetrics({
        rect: {
          bottom: 90,
          left: 42,
          right: 42,
          top: 90,
          width: 0
        },
        viewport: {
          height: 900,
          width: 1200
        }
      })
    ).toBeNull();
  });

  it("serializes metrics into the exact root CSS variable contract", () => {
    expect(
      toCartFrameStyleVars({
        bottom: 210,
        height: 600,
        left: 42,
        right: 358,
        scale: 2 / 3,
        top: 90,
        width: 800
      })
    ).toEqual({
      "--lost-cart-frame-bottom": "210px",
      "--lost-cart-frame-height": "600px",
      "--lost-cart-frame-right": "358px",
      "--lost-cart-frame-scale": "0.6666666666666666",
      "--lost-cart-frame-width": "800px",
      "--lost-cart-frame-x": "42px",
      "--lost-cart-frame-y": "90px"
    });
  });

  it("does not retarget opening geometry after the transform starts", () => {
    expect(shouldSyncCartFrame("preopen", "opening")).toBe(true);
    expect(shouldSyncCartFrame("open", "opening")).toBe(false);
    expect(shouldSyncCartFrame("closing", "opening")).toBe(false);
  });

  it("lets the close timer own cleanup while the closing timeline is active", () => {
    expect(shouldPreserveCartClosingCleanup("closing", true)).toBe(true);
    expect(shouldPreserveCartClosingCleanup("closing", false)).toBe(false);
    expect(shouldPreserveCartClosingCleanup("open", true)).toBe(false);
    expect(shouldPreserveCartClosingCleanup("idle", true)).toBe(false);
  });

  it("restores scroll before releasing the fixed cart frame", () => {
    const calls: string[] = [];

    runCartCloseCleanup({
      clearRootStyles: () => calls.push("clear-root"),
      releaseFixedFrame: () => calls.push("release-frame"),
      restoreDocumentHeight: () => calls.push("restore-height"),
      restoreScrollContainer: () => calls.push("restore-overflow"),
      restoreScrollPosition: () => calls.push("restore-scroll"),
      resumeSmoothScroll: () => calls.push("resume-scroll")
    });

    expect(calls).toEqual([
      "restore-overflow",
      "restore-scroll",
      "release-frame",
      "restore-height",
      "clear-root",
      "resume-scroll"
    ]);
  });

  it("still permits viewport resize sync while the cart is open", () => {
    expect(shouldSyncCartFrame("open", "resize")).toBe(true);
    expect(shouldSyncCartFrame("idle", "resize")).toBe(false);
  });

  it("creates a numeric Motion target for the root frame transform", () => {
    expect(
      getCartRootMotionTarget({
        bottom: 210,
        height: 600,
        left: 42,
        right: 358,
        scale: 2 / 3,
        top: 90,
        width: 800
      })
    ).toEqual({
      filter: "brightness(0.8) contrast(1.08)",
      scale: 2 / 3,
      x: 42,
      y: 90
    });
  });

  it("exposes a stable Motion rest target for close/reset", () => {
    expect(cartRootRestTarget).toEqual({
      filter: "none",
      scale: 1,
      x: 0,
      y: 0
    });
  });

  it("prefers Lenis actual scroll when freezing the cart frame", () => {
    expect(
      getCartLockScrollY(
        {
          actualScroll: 240,
          scroll: 480
        },
        120
      )
    ).toBe(240);
  });

  it("falls back through Lenis scroll and native scroll for the lock frame", () => {
    expect(getCartLockScrollY({ scroll: 360 }, 120)).toBe(360);
    expect(getCartLockScrollY(null, 120)).toBe(120);
  });

  it("keeps enough document height to preserve scroll while the root is fixed", () => {
    expect(
      getCartFixedDocumentMinHeight({
        rootScrollHeight: 1800,
        scrollY: 1200,
        viewportHeight: 900
      })
    ).toBe(2100);
    expect(
      getCartFixedDocumentMinHeight({
        rootScrollHeight: 2400,
        scrollY: 1200,
        viewportHeight: 900
      })
    ).toBe(2400);
  });
});
