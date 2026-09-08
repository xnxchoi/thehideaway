type CartFrameRect = {
  bottom: number;
  left: number;
  right: number;
  top: number;
  width: number;
};

type CartFrameViewport = {
  height: number;
  width: number;
};

export type CartFrameSyncReason = "opening" | "resize";

export type CartFrameMetrics = {
  bottom: number;
  height: number;
  left: number;
  right: number;
  scale: number;
  top: number;
  width: number;
};

export type CartRootMotionTarget = {
  filter: string;
  scale: number;
  x: number;
  y: number;
};

export const CART_TIMELINE_MS = 1100;
export const CART_CHROME_MS = 200;
export const CART_CHROME_CLOSE_DELAY_MS = 600;
export const CART_ANNOUNCEMENT_CLOSE_DELAY_MS =
  CART_TIMELINE_MS - CART_CHROME_MS;
export const CART_SURFACE_Z_INDEX = 1200;
export const CART_CLOSING_ROOT_Z_INDEX = CART_SURFACE_Z_INDEX + 1;

type CartLenisScrollSource = {
  actualScroll?: number;
  scroll?: number;
};

export const cartRootRestTarget: CartRootMotionTarget = {
  filter: "none",
  scale: 1,
  x: 0,
  y: 0
};

export function cartPower2InOut(progress: number) {
  if (progress <= 0) return 0;
  if (progress >= 1) return 1;

  return progress < 0.5
    ? 2 * progress * progress
    : 1 - Math.pow(-2 * progress + 2, 2) / 2;
}

export const cartSourceChoreography = {
  desktop: {
    overlayChrome: {
      close: {
        opacity: 0,
        y: "100%"
      },
      open: {
        opacity: 1,
        y: 0
      }
    },
    overlayPanel: {
      close: {
        opacity: 0,
        x: "100%"
      },
      open: {
        opacity: 1,
        x: 0
      }
    },
    regularChrome: {
      cartClosed: {
        at: CART_CHROME_CLOSE_DELAY_MS / 1000,
        duration: CART_CHROME_MS / 1000,
        opacity: 1,
        y: "0%"
      },
      cartOpen: {
        at: 0,
        duration: CART_CHROME_MS / 1000,
        opacity: 0,
        y: "-100%"
      }
    },
    timeline: {
      duration: CART_TIMELINE_MS / 1000,
      ease: cartPower2InOut
    }
  }
} as const;

export function getCartChromeTransition(cartOpen: boolean) {
  const chrome = cartOpen
    ? cartSourceChoreography.desktop.regularChrome.cartOpen
    : cartSourceChoreography.desktop.regularChrome.cartClosed;

  return {
    delay: chrome.at,
    duration: chrome.duration,
    ease: cartSourceChoreography.desktop.timeline.ease
  };
}

export function getCartChromeState(cartOpen: boolean) {
  return { opacity: cartOpen ? 0 : 1, y: cartOpen ? "-100%" : "0%" };
}

export function getCartAnnouncementChromeState(cartOpen: boolean) {
  return { opacity: cartOpen ? 0 : 1, y: cartOpen ? "-100%" : "0%" };
}

export function getCartAnnouncementChromeTransition(cartOpen: boolean) {
  if (cartOpen) return getCartChromeTransition(true);

  return {
    delay: CART_ANNOUNCEMENT_CLOSE_DELAY_MS / 1000,
    duration: CART_CHROME_MS / 1000,
    ease: cartSourceChoreography.desktop.timeline.ease
  };
}

export function getCartSurfaceTransition(open: boolean) {
  return {
    duration: open ? 0 : cartSourceChoreography.desktop.timeline.duration,
    ease: cartSourceChoreography.desktop.timeline.ease
  };
}

export function getCartOverlayChromeTransition() {
  return {
    duration: cartSourceChoreography.desktop.timeline.duration,
    ease: cartSourceChoreography.desktop.timeline.ease
  };
}

