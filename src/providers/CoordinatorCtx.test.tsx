// @vitest-environment happy-dom
import { act, createElement } from "react";
import { createRoot } from "react-dom/client";
import { describe, expect, it, vi } from "vitest";
import {
  CoordinatorCtx,
  useCoordinator,
  type CRDNTSAPI
} from "./CoordinatorCtx";

describe("shared pointer coordinates", () => {
  it("updates all consumers from one mounted pointer lifecycle and cleans up", async () => {
    vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true);
    const readers: CRDNTSAPI[] = [];
    function Reader() {
      const pointer = useCoordinator((value) => value);
      readers.push(pointer);
      return null;
    }
    const container = document.createElement("div");
    document.body.appendChild(container);
    const root = createRoot(container);
    const addListener = vi.spyOn(document, "addEventListener");
    const removeListener = vi.spyOn(document, "removeEventListener");
    let unmounted = false;
    try {
      await act(() =>
        root.render(
          createElement(CoordinatorCtx, {
            children: [
              createElement(Reader, { key: "cursor" }),
              createElement(Reader, { key: "scene" })
            ]
          })
        )
      );
      expect(readers[0].x).toBe(readers[1].x);
      expect(readers[0].y).toBe(readers[1].y);
      expect(readers[0].x.get()).toBe(window.innerWidth / 2);
      expect(
        addListener.mock.calls.filter(([event]) => event === "pointermove")
      ).toHaveLength(1);
      document.dispatchEvent(
        new PointerEvent("pointermove", { clientX: 71, clientY: 83 })
      );
      expect(readers[0].x.get()).toBe(71);
      expect(readers[1].y.get()).toBe(83);
      await act(() => root.unmount());
      unmounted = true;
      expect(
        removeListener.mock.calls.filter(([event]) => event === "pointermove")
      ).toHaveLength(1);
      document.dispatchEvent(
        new PointerEvent("pointermove", { clientX: 100, clientY: 200 })
      );
      expect(readers[0].x.get()).toBe(71);
      expect(readers[1].y.get()).toBe(83);
    } finally {
      if (!unmounted) await act(() => root.unmount());
      container.remove();
      vi.unstubAllGlobals();
      vi.restoreAllMocks();
    }
  });
});
