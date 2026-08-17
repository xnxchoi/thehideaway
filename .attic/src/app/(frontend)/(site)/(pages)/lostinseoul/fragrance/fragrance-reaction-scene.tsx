"use client";

import { useEffect, useRef } from "react";
import type { MotionValue } from "motion/react";
import {
  getLostFragranceReactionCamera,
  LOST_FRAGRANCE_REACTION_FRAG,
  LOST_FRAGRANCE_REACTION_VERT
} from "./fragrance-reaction";

const MAX_DPR = 2;

type Props = {
  progress: MotionValue<number>;
  onReady?: () => void;
};

/**
 * The Catalyst showcase scene — the founder-blessed abstract reaction.
 *
 * Raw WebGL1, one full-screen triangle, one fragment shader; no three.js.
 * The whole look lives in fragrance-reaction.ts. Scroll progress arrives
 * as a MotionValue and is read per frame (never through React state).
 *
 * Reduced motion: the ember keeps answering scroll (that is the page's
 * one meaning-bearing motion) but the self-animating turbulence freezes.
 */
export function LostFragranceReactionScene({ progress, onReady }: Props) {
  const mountRef = useRef<HTMLDivElement>(null);
  const onReadyRef = useRef(onReady);

  useEffect(() => {
    onReadyRef.current = onReady;
  }, [onReady]);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;
    // The canvas is created per mount, not in JSX: dev StrictMode runs
    // mount → cleanup → mount, and a JSX canvas would hand the second
    // mount the context the first cleanup already lost.
    const canvas = document.createElement("canvas");
    canvas.className = "lost-fragrance-canvas-surface";
    mount.appendChild(canvas);
    const gl = canvas.getContext("webgl", {
      antialias: false,
      premultipliedAlpha: false,
      powerPreference: "high-performance"
    });
    if (!gl) {
      canvas.remove();
      return;
    }

    const compile = (type: number, source: string): WebGLShader | null => {
      const shader = gl.createShader(type);
      if (!shader) return null;
      gl.shaderSource(shader, source);
      gl.compileShader(shader);
      if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        console.error(gl.getShaderInfoLog(shader));
        gl.deleteShader(shader);
        return null;
      }
      return shader;
    };

    const vert = compile(gl.VERTEX_SHADER, LOST_FRAGRANCE_REACTION_VERT);
    const frag = compile(gl.FRAGMENT_SHADER, LOST_FRAGRANCE_REACTION_FRAG);
    const program = gl.createProgram();
    if (!vert || !frag || !program) return;
    gl.attachShader(program, vert);
    gl.attachShader(program, frag);
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      console.error(gl.getProgramInfoLog(program));
      return;
    }
    gl.useProgram(program);

    const buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(
      gl.ARRAY_BUFFER,
      new Float32Array([-1, -1, 3, -1, -1, 3]),
      gl.STATIC_DRAW
    );
    const position = gl.getAttribLocation(program, "p");
    gl.enableVertexAttribArray(position);
    gl.vertexAttribPointer(position, 2, gl.FLOAT, false, 0, 0);

    const uRes = gl.getUniformLocation(program, "uRes");
    const uTime = gl.getUniformLocation(program, "uTime");
    const uProg = gl.getUniformLocation(program, "uProg");
    const uCamZoom = gl.getUniformLocation(program, "uCamZoom");
    const uCamY = gl.getUniformLocation(program, "uCamY");

    const size = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, MAX_DPR);
      canvas.width = Math.round(canvas.clientWidth * dpr);
      canvas.height = Math.round(canvas.clientHeight * dpr);
      gl.viewport(0, 0, canvas.width, canvas.height);
    };
    size();
    const resizeObserver = new ResizeObserver(size);
    resizeObserver.observe(canvas);

    const reducedMotionQuery = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    );

    let frame = 0;
    let hidden = document.hidden;
    let elapsed = 0;
    let last: number | null = null;
    let ready = false;

    const render = (timestamp: number) => {
      frame = requestAnimationFrame(render);
      if (last !== null && !reducedMotionQuery.matches) {
        elapsed += Math.min(timestamp - last, 100) / 1000;
      }
      last = timestamp;
      const prog = progress.get();
      const camera = getLostFragranceReactionCamera(prog);
      gl.uniform2f(uRes, canvas.width, canvas.height);
      gl.uniform1f(uTime, elapsed);
      gl.uniform1f(uProg, prog);
      gl.uniform1f(uCamZoom, camera.zoom);
      gl.uniform1f(uCamY, camera.y);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
      if (!ready) {
        ready = true;
        onReadyRef.current?.();
      }
    };

    const start = () => {
      if (!frame && !hidden) {
        last = null;
        frame = requestAnimationFrame(render);
      }
    };
    const stop = () => {
      if (frame) {
        cancelAnimationFrame(frame);
        frame = 0;
      }
    };
    const onVisibility = () => {
      hidden = document.hidden;
      if (hidden) stop();
      else start();
    };
    document.addEventListener("visibilitychange", onVisibility);
    start();

    return () => {
      stop();
      document.removeEventListener("visibilitychange", onVisibility);
      resizeObserver.disconnect();
      gl.deleteProgram(program);
      gl.deleteShader(vert);
      gl.deleteShader(frag);
      gl.deleteBuffer(buffer);
      gl.getExtension("WEBGL_lose_context")?.loseContext();
      canvas.remove();
    };
  }, [progress]);

  return (
    <div
      aria-hidden
      className="lost-fragrance-canvas"
      data-lost-fragrance-canvas
      ref={mountRef}
    />
  );
}
