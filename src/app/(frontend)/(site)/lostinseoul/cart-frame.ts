type LostBagFrameRect = {
  bottom: number;
  left: number;
  right: number;
  top: number;
  width: number;
};

type LostBagFrameViewport = {
  height: number;
  width: number;
};

export type LostBagFrameSyncReason = "opening" | "resize";

export type LostBagFrameMetrics = {
  bottom: number;
  height: number;
  left: number;
  right: number;
  scale: number;
  top: number;
  width: number;
};

export type LostBagRootMotionTarget = {
  filter: string;
  scale: number;
  x: number;
  y: number;
};

export const LOST_BAG_TIMELINE_MS = 1100;
export const LOST_BAG_CHROME_MS = 200;
export const LOST_BAG_CHROME_CLOSE_DELAY_MS = 600;
export const LOST_BAG_ANNOUNCEMENT_CLOSE_DELAY_MS =
  LOST_BAG_TIMELINE_MS - LOST_BAG_CHROME_MS;
export const LOST_BAG_SURFACE_Z_INDEX = 1200;
export const LOST_BAG_CLOSING_ROOT_Z_INDEX = LOST_BAG_SURFACE_Z_INDEX + 1;

type LostBagLenisScrollSource = {
  actualScroll?: number;
  scroll?: number;
};

export const lostBagRootRestTarget: LostBagRootMotionTarget = {
  filter: "none",
  scale: 1,
  x: 0,
  y: 0
};

export function lostBagPower2InOut(progress: number) {
  if (progress <= 0) return 0;
  if (progress >= 1) return 1;

  return progress < 0.5
    ? 2 * progress * progress
    : 1 - Math.pow(-2 * progress + 2, 2) / 2;
}

export const lostBagSourceChoreography = {
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
        at: LOST_BAG_CHROME_CLOSE_DELAY_MS / 1000,
        duration: LOST_BAG_CHROME_MS / 1000,
        opacity: 1,
        y: "0%"
      },
      cartOpen: {
        at: 0,
        duration: LOST_BAG_CHROME_MS / 1000,
        opacity: 0,
        y: "-100%"
      }
    },
    timeline: {
      duration: LOST_BAG_TIMELINE_MS / 1000,
      ease: lostBagPower2InOut
    }
  }
} as const;

export function getLostBagChromeTransition(bagOpen: boolean) {
  const chrome = bagOpen
    ? lostBagSourceChoreography.desktop.regularChrome.cartOpen
    : lostBagSourceChoreography.desktop.regularChrome.cartClosed;

  return {
    delay: chrome.at,
    duration: chrome.duration,
    ease: lostBagSourceChoreography.desktop.timeline.ease
  };
}

export function getLostBagRegularChromeState(bagOpen: boolean) {
  const chrome = bagOpen
    ? lostBagSourceChoreography.desktop.regularChrome.cartOpen
    : lostBagSourceChoreography.desktop.regularChrome.cartClosed;

  return {
    opacity: chrome.opacity,
    y: chrome.y
  };
}

export function getLostBagAnnouncementChromeState(bagOpen: boolean) {
  return getLostBagRegularChromeState(bagOpen);
}

export function getLostBagAnnouncementChromeTransition(bagOpen: boolean) {
  if (bagOpen) return getLostBagChromeTransition(true);

  return {
    delay: LOST_BAG_ANNOUNCEMENT_CLOSE_DELAY_MS / 1000,
    duration: LOST_BAG_CHROME_MS / 1000,
    ease: lostBagSourceChoreography.desktop.timeline.ease
  };
}

export function getLostBagSurfaceTransition(open: boolean) {
  return {
    duration: open ? 0 : lostBagSourceChoreography.desktop.timeline.duration,
    ease: lostBagSourceChoreography.desktop.timeline.ease
  };
}

export function getLostBagOverlayChromeTransition() {
  return {
    duration: lostBagSourceChoreography.desktop.timeline.duration,
    ease: lostBagSourceChoreography.desktop.timeline.ease
  };
}

export function getLostBagOverlayChromeState(open: boolean) {
  return open
    ? lostBagSourceChoreography.desktop.overlayChrome.open
    : lostBagSourceChoreography.desktop.overlayChrome.close;
}

export function getLostBagOverlayPanelState(open: boolean) {
  return open
    ? lostBagSourceChoreography.desktop.overlayPanel.open
    : lostBagSourceChoreography.desktop.overlayPanel.close;
}

export function getLostBagOverlayApertureState(open: boolean) {
  return getLostBagOverlayPanelState(open);
}

export function getLostBagFrameMetrics({
  rect,
  viewport
}: {
  rect: LostBagFrameRect;
  viewport: LostBagFrameViewport;
}): LostBagFrameMetrics | null {
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

export function getLostBagFallbackFrameMetrics(
  viewport: LostBagFrameViewport
): LostBagFrameMetrics {
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

export function toLostBagFrameStyleVars(
  metrics: LostBagFrameMetrics
): Record<string, string> {
  return {
    "--lost-bag-frame-bottom": `${metrics.bottom}px`,
    "--lost-bag-frame-height": `${metrics.height}px`,
    "--lost-bag-frame-right": `${metrics.right}px`,
    "--lost-bag-frame-scale": metrics.scale.toString(),
    "--lost-bag-frame-width": `${metrics.width}px`,
    "--lost-bag-frame-x": `${metrics.left}px`,
    "--lost-bag-frame-y": `${metrics.top}px`
  };
}

export function shouldSyncLostBagFrame(
  state: string | undefined,
  reason: LostBagFrameSyncReason
) {
  if (state === "preopen") return true;
  return reason === "resize" && state === "open";
}

export function shouldPreserveLostBagClosingCleanup(
  state: string | undefined,
  closeTimerActive: boolean
) {
  return state === "closing" && closeTimerActive;
}

export function runLostBagCloseCleanup({
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

export function getLostBagRootMotionTarget(
  metrics: LostBagFrameMetrics
): LostBagRootMotionTarget {
  return {
    filter: "brightness(0.8) contrast(1.08)",
    scale: metrics.scale,
    x: metrics.left,
    y: metrics.top
  };
}

export function getLostBagLockScrollY(
  lenis: LostBagLenisScrollSource | null | undefined,
  nativeScrollY: number
) {
  const scrollY = lenis?.actualScroll ?? lenis?.scroll ?? nativeScrollY;
  return Number.isFinite(scrollY) ? scrollY : 0;
}

export function getLostBagFixedDocumentMinHeight({
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
