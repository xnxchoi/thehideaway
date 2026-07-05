export type LostEntryPhase = "loading" | "ending" | "ready";

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
    chrome: 1.02,
    heroButton: 1.22,
    heroText: 1.1,
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
): LostEntryElementState {
  if (element === "stage") {
    return phase === "loading"
      ? { opacity: 0.58, scale: 0.985, y: "18svh" }
      : { opacity: 1, scale: 1, y: 0 };
  }

  if (element === "heroButton") {
    return phase === "loading"
      ? { opacity: 0, pointerEvents: "none", y: "7.5rem" }
      : { opacity: 1, pointerEvents: "auto", y: 0 };
  }

  return phase === "loading"
    ? { opacity: 0, pointerEvents: "none" }
    : { opacity: 1, pointerEvents: "auto" };
}

export function getLostEntryTransition(
  element: LostEntryElement,
  phase: LostEntryPhase
) {
  const phaseDelays =
    phase === "loading" ? lostEntryDelays.ready : lostEntryDelays[phase];

  return {
    delay: phaseDelays[element],
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
