// @vitest-environment happy-dom
import { act } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, describe, expect, it, vi } from "vitest";
import {
  __resetDocumentHydratedForTests,
  commitPageTransitionPath
} from "@/utilities/pageTransitionInitial";
import { useEntrySequence } from "./entry-motion";

describe("LOST entry and tab focus", () => {
  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
    __resetDocumentHydratedForTests();
  });

  it("settles an interrupted entry while hidden and does not replay on focus", async () => {
    vi.useFakeTimers();
    (
      globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT: boolean }
    ).IS_REACT_ACT_ENVIRONMENT = true;
    const container = document.createElement("div");
    document.body.append(container);
    const root = createRoot(container);
    const Probe = () => <span data-phase={useEntrySequence(false)} />;
    try {
      await act(async () => root.render(<Probe />));
      expect(container.firstElementChild?.getAttribute("data-phase")).toBe(
        "loading"
      );
      vi.spyOn(document, "hidden", "get").mockReturnValue(true);
      await act(async () =>
        document.dispatchEvent(new Event("visibilitychange"))
      );
      expect(container.firstElementChild?.getAttribute("data-phase")).toBe(
        "ready"
      );
      vi.spyOn(document, "hidden", "get").mockReturnValue(false);
      await act(async () =>
        document.dispatchEvent(new Event("visibilitychange"))
      );
      expect(container.firstElementChild?.getAttribute("data-phase")).toBe(
        "ready"
      );
    } finally {
      await act(async () => root.unmount());
      container.remove();
    }
  });

  it("skips same-path remounts but preserves a genuine return navigation", async () => {
    (
      globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT: boolean }
    ).IS_REACT_ACT_ENVIRONMENT = true;
    const container = document.createElement("div");
    document.body.append(container);
    const Probe = () => (
      <span data-phase={useEntrySequence(false, true, "/lostinseoul")} />
    );
    const renderOnce = async () => {
      const root = createRoot(container);
      await act(async () => root.render(<Probe />));
      const phase = container.firstElementChild?.getAttribute("data-phase");
      await act(async () => root.unmount());
      return phase;
    };
    try {
      expect(await renderOnce()).toBe("loading");
      commitPageTransitionPath("/lostinseoul");
      expect(await renderOnce()).toBe("ready");
      commitPageTransitionPath("/");
      expect(await renderOnce()).toBe("loading");
    } finally {
      container.remove();
    }
  });

  it("skips the public root path after it is committed on the LOST host", async () => {
    (
      globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT: boolean }
    ).IS_REACT_ACT_ENVIRONMENT = true;
    commitPageTransitionPath("/");
    const container = document.createElement("div");
    document.body.append(container);
    const root = createRoot(container);
    const Probe = () => (
      <span data-phase={useEntrySequence(false, true, "/")} />
    );
    try {
      await act(async () => root.render(<Probe />));
      expect(container.firstElementChild?.getAttribute("data-phase")).toBe(
        "ready"
      );
    } finally {
      await act(async () => root.unmount());
      container.remove();
    }
  });
});
