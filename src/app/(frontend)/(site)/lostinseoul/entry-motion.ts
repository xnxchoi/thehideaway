import { Target } from "motion";
import { TransitionState } from "@/stores/RP_Ui";

export type LostEntryElement = "stage" | "chrome" | "heroText" | "heroButton";

type LostEntryElementState = {
  opacity: number | number[];
  pointerEvents?: "auto" | "none";
  scale?: number;
  y?: number | string | number[];
};

export const LOST_ENTRY_PHASE_EVENT = "lost:entry-phase";

export const lostEntryDelays = {
  ending: {
    chrome: 0.62,
    heroButton: 9.62,
    heroText: 0.51,
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
  element: LostEntryElement,
  phase: LostEntryPhase
): Target {
  const toReturn: Target = {
    opacity: 1,
    scale: 1,
    pointerEvents: "auto"
  };
  switch (element) {
    case "stage":
      {
        if (phase === "loading") {
          toReturn.opacity = 0.58;
          toReturn.scale = 0.985;
          toReturn.y = "18svh";
        } else {
          toReturn.opacity = 1;
          toReturn.scale = 1;
          toReturn.y = 0;
        }
      }
      break;
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
  element: LostEntryElement,
  phase: LostEntryPhase
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

export function isLostEntryPhase(
  value: string | undefined
): value is LostEntryPhase {
  return value === "loading" || value === "ending" || value === "ready";
}

export function resolveLostHeaderEntryPhase({
  animated,
  observedPhase
}: {
  animated: boolean;
  observedPhase: TransitionState;
}): LostEntryPhase {
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
  phase: LostEntryPhase;
}) {
  return phase !== "ready" && elapsedMs >= forceReadyMs;
}
