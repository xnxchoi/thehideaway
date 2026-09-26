import { Target } from "motion";
import { useEffect, useState } from "react";
import { getCommittedPageTransitionPath } from "@/utilities/pageTransitionInitial";

export type EntryElement = "stage" | "chrome" | "heroText" | "heroButton";
export type EntryPhase = "loading" | "ready" | "ending";
/** @deprecated Use EntryElement */
export type LostEntryElement = EntryElement;
/** @deprecated Use EntryPhase */
export type LostEntryPhase = EntryPhase;

export const lostEntryDelays = {
  ending: {
    chrome: 0.51,
    heroButton: 9.62,
    heroText: 0.62,
    stage: 0
  },
  ready: {
    chrome: 0.02,
    heroButton: 0.16,
    heroText: 0.08,
    stage: 0
  }
} as const;

export const lostEntryEase = [0.6, 0, 0.3, 1] as const;

export function getLostEntryElementState(
  element: EntryElement,
  phase: EntryPhase
): Target {
  const toReturn: Target = {
    opacity: 1,
    pointerEvents: "auto",
    scale: 1
  };
  switch (element) {
    case "stage": {
      if (phase === "loading") {
        toReturn.opacity = 0.58;
        toReturn.scale = 0.985;
        toReturn.y = "18svh";
      } else {
        toReturn.opacity = 1;
        toReturn.scale = 1;
        toReturn.y = 0;
      }
      break;
    }
    case "heroButton": {
      if (phase === "loading") {
        toReturn.opacity = 0;
        toReturn.y = "7.5rem";
        toReturn.pointerEvents = "none";
      } else {
        toReturn.opacity = 1;
        toReturn.y = 0;
        toReturn.pointerEvents = "auto";
      }
      break;
    }
    default: {
      if (phase === "loading") {
        toReturn.opacity = 0;
        toReturn.pointerEvents = "none";
      } else {
        toReturn.opacity = 1;
        toReturn.pointerEvents = "auto";
      }
    }
  }
  return toReturn;
}

export function getLostEntryTransition(
  element: EntryElement,
  phase: EntryPhase
) {
  return {
    delay: (phase === "loading"
      ? lostEntryDelays.ready
      : lostEntryDelays[phase])[element],
    duration:
      element === "stage" ? 1.25 : element === "heroButton" ? 0.8 : 0.55,
    ease: lostEntryEase
  };
}

export function resolveLostHeaderEntryPhase({
  animated,
  observedPhase
}: {
  animated: boolean;
  observedPhase: EntryPhase;
}): EntryPhase {
  return animated ? observedPhase : "ready";
}

export function shouldFinishLostEntry({
  minimumElapsed,
  sceneReady,
  sceneTimedOut
}: {
  minimumElapsed: boolean;
  sceneReady: boolean;
  sceneTimedOut: boolean;
}) {
  return minimumElapsed && (sceneReady || sceneTimedOut);
}

export function shouldForceLostEntryReady({
  elapsedMs,
  forceReadyMs,
  phase
}: {
  elapsedMs: number;
  forceReadyMs: number;
  phase: EntryPhase;
}) {
  return phase !== "ready" && elapsedMs >= forceReadyMs;
}

const ENTRY_MIN_MS = 1100;
const ENTRY_FAILSAFE_MS = 2600;
const ENTRY_EXIT_MS = 1520;
const ENTRY_FORCE_READY_MS = ENTRY_FAILSAFE_MS + ENTRY_EXIT_MS + 500;

export function useEntrySequence(
  sceneReady: boolean,
  enabled = true,
  pathname?: string
): EntryPhase {
  const [phase, setPhase] = useState<EntryPhase>(() =>
    enabled &&
    (pathname === undefined || pathname !== getCommittedPageTransitionPath())
      ? "loading"
      : "ready"
  );
  const [minimumElapsed, setMinimumElapsed] = useState(!enabled);
  const [sceneTimedOut, setSceneTimedOut] = useState(!enabled);

  useEffect(() => {
    if (!enabled) return;
    const settleWhenHidden = () => {
      if (document.hidden) setPhase("ready");
    };
    document.addEventListener("visibilitychange", settleWhenHidden);
    settleWhenHidden();
    return () =>
      document.removeEventListener("visibilitychange", settleWhenHidden);
  }, [enabled]);

  useEffect(() => {
    if (!enabled) return;
    const minTimer = window.setTimeout(() => {
      setMinimumElapsed(true);
    }, ENTRY_MIN_MS);
    const failsafeTimer = window.setTimeout(() => {
      setSceneTimedOut(true);
    }, ENTRY_FAILSAFE_MS);

    return () => {
      window.clearTimeout(minTimer);
      window.clearTimeout(failsafeTimer);
    };
  }, [enabled]);

  useEffect(() => {
    if (!enabled) return;
    const startedAt = Date.now();
    const forceReadyTimer = window.setTimeout(() => {
      setPhase((currentPhase) =>
        shouldForceLostEntryReady({
          elapsedMs: Date.now() - startedAt,
          forceReadyMs: ENTRY_FORCE_READY_MS,
          phase: currentPhase
        })
          ? "ready"
          : currentPhase
      );
    }, ENTRY_FORCE_READY_MS);

    return () => {
      window.clearTimeout(forceReadyTimer);
    };
  }, [enabled]);

  useEffect(() => {
    if (!enabled) return;
    if (phase !== "loading") return;
    if (
      shouldFinishLostEntry({
        minimumElapsed,
        sceneReady,
        sceneTimedOut
      })
    ) {
      setPhase("ending");
    }
  }, [enabled, minimumElapsed, phase, sceneReady, sceneTimedOut]);

  useEffect(() => {
    if (!enabled) return;
    if (phase !== "ending") return;
    const readyTimer = window.setTimeout(() => {
      setPhase("ready");
    }, ENTRY_EXIT_MS);

    return () => {
      window.clearTimeout(readyTimer);
    };
  }, [enabled, phase]);

  return phase;
}
