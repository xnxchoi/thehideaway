"use client";

import { useEffect, useLayoutEffect, useState } from "react";
import {
  shouldFinishLostEntry,
  shouldForceLostEntryReady,
  type LostEntryPhase
} from "./entry-motion";

const LOST_ENTRY_MIN_MS = 1100;
const LOST_ENTRY_FAILSAFE_MS = 2600;
const LOST_ENTRY_EXIT_MS = 1520;
const LOST_ENTRY_FORCE_READY_MS =
  LOST_ENTRY_FAILSAFE_MS + LOST_ENTRY_EXIT_MS + 500;

export function useLostEntrySequence(sceneReady: boolean): LostEntryPhase {
  const [phase, setPhase] = useState<LostEntryPhase>("loading");
  const [minimumElapsed, setMinimumElapsed] = useState(false);
  const [sceneTimedOut, setSceneTimedOut] = useState(false);

  useLayoutEffect(() => {
    document.body.dataset.lostEntry = phase;
    return () => {
      delete document.body.dataset.lostEntry;
    };
  }, [phase]);

  useEffect(() => {
    const minTimer = window.setTimeout(() => {
      setMinimumElapsed(true);
    }, LOST_ENTRY_MIN_MS);
    const failsafeTimer = window.setTimeout(() => {
      setSceneTimedOut(true);
    }, LOST_ENTRY_FAILSAFE_MS);

    return () => {
      window.clearTimeout(minTimer);
      window.clearTimeout(failsafeTimer);
    };
  }, []);

  useEffect(() => {
    const startedAt = Date.now();
    const forceReadyTimer = window.setTimeout(() => {
      setPhase((currentPhase) =>
        shouldForceLostEntryReady({
          elapsedMs: Date.now() - startedAt,
          forceReadyMs: LOST_ENTRY_FORCE_READY_MS,
          phase: currentPhase
        })
          ? "ready"
          : currentPhase
      );
    }, LOST_ENTRY_FORCE_READY_MS);

    return () => {
      window.clearTimeout(forceReadyTimer);
    };
  }, []);

  useEffect(() => {
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
  }, [minimumElapsed, phase, sceneReady, sceneTimedOut]);

  useEffect(() => {
    if (phase !== "ending") return;
    const readyTimer = window.setTimeout(() => {
      setPhase("ready");
    }, LOST_ENTRY_EXIT_MS);

    return () => {
      window.clearTimeout(readyTimer);
    };
  }, [phase]);

  return phase;
}
