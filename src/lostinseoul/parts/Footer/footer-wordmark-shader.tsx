"use client";

import { useEffect, useRef } from "react";
import {
  CanvasTexture,
  Group,
  MathUtils,
  Mesh,
  OrthographicCamera,
  PlaneGeometry,
  Scene,
  ShaderMaterial,
  Vector2,
  WebGLRenderer
} from "three";

import fragmentShader from "@lostinseoul/glsl/footer-wordmark.fragment.glsl";
import vertexShader from "@lostinseoul/glsl/footer-wordmark.vertex.glsl";
import { initializeLostFooterShader } from "./footer-wordmark-lifecycle";
import { useCoordinator } from "@/providers/CoordinatorCtx";

type Props = {
  onFailure: () => void;
  onReady: () => void;
  text: string;
};

type LetterSpacingContext = CanvasRenderingContext2D & {
  letterSpacing?: string;
};

export function LISLogoScene({ onFailure, onReady, text }: Props) {
  const hostRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const pointerX = useCoordinator((store) => store.x);
  const pointerY = useCoordinator((store) => store.y);

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;

    const scene = new Scene();
    const group = new Group();
    const camera = new OrthographicCamera(-1, 1, 1, -1, 0.1, 1000);
    const geometry = new PlaneGeometry(1, 1);
    const pointer = new Vector2(-10000, -10000);
    const dampedPointer = new Vector2(-10000, -10000);
    const resolution = new Vector2(1, 1);
    const textureCanvas = canvasRef.current;
    if (!textureCanvas) return;
    const context = textureCanvas.getContext("2d", { alpha: true });
    if (!context) {
      onFailure();
      return;
    }

    let renderer: WebGLRenderer;
    try {
      renderer = new WebGLRenderer({
        alpha: true,
        antialias: true,
        powerPreference: "high-performance"
      });
    } catch {
      onFailure();
      return;
    }

    host.appendChild(renderer.domElement);

    const texture = new CanvasTexture(textureCanvas);
    const material = new ShaderMaterial({
      defines: {
        BLUR_RADIUS_SCALE: Number(4).toFixed(1),
        VAR: 45
      },
      fragmentShader,
      transparent: true,
      uniforms: {
        canvasTexture: { value: texture },
        u_alpha: { value: 0.72 },
        u_mouse: { value: dampedPointer },
        u_pixelRatio: { value: 1 },
        u_pxRange: { value: 3 },
        u_resolution: { value: resolution }
      },
      vertexShader
    });
    const mesh = new Mesh(geometry, material);
    group.add(mesh);
    scene.add(group);
    camera.position.z = 100;

    let width = 1;
    let height = 1;
    let frame = 0;
    let lastTime = performance.now();
    let visible = false;
    let failed = false;
    let hasPointer = false;

    const fail = () => {
      if (failed) return;
      failed = true;
      visible = false;
      cancelAnimationFrame(frame);
      renderer.domElement.style.display = "none";
      onFailure();
    };

    const drawTexture = () => {
      const styles = getComputedStyle(host);
      const cssFontSize = Number.parseFloat(styles.fontSize) || height;
      const fontSize = cssFontSize;
      const canvasWidth = Math.max(1, Math.round(width));
      const canvasHeight = Math.max(1, Math.round(height));

      textureCanvas.width = canvasWidth;
      textureCanvas.height = canvasHeight;
      context.clearRect(0, 0, canvasWidth, canvasHeight);
      context.font = `${styles.fontWeight} ${fontSize}px ${styles.fontFamily}`;
      context.fillStyle = styles.color || "black";
      context.textBaseline = "alphabetic";
      (context as LetterSpacingContext).letterSpacing = styles.letterSpacing;

      const metrics = context.measureText(text);
      const fitted = {
        offsetX:
          canvasWidth <= 0 || metrics.width <= 0
            ? 0
            : (canvasWidth -
                metrics.width * Math.min(1, canvasWidth / metrics.width)) /
              2,
        scaleX:
          canvasWidth <= 0 || metrics.width <= 0
            ? 1
            : Math.min(1, canvasWidth / metrics.width)
      };

      const ascent = metrics.actualBoundingBoxAscent || fontSize * 0.75;
      const descent = metrics.actualBoundingBoxDescent || fontSize * 0.15;
      const baseline = (canvasHeight - ascent - descent) / 2 + ascent;

      context.save();
      context.translate(fitted.offsetX, 0);
      context.scale(fitted.scaleX, 1);
      context.fillText(text, 0, baseline);
      context.restore();
      texture.needsUpdate = true;
    };

    const resize = (): boolean => {
      const bounds = host.getBoundingClientRect();
      width = Math.max(1, bounds.width);
      height = Math.max(1, bounds.height);
      renderer.setPixelRatio(1);
      renderer.setSize(width, height, false);
      camera.left = -width / 2;
      camera.right = width / 2;
      camera.top = height / 2;
      camera.bottom = -height / 2;
      camera.updateProjectionMatrix();
      mesh.scale.set(width, height, 1);
      resolution.set(width, height);
      material.uniforms.u_pixelRatio.value = 1;
      drawTexture();
      try {
        renderer.render(scene, camera);
      } catch {
        return false;
      }
      return true;
    };

    const render = (now: number) => {
      if (!visible) return;
      const deltaSeconds = Math.min((now - lastTime) / 1000, 0.1);
      lastTime = now;
      const bounds = host.getBoundingClientRect();
      const localX = pointerX.get() - bounds.left;
      const localY = pointerY.get() - bounds.top;
      if (
        localX >= 0 &&
        localY >= 0 &&
        localX <= bounds.width &&
        localY <= bounds.height
      ) {
        pointer.set(localX - width * 0.375, height * 0.625 - localY);
        hasPointer = true;
      } else if (hasPointer) {
        pointer.set(-width * 4, height * 4);
        hasPointer = false;
      }
      dampedPointer.x = MathUtils.damp(
        dampedPointer.x,
        pointer.x,
        3,
        deltaSeconds
      );
      dampedPointer.y = MathUtils.damp(
        dampedPointer.y,
        pointer.y,
        3,
        deltaSeconds
      );
      try {
        renderer.render(scene, camera);
      } catch {
        fail();
        return;
      }
      frame = requestAnimationFrame(render);
    };

    const start = () => {
      if (visible) return;
      visible = true;
      lastTime = performance.now();
      frame = requestAnimationFrame(render);
    };

    const stop = () => {
      visible = false;
      cancelAnimationFrame(frame);
    };

    const onContextLost = (event: Event) => {
      event.preventDefault();
      fail();
    };

    const resizeObserver = new ResizeObserver(resize);
    const visibilityObserver = new IntersectionObserver(([entry]) => {
      if (entry?.isIntersecting) start();
      else stop();
    });
    const themeObserver = new MutationObserver(() => {
      if (failed) return;
      drawTexture();
      try {
        renderer.render(scene, camera);
      } catch {
        fail();
      }
    });

    renderer.domElement.addEventListener("webglcontextlost", onContextLost);
    themeObserver.observe(document.documentElement, {
      attributeFilter: ["data-theme"],
      attributes: true
    });
    void initializeLostFooterShader({
      fontsReady: document.fonts.ready,
      initialize: () => {
        resizeObserver.observe(host);
        visibilityObserver.observe(host);
        return resize();
      },
      isDisposed: () => failed,
      onFailure: fail,
      onReady
    });

    return () => {
      failed = true;
      stop();
      renderer.domElement.removeEventListener(
        "webglcontextlost",
        onContextLost
      );
      resizeObserver.disconnect();
      visibilityObserver.disconnect();
      themeObserver.disconnect();
      scene.remove(group);
      geometry.dispose();
      material.dispose();
      texture.dispose();
      renderer.dispose();
      renderer.domElement.remove();
    };
  }, [onFailure, onReady, text]);

  return (
    <div className="absolute inset-0" ref={hostRef}>
      <canvas
        className="pointer-events-none absolute inset-0 size-full"
        ref={canvasRef}
      />
    </div>
  );
}
