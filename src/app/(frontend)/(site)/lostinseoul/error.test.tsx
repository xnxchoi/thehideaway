// @vitest-environment happy-dom
import { act, createElement, type ReactNode } from "react";
import { createRoot, type Root } from "react-dom/client";
import { NextIntlClientProvider } from "next-intl";
import { afterEach, describe, expect, it, vi } from "vitest";
import en from "../../../../../messages/en.json";
import ko from "../../../../../messages/ko.json";

vi.mock("@/components/UX/Transition", () => ({
  RPage: ({ children }: { children: ReactNode }) =>
    createElement("main", null, children)
}));

import StoreError from "./error";

let root: Root | undefined;
afterEach(async () => {
  if (root) await act(() => root?.unmount());
  document.body.innerHTML = "";
  vi.unstubAllGlobals();
});

describe("storefront error recovery", () => {
  it.each([
    ["en", en, "Unable to load the store", "Try again"],
    ["ko", ko, "스토어를 불러올 수 없습니다", "다시 시도"]
  ] as const)(
    "shows a localized retry for %s without exposing server details",
    async (locale, messages, title, retry) => {
      vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true);
      const retryRequest = vi.fn();
      const container = document.createElement("div");
      document.body.append(container);
      root = createRoot(container);
      await act(() =>
        root?.render(
          createElement(NextIntlClientProvider, {
            locale,
            messages,
            timeZone: "Asia/Seoul",
            children: createElement(StoreError, {
              error: new Error("private database details"),
              retry: retryRequest
            })
          })
        )
      );
      expect(container.querySelector("h1")?.textContent).toBe(title);
      expect(container.textContent).not.toContain("private database details");
      const button = container.querySelector("button");
      expect(button?.textContent).toBe(retry);
      await act(() => button?.click());
      expect(retryRequest).toHaveBeenCalledOnce();
    }
  );
});
