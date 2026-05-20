/**
 * Small self-contained canvas confetti for the "that's you" celebration on
 * /day-n-night/guests.
 *
 * Boots a particle field on demand, animates with GSAP's ticker, and shuts
 * itself down when the last confetto leaves the viewport. Caller is
 * responsible for clearing/re-running on subsequent fires.
 */

import { gsap } from "gsap";

type Particle = {
  color: { front: string; back: string };
  dim: { x: number; y: number };
  pos: { x: number; y: number };
  rot: number;
  scale: { x: number; y: number };
  vel: { x: number; y: number };
};

const COLORS = [
  { front: "#FF4D4D", back: "#8A1A1A" },
  { front: "#FFD13F", back: "#9E7F0E" },
  { front: "#5FC9C9", back: "#1F6363" },
  { front: "#FF9051", back: "#964517" },
  { front: "#FF7CA6", back: "#8C2B4F" },
  { front: "#B97EFF", back: "#552B86" }
];

const COUNT = 220;
const GRAVITY = 0.65;
const DRAG = 0.075;
const TERMINAL = 16;

function rand(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

export type ConfettiHandle = { stop: () => void };

export function runConfetti(
  canvas: HTMLCanvasElement,
  width: number,
  height: number,
  dpr: number
): ConfettiHandle {
  const ctx = canvas.getContext("2d");
  if (!ctx) return { stop: () => {} };

  canvas.width = width * dpr;
  canvas.height = height * dpr;
  canvas.style.width = `${Math.ceil(width)}px`;
  canvas.style.height = `${Math.ceil(height)}px`;
  ctx.scale(dpr, dpr);

  const particles: Particle[] = [];
  for (let i = 0; i < COUNT; i++) {
    particles.push({
      color: COLORS[rand(0, COLORS.length - 1)],
      dim: { x: rand(8, 24), y: rand(8, 18) },
      pos: { x: rand(0, width), y: height - 1 },
      rot: Math.random() * Math.PI * 2,
      scale: { x: 1, y: 1 },
      vel: { x: rand(-22, 22), y: rand(-44, -6) }
    });
  }

  let running = true;

  const tick = () => {
    ctx.clearRect(0, 0, width * dpr, height * dpr);

    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i];
      ctx.scale(dpr, dpr);

      const w = p.dim.x * p.scale.x;
      const h = p.dim.y * p.scale.y;

      ctx.translate(p.pos.x, p.pos.y);
      ctx.rotate(p.rot);

      p.vel.x -= p.vel.x * DRAG;
      p.vel.y = Math.min(p.vel.y + GRAVITY, TERMINAL);
      p.vel.x += Math.random() > 0.5 ? Math.random() : -Math.random();
      p.pos.x += p.vel.x;
      p.pos.y += p.vel.y;
      p.scale.y = Math.cos(0.1 * p.pos.y);

      ctx.fillStyle = p.scale.y > 0 ? p.color.front : p.color.back;
      ctx.fillRect(-w / 2, -h / 2, w, h);
      ctx.setTransform(1, 0, 0, 1, 0, 0);

      if (p.pos.y > height + 2 * h) particles.splice(i, 1);
    }

    if (particles.length === 0 && running) {
      stop();
    }
  };

  const stop = () => {
    if (!running) return;
    running = false;
    gsap.ticker.remove(tick);
    ctx.clearRect(0, 0, width * dpr, height * dpr);
  };

  gsap.ticker.add(tick);

  return { stop };
}
