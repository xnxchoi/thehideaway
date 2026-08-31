import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import {
  getLostEntryElementState,
  LOST_ENTRY_PHASE_EVENT,
  lostEntryDelays,
  parseLostEntryPhaseEvent,
  resolveLostHeaderEntryPhase,
  shouldFinishLostEntry,
  shouldForceLostEntryReady,
  type LostEntryElement,
  type LostEntryPhase
} from "./entry-motion";

describe("lostinseoul entry motion", () => {
  it.each<{
    element: LostEntryElement;
    phase: LostEntryPhase;
    expected: Record<string, unknown>;
  }>([
    {
      element: "stage",
      expected: { opacity: 0.58, scale: 0.985, y: "18svh" },
      phase: "loading"
    },
    {
      element: "stage",
      expected: { opacity: 1, scale: 1, y: 0 },
      phase: "ending"
    },
    {
      element: "chrome",
      expected: { opacity: 0, pointerEvents: "none" },
      phase: "loading"
    },
    {
      element: "chrome",
      expected: { opacity: 1, pointerEvents: "auto" },
      phase: "ready"
    },
    {
      element: "heroButton",
      expected: { opacity: 0, pointerEvents: "none", y: "7.5rem" },
      phase: "loading"
    },
    {
      element: "heroButton",
      expected: { opacity: 1, pointerEvents: "auto", y: 0 },
      phase: "ready"
    }
  ])("returns $phase state for $element", ({ element, expected, phase }) => {
    expect(getLostEntryElementState(element, phase)).toMatchObject(expected);
  });

  it("keeps ending delays staggered in page-reading order", () => {
    expect(lostEntryDelays.ending.chrome).toBeLessThan(
      lostEntryDelays.ending.heroText
    );
    expect(lostEntryDelays.ending.heroText).toBeLessThan(
      lostEntryDelays.ending.heroButton
    );
  });

  it("uses short ready delays for direct route transitions", () => {
    expect(lostEntryDelays.ready.chrome).toBe(0.02);
    expect(lostEntryDelays.ready.heroText).toBe(0.08);
    expect(lostEntryDelays.ready.heroButton).toBe(0.16);
  });

  it("keeps headers visible on routes without the home entry sequence", () => {
    expect(
      resolveLostHeaderEntryPhase({
        animated: false,
        observedPhase: "loading"
      })
    ).toBe("ready");
    expect(
      resolveLostHeaderEntryPhase({
        animated: true,
        observedPhase: "loading"
      })
    ).toBe("loading");
  });

  it("finishes only after the minimum intro and scene readiness gate pass", () => {
    expect(
      shouldFinishLostEntry({
        minimumElapsed: false,
        sceneReady: true,
        sceneTimedOut: false
      })
    ).toBe(false);
    expect(
      shouldFinishLostEntry({
        minimumElapsed: true,
        sceneReady: false,
        sceneTimedOut: false
      })
    ).toBe(false);
    expect(
      shouldFinishLostEntry({
        minimumElapsed: true,
        sceneReady: true,
        sceneTimedOut: false
      })
    ).toBe(true);
    expect(
      shouldFinishLostEntry({
        minimumElapsed: true,
        sceneReady: false,
        sceneTimedOut: true
      })
    ).toBe(true);
  });

  it("reads entry-phase events so chrome can subscribe without crashing", () => {
    expect(
      parseLostEntryPhaseEvent(
        new CustomEvent(LOST_ENTRY_PHASE_EVENT, { detail: { phase: "loading" } })
      )
    ).toBe("loading");
    expect(
      parseLostEntryPhaseEvent(
        new CustomEvent(LOST_ENTRY_PHASE_EVENT, { detail: { phase: "ending" } })
      )
    ).toBe("ending");
    expect(
      parseLostEntryPhaseEvent(new CustomEvent(LOST_ENTRY_PHASE_EVENT, { detail: "ready" }))
    ).toBe("ready");
    expect(
      parseLostEntryPhaseEvent(
        new CustomEvent(LOST_ENTRY_PHASE_EVENT, { detail: { phase: "nope" } })
      )
    ).toBeNull();
  });

  it("exports a header hook that defaults to ready and listens for the entry event", () => {
    const components = readFileSync(new URL("./components.tsx", import.meta.url), "utf8");
    expect(components).toContain("function useLostEntryPhase");
    expect(components).toContain("LOST_ENTRY_PHASE_EVENT");
    expect(components).toContain('useState<LostEntryPhase>("ready")');
    expect(components).toContain("parseLostEntryPhaseEvent");
    expect(components).toContain("useLayoutEffect");
    expect(components).toContain("document.dispatchEvent");
  });

  it("force-unlocks the entry sequence when runtime readiness stalls", () => {
    expect(
      shouldForceLostEntryReady({
        elapsedMs: 4200,
        forceReadyMs: 4300,
        phase: "loading"
      })
    ).toBe(false);
    expect(
      shouldForceLostEntryReady({
        elapsedMs: 4300,
        forceReadyMs: 4300,
        phase: "loading"
      })
    ).toBe(true);
    expect(
      shouldForceLostEntryReady({
        elapsedMs: 6000,
        forceReadyMs: 4300,
        phase: "ready"
      })
    ).toBe(false);
  });
});
