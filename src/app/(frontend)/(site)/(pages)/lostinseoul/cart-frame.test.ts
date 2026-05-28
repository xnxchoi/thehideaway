import { describe, expect, it } from "vitest";
import {
  getLostBagChromeTransition,
  getLostBagAnnouncementChromeState,
  getLostBagAnnouncementChromeTransition,
  getLostBagFallbackFrameMetrics,
  getLostBagFixedDocumentMinHeight,
  getLostBagFrameMetrics,
  getLostBagLockScrollY,
  getLostBagOverlayApertureState,
  getLostBagOverlayChromeState,
  getLostBagOverlayChromeTransition,
  getLostBagOverlayPanelState,
  getLostBagRegularChromeState,
  getLostBagRootMotionTarget,
  getLostBagSurfaceTransition,
  LOST_BAG_CLOSING_ROOT_Z_INDEX,
  LOST_BAG_CHROME_CLOSE_DELAY_MS,
  LOST_BAG_CHROME_MS,
  LOST_BAG_SURFACE_Z_INDEX,
  LOST_BAG_TIMELINE_MS,
  lostBagRootRestTarget,
  lostBagPower2InOut,
  lostBagSourceChoreography,
  shouldSyncLostBagFrame,
  shouldPreserveLostBagClosingCleanup,
  toLostBagFrameStyleVars
} from "./cart-frame";

