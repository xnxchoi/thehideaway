"use client";

import { useEffect, useRef, type RefObject } from "react";
import {
  DPR_CAP,
  HATCHES_PER_VIEWPORT_WIDTH,
  LANE_CONFIGS,
  MAJOR_TICK_EVERY,
  MAJOR_TICK_WIDTH_PX,
  MINOR_TICK_VERTICAL_INSET,
  MINOR_TICK_WIDTH_PX,
  MOBILE_LANE_IDS,
  ROW_GAP_PX,
  ROW_GAP_XL_PX,
  type LaneConfig
} from "./lane-config";
import type { EngineState } from "./useTickerEngine";

interface TickerCanvasProps {
  engineRef: RefObject<EngineState>;
  /** When true, renders a frozen phase-0 figure exactly once and never animates. */
  frozen: boolean;
  className?: string;
}

/**
 * Single canvas rendering all five hatch lanes. One rAF reads the engine ref
 * each frame; never per-lane rAF. Color resolves from `--foreground` via
 * getComputedStyle, cached and refreshed only when the theme attribute changes.
 *
 * Mobile (<sm) renders only the center 3 lanes via `MOBILE_LANE_IDS`. We detect
 * via `matchMedia('(min-width: 640px)')` so SSR is safe.
 */
export function TickerCanvas({
  engineRef,
  frozen,
  className
}: TickerCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const ctxRef = useRef<CanvasRenderingContext2D | null>(null);
  const dprRef = useRef<number>(1);
  const sizeRef = useRef<{ w: number; h: number }>({ w: 0, h: 0 });
  const colorRef = useRef<string>("#000");
  const isDesktopRef = useRef<boolean>(true);
  const xlGapRef = useRef<boolean>(false);

  // Resolve --foreground to a fully-substituted color string. Custom-property
  // chains (--foreground -> --fg -> --white -> oklch(...)) are not always
  // resolved by getPropertyValue() across browsers, so we read the computed
  // `color` of the canvas element itself which always returns a final color.
  function resolveForegroundColor(): string {
    const canvas = canvasRef.current;
    if (!canvas || typeof window === "undefined") return "#000";
    const c = getComputedStyle(canvas).color;
    return c || "#000";
  }

  // ---- Setup canvas at correct DPR. Re-runs on resize and DPR change.
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const setupCanvas = () => {
      const rect = canvas.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, DPR_CAP);
      canvas.width = Math.max(1, Math.round(rect.width * dpr));
      canvas.height = Math.max(1, Math.round(rect.height * dpr));
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        ctxRef.current = null;
        return;
      }
      ctx.setTransform(1, 0, 0, 1, 0, 0); // reset before re-scaling
      ctx.scale(dpr, dpr);
      ctx.imageSmoothingEnabled = false;
      ctxRef.current = ctx;
      dprRef.current = dpr;
      sizeRef.current = { w: rect.width, h: rect.height };
    };

    setupCanvas();

    const ro = new ResizeObserver(() => {
      setupCanvas();
      // Force one redraw at the new size.
      drawOnce();
    });
    ro.observe(canvas);

    // Track DPR changes (e.g., dragging a window across monitors).
    const dprMql = window.matchMedia(`(resolution: ${dprRef.current}dppx)`);
    const onDprChange = () => setupCanvas();
    dprMql.addEventListener?.("change", onDprChange);

    return () => {
      ro.disconnect();
      dprMql.removeEventListener?.("change", onDprChange);
    };
    // drawOnce is captured via closure below; intentionally [].
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ---- Theme color caching + MutationObserver refresh.
  useEffect(() => {
    colorRef.current = resolveForegroundColor();

    const refreshColor = () => {
      colorRef.current = resolveForegroundColor();
      drawOnce();
    };

    const mo = new MutationObserver(refreshColor);
    mo.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["data-theme", "class"]
    });
    return () => mo.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ---- Track desktop/mobile (which lanes to render).
  useEffect(() => {
    const mql = window.matchMedia("(min-width: 640px)");
    const xlMql = window.matchMedia("(min-width: 1280px)");
    const update = () => {
      isDesktopRef.current = mql.matches;
      xlGapRef.current = xlMql.matches;
      drawOnce();
    };
    update();
    mql.addEventListener("change", update);
    xlMql.addEventListener("change", update);
    return () => {
      mql.removeEventListener("change", update);
      xlMql.removeEventListener("change", update);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ---- The render function. Pure read of refs, no allocations.
  function drawOnce() {
    const ctx = ctxRef.current;
    const { w, h } = sizeRef.current;
    if (!ctx || w === 0 || h === 0) return;

    const engine = engineRef.current;
    if (!engine) return;

    const desktop = isDesktopRef.current;
    const xl = xlGapRef.current;
    const gap = xl ? ROW_GAP_XL_PX : ROW_GAP_PX;

    const visibleConfigs: ReadonlyArray<LaneConfig> = desktop
      ? LANE_CONFIGS
      : LANE_CONFIGS.filter((c) =>
          (MOBILE_LANE_IDS as ReadonlyArray<number>).includes(c.id)
        );

    // Total stack height = sum of lane heights + gaps.
    const stackHeight = visibleConfigs.reduce(
      (sum, c, i) => sum + c.heightPx + (i > 0 ? gap : 0),
      0
    );
    // Vertically center the stack within the canvas.
    const stackTop = Math.max(0, (h - stackHeight) / 2);

    const spacing = w / HATCHES_PER_VIEWPORT_WIDTH;

    ctx.clearRect(0, 0, w, h);
    ctx.strokeStyle = colorRef.current;

    let cursorY = stackTop;
    for (let li = 0; li < visibleConfigs.length; li++) {
      const cfg = visibleConfigs[li];
      // Map back to the lane state by id (engine has 5 entries always).
      const lane = engine.lanes[cfg.id];

      // Effective alpha = base × tremor; bumped toward 1 by the breath envelope.
      const baseAlpha = cfg.opacityBand * lane.opacityScale;
      const breathBoost = engine.breathPulse * (1 - baseAlpha);
      const alpha = Math.min(1, baseAlpha + breathBoost);
      ctx.globalAlpha = alpha;

      // offsetPx is a *fractional* progress in [0..1) (signed). Convert to px
      // along this lane's spacing so the lane visually steps by one hatch per cycle.
      const offsetFraction = lane.offsetPx;
      const offsetPx =
        (((offsetFraction * spacing) % spacing) + spacing) % spacing;

      // Lane vertical extents.
      const laneTop = cursorY;
      const laneBottom = cursorY + cfg.heightPx;
      const minorInsetTop = laneTop + cfg.heightPx * MINOR_TICK_VERTICAL_INSET;
      const minorInsetBottom =
        laneBottom - cfg.heightPx * MINOR_TICK_VERTICAL_INSET;

      // Draw enough hatches to cover full width plus one bleed on each side.
      const numHatches = Math.ceil(w / spacing) + 2;
      // Phase index of the leftmost hatch — controls the major/minor pattern.
      const baseIndex = Math.floor(offsetFraction);

      for (let i = 0; i < numHatches; i++) {
        const x = -spacing + offsetPx + i * spacing;
        const xRounded = Math.round(x) + 0.5; // crisp 1-device-pixel verticals
        const isMajor = (i + baseIndex) % MAJOR_TICK_EVERY === 0;
        ctx.lineWidth = isMajor ? MAJOR_TICK_WIDTH_PX : MINOR_TICK_WIDTH_PX;
        const y0 = isMajor ? laneTop : minorInsetTop;
        const y1 = isMajor ? laneBottom : minorInsetBottom;
        ctx.beginPath();
        ctx.moveTo(xRounded, y0);
        ctx.lineTo(xRounded, y1);
        ctx.stroke();
      }

      cursorY += cfg.heightPx + gap;
    }

    ctx.globalAlpha = 1;
  }

  // ---- Animation loop. Reads engine ref each frame.
  useEffect(() => {
    if (frozen) {
      // Render once at phase-0; never start rAF.
      drawOnce();
      return;
    }

    let rafId = 0;
    let cancelled = false;

    const loop = () => {
      if (cancelled) return;
      drawOnce();
      rafId = requestAnimationFrame(loop);
    };
    rafId = requestAnimationFrame(loop);

    return () => {
      cancelled = true;
      cancelAnimationFrame(rafId);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [frozen]);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden
      className={className}
      // `color` here is the computed source for the hatch stroke. The canvas
      // resolves `var(--foreground)` via getComputedStyle(canvas).color which
      // always yields a fully-substituted color even when --foreground chains
      // through other variables.
      style={{
        display: "block",
        width: "100%",
        height: "100%",
        color: "var(--foreground)"
      }}
    />
  );
}
