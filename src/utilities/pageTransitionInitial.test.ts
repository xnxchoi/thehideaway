import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  __resetDocumentHydratedForTests,
  commitPageTransitionPath,
  consumeHydrationSafeInitial
} from "./pageTransitionInitial";

beforeEach(() => {
  vi.stubGlobal("window", {
    document: { createElement: () => ({}) }
  });
  __resetDocumentHydratedForTests();
});

afterEach(() => {
  vi.unstubAllGlobals();
  __resetDocumentHydratedForTests();
});

describe("pageTransitionInitial", () => {
  it("skips the none variant for every remount of the first document path", () => {
    expect(consumeHydrationSafeInitial("/")).toBe(true);
    expect(consumeHydrationSafeInitial("/")).toBe(true);
    expect(consumeHydrationSafeInitial("/")).toBe(true);
  });

  it("animates from none only after the document leaves the first path", () => {
    expect(consumeHydrationSafeInitial("/")).toBe(true);
    commitPageTransitionPath("/");
    expect(consumeHydrationSafeInitial("/essays/hello")).toBe(false);
    commitPageTransitionPath("/essays/hello");
    expect(consumeHydrationSafeInitial("/")).toBe(false);
  });

  it("does not replay entry for same-path remounts after navigation", () => {
    expect(consumeHydrationSafeInitial("/")).toBe(true);
    commitPageTransitionPath("/");
    expect(consumeHydrationSafeInitial("/essays/hello")).toBe(false);
    expect(consumeHydrationSafeInitial("/essays/hello")).toBe(false);
    commitPageTransitionPath("/essays/hello");
    expect(consumeHydrationSafeInitial("/essays/hello")).toBe(true);
    expect(consumeHydrationSafeInitial("/")).toBe(false);
  });

  it("always skips none during SSR where window has no document", () => {
    vi.unstubAllGlobals();
    __resetDocumentHydratedForTests();
    expect(consumeHydrationSafeInitial("/")).toBe(true);
    expect(consumeHydrationSafeInitial("/essays/hello")).toBe(true);
  });
});