describe("lostinseoul cart frame geometry", () => {
  it("keeps the source desktop cart timeline duration", () => {
    expect(LOST_BAG_TIMELINE_MS).toBe(1100);
  });

  it("ports GSAP power2.inOut as a Motion easing function", () => {
    expect(lostBagPower2InOut(0)).toBe(0);
    expect(lostBagPower2InOut(0.25)).toBe(0.125);
    expect(lostBagPower2InOut(0.5)).toBe(0.5);
    expect(lostBagPower2InOut(0.75)).toBe(0.875);
    expect(lostBagPower2InOut(1)).toBe(1);
  });

  it("matches the source header/banner fade timing on cart open and close", () => {
    expect(LOST_BAG_CHROME_MS).toBe(200);
    expect(LOST_BAG_CHROME_CLOSE_DELAY_MS).toBe(600);
    expect(lostBagSourceChoreography.desktop.regularChrome.cartOpen).toEqual({
      at: 0,
      duration: 0.2,
      opacity: 0,
      y: "-100%"
    });
    expect(lostBagSourceChoreography.desktop.regularChrome.cartClosed).toEqual({
      at: 0.6,
      duration: 0.2,
      opacity: 1,
      y: "0%"
    });
    expect(getLostBagChromeTransition(true)).toEqual({
      delay: 0,
      duration: 0.2,
      ease: lostBagPower2InOut
    });
    expect(getLostBagChromeTransition(false)).toEqual({
      delay: 0.6,
      duration: 0.2,
      ease: lostBagPower2InOut
    });
  });

  it("maps the regular header wipe opposite to the bag overlay chrome", () => {
    expect(getLostBagRegularChromeState(true)).toEqual({
      opacity: 0,
      y: "-100%"
    });
    expect(getLostBagRegularChromeState(false)).toEqual({
      opacity: 1,
      y: "0%"
    });
  });

  it("keeps the announcement banner synchronized with the regular header wipe", () => {
    expect(getLostBagAnnouncementChromeState(true)).toEqual(
      getLostBagRegularChromeState(true)
    );
    expect(getLostBagAnnouncementChromeState(false)).toEqual(
      getLostBagRegularChromeState(false)
    );
  });

  it("defers the announcement banner return until the cart frame is nearly restored", () => {
    expect(getLostBagAnnouncementChromeTransition(true)).toEqual(
      getLostBagChromeTransition(true)
    );
    expect(getLostBagAnnouncementChromeTransition(false)).toEqual({
      delay: 0.9,
      duration: 0.2,
      ease: lostBagPower2InOut
    });
  });

  it("keeps the cart surface exit on the source close timeline", () => {
    expect(getLostBagSurfaceTransition(true)).toEqual({
      duration: 0,
      ease: lostBagPower2InOut
    });
    expect(getLostBagSurfaceTransition(false)).toEqual({
      duration: 1.1,
      ease: lostBagPower2InOut
    });
  });

  it("lets the returning frame wipe the cart surface during close", () => {
    expect(LOST_BAG_CLOSING_ROOT_Z_INDEX).toBeGreaterThan(
      LOST_BAG_SURFACE_Z_INDEX
    );
  });

  it("maps the source bag header/footer vertical chrome motion", () => {
    expect(getLostBagOverlayChromeTransition()).toEqual({
      duration: 1.1,
      ease: lostBagPower2InOut
    });
    expect(getLostBagOverlayChromeState(true)).toEqual({
      opacity: 1,
      y: 0
    });
    expect(getLostBagOverlayChromeState(false)).toEqual({
      opacity: 0,
      y: "100%"
    });
  });

  it("maps the source bag item/panel horizontal motion", () => {
    expect(getLostBagOverlayPanelState(true)).toEqual({
      opacity: 1,
      x: 0
    });
    expect(getLostBagOverlayPanelState(false)).toEqual({
      opacity: 0,
      x: "100%"
    });
  });

  it("moves the aperture frame edges with the source panel exit", () => {
    expect(getLostBagOverlayApertureState(true)).toEqual({
      opacity: 1,
      x: 0
    });
    expect(getLostBagOverlayApertureState(false)).toEqual({
      opacity: 0,
      x: "100%"
    });
  });

  it("maps the aperture rect into viewport-relative frame metrics", () => {
    expect(
      getLostBagFrameMetrics({
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
    const metrics = getLostBagFallbackFrameMetrics({
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
      getLostBagFrameMetrics({
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
      toLostBagFrameStyleVars({
        bottom: 210,
        height: 600,
        left: 42,
        right: 358,
        scale: 2 / 3,
        top: 90,
        width: 800
      })
    ).toEqual({
      "--lost-bag-frame-bottom": "210px",
      "--lost-bag-frame-height": "600px",
      "--lost-bag-frame-right": "358px",
      "--lost-bag-frame-scale": "0.6666666666666666",
      "--lost-bag-frame-width": "800px",
      "--lost-bag-frame-x": "42px",
      "--lost-bag-frame-y": "90px"
    });
  });

  it("does not retarget opening geometry after the transform starts", () => {
    expect(shouldSyncLostBagFrame("preopen", "opening")).toBe(true);
    expect(shouldSyncLostBagFrame("open", "opening")).toBe(false);
    expect(shouldSyncLostBagFrame("closing", "opening")).toBe(false);
  });

  it("lets the close timer own cleanup while the closing timeline is active", () => {
    expect(shouldPreserveLostBagClosingCleanup("closing", true)).toBe(true);
    expect(shouldPreserveLostBagClosingCleanup("closing", false)).toBe(false);
    expect(shouldPreserveLostBagClosingCleanup("open", true)).toBe(false);
    expect(shouldPreserveLostBagClosingCleanup("idle", true)).toBe(false);
  });

  it("still permits viewport resize sync while the cart is open", () => {
    expect(shouldSyncLostBagFrame("open", "resize")).toBe(true);
    expect(shouldSyncLostBagFrame("idle", "resize")).toBe(false);
  });

  it("creates a numeric Motion target for the root frame transform", () => {
    expect(
      getLostBagRootMotionTarget({
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
    expect(lostBagRootRestTarget).toEqual({
      filter: "none",
      scale: 1,
      x: 0,
      y: 0
    });
  });

  it("prefers Lenis actual scroll when freezing the cart frame", () => {
    expect(
      getLostBagLockScrollY(
        {
          actualScroll: 240,
          scroll: 480
        },
        120
      )
    ).toBe(240);
  });

  it("falls back through Lenis scroll and native scroll for the lock frame", () => {
    expect(getLostBagLockScrollY({ scroll: 360 }, 120)).toBe(360);
    expect(getLostBagLockScrollY(null, 120)).toBe(120);
  });

  it("keeps enough document height to preserve scroll while the root is fixed", () => {
    expect(
      getLostBagFixedDocumentMinHeight({
        rootScrollHeight: 1800,
        scrollY: 1200,
        viewportHeight: 900
      })
    ).toBe(2100);
    expect(
      getLostBagFixedDocumentMinHeight({
        rootScrollHeight: 2400,
        scrollY: 1200,
        viewportHeight: 900
      })
    ).toBe(2400);
  });
});