export function getCartOverlayChromeState(open: boolean) {
  return open
    ? cartSourceChoreography.desktop.overlayChrome.open
    : cartSourceChoreography.desktop.overlayChrome.close;
}

export function getCartOverlayPanelState(open: boolean) {
  return open
    ? cartSourceChoreography.desktop.overlayPanel.open
    : cartSourceChoreography.desktop.overlayPanel.close;
}

export function getCartOverlayApertureState(open: boolean) {
  return getCartOverlayPanelState(open);
}

export function getCartFrameMetrics({
  rect,
  viewport
}: {
  rect: CartFrameRect;
  viewport: CartFrameViewport;
}): CartFrameMetrics | null {
  if (rect.width <= 0 || viewport.width <= 0) return null;

  const scale = rect.width / viewport.width;
  const height = viewport.height * scale;

  return {
    bottom: viewport.height - rect.top - height,
    height,
    left: rect.left,
    right: viewport.width - rect.right,
    scale,
    top: rect.top,
    width: rect.width
  };
}

export function getCartFallbackFrameMetrics(
  viewport: CartFrameViewport
): CartFrameMetrics {
  const isMobile = viewport.width <= 767;
  const scale = isMobile ? 0.92 : 0.62;
  const left = viewport.width * (isMobile ? 0.04 : 0.035);
  const top = viewport.height * (isMobile ? 0.17 : 0.15);
  const width = viewport.width * scale;
  const height = viewport.height * scale;

  return {
    bottom: viewport.height - top - height,
    height,
    left,
    right: viewport.width - left - width,
    scale,
    top,
    width
  };
}

export function toCartFrameStyleVars(
  metrics: CartFrameMetrics
): Record<string, string> {
  return {
    "--lost-cart-frame-bottom": `${metrics.bottom}px`,
    "--lost-cart-frame-height": `${metrics.height}px`,
    "--lost-cart-frame-right": `${metrics.right}px`,
    "--lost-cart-frame-scale": metrics.scale.toString(),
    "--lost-cart-frame-width": `${metrics.width}px`,
    "--lost-cart-frame-x": `${metrics.left}px`,
    "--lost-cart-frame-y": `${metrics.top}px`
  };
}

export function shouldSyncCartFrame(
  state: string | undefined,
  reason: CartFrameSyncReason
) {
  if (state === "preopen") return true;
  return reason === "resize" && state === "open";
}

export function shouldPreserveCartClosingCleanup(
  state: string | undefined,
  closeTimerActive: boolean
) {
  return state === "closing" && closeTimerActive;
}

export function runCartCloseCleanup({
  clearRootStyles,
  releaseFixedFrame,
  restoreDocumentHeight,
  restoreScrollContainer,
  restoreScrollPosition,
  resumeSmoothScroll
}: {
  clearRootStyles: () => void;
  releaseFixedFrame: () => void;
  restoreDocumentHeight: () => void;
  restoreScrollContainer: () => void;
  restoreScrollPosition: () => void;
  resumeSmoothScroll: () => void;
}) {
  restoreScrollContainer();
  restoreScrollPosition();
  releaseFixedFrame();
  restoreDocumentHeight();
  clearRootStyles();
  resumeSmoothScroll();
}

export function getCartRootMotionTarget(
  metrics: CartFrameMetrics
): CartRootMotionTarget {
  return {
    filter: "brightness(0.8) contrast(1.08)",
    scale: metrics.scale,
    x: metrics.left,
    y: metrics.top
  };
}

export function getCartLockScrollY(
  lenis: CartLenisScrollSource | null | undefined,
  nativeScrollY: number
) {
  const scrollY = lenis?.actualScroll ?? lenis?.scroll ?? nativeScrollY;
  return Number.isFinite(scrollY) ? scrollY : 0;
}

export function getCartFixedDocumentMinHeight({
  rootScrollHeight,
  scrollY,
  viewportHeight
}: {
  rootScrollHeight: number;
  scrollY: number;
  viewportHeight: number;
}) {
  return Math.max(rootScrollHeight, scrollY + viewportHeight);
}
