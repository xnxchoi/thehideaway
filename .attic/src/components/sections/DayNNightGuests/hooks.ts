"use client";

/**
 * State-shape hooks for the Day n Night guests page.
 *
 * Three ideas, one model:
 *   • focused — the guest whose section overlaps viewport center, driven
 *               by IntersectionObserver. Can be null only momentarily,
 *               between two sections.
 *   • hovered — the guest cursored on in the side rail. Can be null
 *               perpetually (mobile, idle desktop, off the rail).
 *   • active  — what we actually display. `hovered ?? focused`, with a
 *               short debounce on `hovered=null → focused` to avoid
 *               flicker when the cursor leaves and immediately re-enters
 *               an adjacent name.
 *
 * Background mode is derived: fast scroll OR rapid active changes →
 * "color" (solid bg); otherwise "photo" (blurred portrait bg). A
 * clearable timeout returns us to "photo" after settling.
 */

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type MutableRefObject
} from "react";

/* ────────────────────────── focused (IO-based) ────────────────────────── */

export function useFocusedGuest(ids: ReadonlyArray<string>): {
  focusedId: string | null;
  register: (id: string, el: HTMLElement | null) => void;
} {
  const [focusedId, setFocusedId] = useState<string | null>(ids[0] ?? null);
  const refs = useRef(new Map<string, HTMLElement>());
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    if (ids.length === 0) return;

    const compute = () => {
      const center = window.innerHeight / 2;
      let bestId: string | null = ids[0] ?? null;
      let bestDistance = Number.POSITIVE_INFINITY;
      for (const id of ids) {
        const el = refs.current.get(id);
        if (!el) continue;
        const r = el.getBoundingClientRect();
        const mid = r.top + r.height / 2;
        const d = Math.abs(mid - center);
        if (d < bestDistance) {
          bestDistance = d;
          bestId = id;
        }
      }
      setFocusedId((prev) => (prev === bestId ? prev : bestId));
    };

    const onScroll = () => {
      if (rafRef.current !== null) return;
      rafRef.current = requestAnimationFrame(() => {
        rafRef.current = null;
        compute();
      });
    };

    compute();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    };
  }, [ids]);

  // (id, el) form — not curried — so callers can wrap this in their own
  // stable useCallback and avoid unmount/remount churn on every render.
  const register = useCallback((id: string, el: HTMLElement | null) => {
    if (el) {
      el.dataset.guestId = id;
      refs.current.set(id, el);
    } else {
      refs.current.delete(id);
    }
  }, []);

  return { focusedId, register };
}

/* ────────────────────────── scroll velocity ────────────────────────── */

export function useScrollVelocity(): MutableRefObject<number> {
  const velocity = useRef(0);
  const lastY = useRef(0);
  const lastT = useRef(0);

  useEffect(() => {
    lastY.current = window.scrollY;
    lastT.current = performance.now();

    const onScroll = () => {
      const now = performance.now();
      const y = window.scrollY;
      const dt = now - lastT.current;
      if (dt <= 0) return;
      const delta = Math.abs(y - lastY.current);
      // Teleport guard. A natural-scroll frame is at most ~600px; an
      // infinite-loop snap is ≥ one full copy of the array (always
      // ≥ 0.8 * viewport in our config). Treat any single-frame delta
      // above 70% of viewport as a teleport and skip the velocity update
      // so the bg-mode hook doesn't flash to "color" during a snap.
      if (delta > window.innerHeight * 0.7) {
        lastY.current = y;
        lastT.current = now;
        return;
      }
      // px / s
      const v = (delta / dt) * 1000;
      // Low-pass to keep us out of jitter:
      velocity.current = velocity.current * 0.6 + v * 0.4;
      lastY.current = y;
      lastT.current = now;
    };

    const onIdle = () => {
      // Decay toward zero so velocity doesn't get stuck high after a fling.
      velocity.current *= 0.85;
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    const interval = window.setInterval(onIdle, 100);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.clearInterval(interval);
    };
  }, []);

  return velocity;
}

