import { useEffect, useEffectEvent, useRef } from "react";
import {
  clamp,
  lerp,
  map,
  Point,
  vec,
  vecAdd,
  vecLerp,
  vecMult,
  vecSub
} from "@/utilities/mathUtilities";
import { useFrame } from "@react-three/fiber";
import { useWindowResize } from "@/utilities/use_window_resize";

interface UseCanvasAnimationOptions {
  onSetup?: (ctx: CanvasRenderingContext2D, state: CanvasState) => void;
  onDraw: (ctx: CanvasRenderingContext2D, state: CanvasState) => boolean | void;
  onResize?: (ctx: CanvasRenderingContext2D, state: CanvasState) => void;
  alpha?: boolean;
  resizeDebounce?: number;
  deferStart?: boolean;
}

interface CanvasState {
  width: number;
  height: number;
  dpr: number;
  isVisible: boolean;
  isPageVisible: boolean;
  animationId: number;
  frameCount: number;
}

export function useCanvasAnimation(options: UseCanvasAnimationOptions) {
  const {
    onSetup,
    onDraw,
    onResize,
    alpha = false,
    resizeDebounce = 100,
    deferStart = false
  } = options;

  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef<CanvasState>({
    width: 0,
    height: 0,
    dpr: 1,
    isVisible: true,
    isPageVisible: true,
    animationId: 0,
    frameCount: 0
  });
  const initializeCanvasTexture=useEffectEvent(()=>{
    let canvas=canvasRef.current;
    !canvas&&(canvas=document.createElement("canvas"),canvasRef.current=canvas);
    const ctx=canvas.getContext("2d",{alpha:true});
    if(!ctx)return;

  });
  const updateCanvasSize = () => {
    const dpr = window.devicePixelRatio || 1;
    const container = containerRef.current;
    const rect = container.getBoundingClientRect();
    state.width = rect.width;
    state.height = rect.height;
    state.dpr = dpr;
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  };
  const lastResize=useWindowResize({
    debounce:resizeDebounce,
    detectVisibilityChange:false

  })
  useEffect(() => {
    let resizeTimeoutId: number;
    let cancelIdleStart: (() => void) | undefined;
    const container = containerRef.current;
    const canvas = canvasRef.current;

    if (!container || !canvas) return;

    const ctx = canvas.getContext("2d", { alpha });
    if (!ctx) return;

    const state = stateRef.current;
    let isStarted = !deferStart;



    function animate() {
      state.frameCount = state.frameCount + 1;

      if (ctx && onDraw(ctx, state) !== false) {
        state.animationId = requestAnimationFrame(animate);
      } else {
        state.animationId = 0;
      }
    }

    const startAnimation = () => {
      if (!isStarted || state.animationId) return;
      if (state.isVisible && state.isPageVisible) {
        state.animationId = requestAnimationFrame(animate);
      }
    };

    const stopAnimation = () => {
      if (state.animationId) {
        cancelAnimationFrame(state.animationId);
        state.animationId = 0;
      }
    };

    const handleResize = () => {
      clearTimeout(resizeTimeoutId);
      resizeTimeoutId = setTimeout(() => {
        updateCanvasSize();
        onResize?.(ctx, state);
      }, resizeDebounce) as unknown as number;
    };

    const handleVisibilityChange = () => {
      state.isPageVisible = document.visibilityState === "visible";
      if (state.isVisible && state.isPageVisible) {
        startAnimation();
      } else {
        stopAnimation();
      }
    };

    const intersectionObserver = new IntersectionObserver(
      (entries) => {
        state.isVisible = entries[0]?.isIntersecting ?? true;
        if (state.isVisible && state.isPageVisible) {
          startAnimation();
        } else {
          stopAnimation();
        }
      },
      { threshold: 0 }
    );

    updateCanvasSize();
    intersectionObserver.observe(container);
    onSetup?.(ctx, state);

    if (deferStart) {
      const startDeferred = () => {
        isStarted = true;
        cancelIdleStart = undefined;
        startAnimation();
      };

      if (typeof requestIdleCallback !== "undefined") {
        const id = requestIdleCallback(startDeferred);
        cancelIdleStart = () => cancelIdleCallback(id);
      } else {
        const id = setTimeout(startDeferred, 150);
        cancelIdleStart = () => clearTimeout(id);
      }
    } else {
      startAnimation();
    }

    window.addEventListener("resize", handleResize, { passive: true });
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      stopAnimation();
      cancelIdleStart?.();
      clearTimeout(resizeTimeoutId);
      intersectionObserver.disconnect();
      window.removeEventListener("resize", handleResize);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [onSetup, onDraw, onResize, alpha, resizeDebounce, deferStart]);

  return { containerRef, canvasRef, stateRef };
}

export function clearCanvas(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  fillStyle: string
) {
  ctx.fillStyle = fillStyle;
  ctx.fillRect(0, 0, width, height);
}

interface MouseState {
  x: number;
  y: number;
  targetX: number;
  targetY: number;
}

interface AnimationState {
  linesNum: number;
  bias: number;
}

function drawCurve(
  ctx: CanvasRenderingContext2D,
  start: Point,
  end: Point,
  control: Point,
  bias: number,
  power: number
) {
  const midpoint = vecLerp(start, end, 0.5);
  const offset = vecSub(control, midpoint);
  ctx.beginPath();
  for (let i = 0; i <= 50; i++) {
    const t = i / 50;
    const point = vecLerp(start, end, t);
    const curve =
      2 *
      Math.pow(t, power * (1 - bias) * 2) *
      Math.pow(1 - t, power * bias * 2);
    const pos = vecAdd(point, vecMult(offset, curve));
    if (i === 0) {
      ctx.moveTo(pos.x, pos.y);
    } else {
      ctx.lineTo(pos.x, pos.y);
    }
  }
  ctx.stroke();
}

export default function AboutHeroCanvas() {
  const mouseStateRef = useRef<MouseState>({
    x: 0,
    y: 0,
    targetX: 0,
    targetY: 0
  });

  const animStateRef = useRef<AnimationState>({
    linesNum: 40,
    bias: 0.5
  });

  const { containerRef, canvasRef, stateRef } = useCanvasAnimation({
    deferStart: true,
    onSetup: (ctx, state) => {
      mouseStateRef.current.targetX = state.width / 2;
      mouseStateRef.current.targetY = state.height / 2;
      mouseStateRef.current.x = state.width / 2;
      mouseStateRef.current.y = state.height / 2;
    },
    onDraw: (ctx, state) => {
      const { width, height } = state;
      const mouse = mouseStateRef.current;
      const anim = animStateRef.current;

      mouse.x += (mouse.targetX - mouse.x) * 0.05;
      mouse.y += (mouse.targetY - mouse.y) * 0.1;

      clearCanvas(ctx, width, height, "rgb(10, 10, 10)");
      ctx.save();
      ctx.translate(width / 2, height / 2);

      const isSmall = width < 500;
      const offset = isSmall ? 0.8 * height : 0;
      const power = isSmall ? 1.5 : 0.7;
      const topPoint = vec(width, -(1.1 * height) + offset);
      const bottomPoint = vec(0, 2 * height);
      const leftPoint = vec(-width, -height + offset);

      const targetLines = clamp(map(mouse.y, 0, height, 30, 50), 30, 50);
      anim.linesNum = lerp(anim.linesNum, targetLines, 0.1);

      const targetBias = clamp(map(mouse.x, 0, width, 0.6, 0.4), 0.4, 0.6);
      anim.bias = lerp(anim.bias, targetBias, 0.05);

      ctx.strokeStyle = "rgba(255, 255, 255, 0.8)";
      ctx.lineWidth = 1;

      for (let i = 0; i < anim.linesNum; i++) {
        const t = i / (anim.linesNum - 1);
        const endPoint = vec(
          lerp(bottomPoint.x, leftPoint.x, 1 - t * t),
          lerp(bottomPoint.y, leftPoint.y, 1 - t * t)
        );
        const controlPoint = vecAdd(
          vecMult(topPoint, 0.5),
          vecMult(endPoint, 0.5)
        );
        drawCurve(
          ctx,
          topPoint,
          endPoint,
          vecMult(vecAdd(bottomPoint, controlPoint), 0.5),
          anim.bias,
          power
        );
      }

      ctx.restore();
      ctx.save();

      const cx = width / 2;
      const cy = height / 2;
      const radius = Math.max(width, height) / 2;
      ctx.translate(cx, cy);
      ctx.scale(width / (2 * radius), height / (2 * radius));

      const gradient = ctx.createRadialGradient(0, 0, 0, 0, 0, radius);
      gradient.addColorStop(0, "rgba(10, 10, 10, 0)");
      gradient.addColorStop(0.55, "rgba(10, 10, 10, 0)");
      gradient.addColorStop(0.85, "rgba(10, 10, 10, 0.9)");
      gradient.addColorStop(1, "rgba(10, 10, 10, 1)");
      ctx.fillStyle = gradient;
      ctx.fillRect(-radius, -radius, 2 * radius, 2 * radius);
      ctx.restore();
    }
  });

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    let rect = container.getBoundingClientRect();
    const handleMouseMove = (e: MouseEvent) => {
      if (stateRef.current.isVisible) {
        mouseStateRef.current.targetX = e.clientX - rect.left;
        mouseStateRef.current.targetY = e.clientY - rect.top;
      }
    };

    let rafId = 0;
    const updateRect = () => {
      if (!rafId) {
        rafId = requestAnimationFrame(() => {
          rect = container.getBoundingClientRect();
          rafId = 0;
        });
      }
    };

    document.addEventListener("mousemove", handleMouseMove, { passive: true });
    window.addEventListener("scroll", updateRect, { passive: true });

    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("scroll", updateRect);
      if (rafId) cancelAnimationFrame(rafId);
    };
  }, [containerRef, stateRef]);

  return (
    <div ref={containerRef} className="absolute inset-0">
      <canvas ref={canvasRef} className="size-full" />
    </div>
  );
}