/* ────────────────────────── orientation ────────────────────────── */
/*
 * `portrait` = tall viewport (phone). `landscape` = wide viewport (laptop,
 * desktop, big tablet). Drives whether we render the compact-stack name
 * list with a contained portrait frame, or the giant-name + full-bleed
 * blurred backdrop layout.
 *
 * SSR-safe: defaults to landscape on first render, syncs from matchMedia
 * after mount and on every change.
 */

export function useOrientation(): "portrait" | "landscape" {
  const [orient, setOrient] = useState<"portrait" | "landscape">("landscape");
  useEffect(() => {
    const mq = window.matchMedia("(orientation: portrait)");
    const update = () => setOrient(mq.matches ? "portrait" : "landscape");
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);
  return orient;
}

/* ────────────────────────── active (hovered ?? focused) ────────────────────────── */

type ActiveOpts = {
  hovered: string | null;
  focused: string | null;
  /** ms to wait before falling back from hovered to focused. */
  hoverClearDebounceMs?: number;
};

export function useActiveId({
  hovered,
  focused,
  hoverClearDebounceMs = 120
}: ActiveOpts): string | null {
  const [active, setActive] = useState<string | null>(hovered ?? focused);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
      debounceRef.current = null;
    }

    if (hovered) {
      // Hovered always wins immediately.
      setActive(hovered);
      return;
    }

    // Hovered cleared; debounce before settling on focused.
    debounceRef.current = setTimeout(() => {
      setActive(focused);
    }, hoverClearDebounceMs);

    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
        debounceRef.current = null;
      }
    };
  }, [hovered, focused, hoverClearDebounceMs]);

  return active;
}

/* ────────────────────────── background mode ────────────────────────── */
/*
 * "photo" — show the blurred portrait of the active guest
 * "color" — show a solid color overlay (no photo, no blur)
 *
 * We switch to "color" when:
 *   1. scroll velocity is above a threshold, OR
 *   2. the active id has changed within the rapid-swap window
 *
 * We return to "photo" after `settleMs` of stable state. The timeout is
 * cleared on every active change, so a chain of rapid swaps keeps us on
 * "color" the whole time, and only the final settle fades us back.
 */

type BgOpts = {
  activeId: string | null;
  velocityRef: MutableRefObject<number>;
  /** px/s above which we collapse to solid color. */
  velocityThreshold?: number;
  /** ms below which back-to-back active swaps count as "rapid". */
  rapidSwapMs?: number;
  /** ms of stability before fading back to photo. */
  settleMs?: number;
};

export function useBackgroundMode({
  activeId,
  velocityRef,
  velocityThreshold = 1200,
  rapidSwapMs = 280,
  settleMs = 320
}: BgOpts): "photo" | "color" {
  const [mode, setMode] = useState<"photo" | "color">("photo");
  const lastChangeAt = useRef(0);
  const settleTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const rafRef = useRef<number | null>(null);

  // Active changes: if the previous change was within the rapid window,
  // collapse to color and arm the settle timer.
  useEffect(() => {
    if (activeId === null) return;
    const now = performance.now();
    const sinceLast = now - lastChangeAt.current;
    lastChangeAt.current = now;

    if (sinceLast < rapidSwapMs) {
      setMode("color");
    }

    if (settleTimer.current) clearTimeout(settleTimer.current);
    settleTimer.current = setTimeout(() => {
      setMode("photo");
    }, settleMs);

    return () => {
      if (settleTimer.current) {
        clearTimeout(settleTimer.current);
        settleTimer.current = null;
      }
    };
  }, [activeId, rapidSwapMs, settleMs]);

  // Velocity check: rAF loop reads the ref (avoid re-render storms on
  // every scroll tick). Drops back to photo once velocity falls below
  // ~40% of the threshold (hysteresis).
  useEffect(() => {
    const loop = () => {
      const v = velocityRef.current ?? 0;
      if (v > velocityThreshold) {
        setMode("color");
        if (settleTimer.current) clearTimeout(settleTimer.current);
        settleTimer.current = setTimeout(() => {
          setMode("photo");
        }, settleMs);
      }
      rafRef.current = requestAnimationFrame(loop);
    };
    rafRef.current = requestAnimationFrame(loop);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [velocityRef, velocityThreshold, settleMs]);

  return mode;
}
