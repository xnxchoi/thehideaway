// @vitest-environment happy-dom

import { act } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, describe, expect, it, vi } from "vitest";
import { AUTH_LAB_CASES } from "./cases";

(globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT: boolean })
  .IS_REACT_ACT_ENVIRONMENT = true;

vi.mock("./actions", () => ({
  runAuthLabAction: vi.fn()
}));

afterEach(() => {
  document.body.innerHTML = "";
});

describe("DevAuthLab", () => {
  it("exposes a button for every catalogued auth case", async () => {
    const { DevAuthLab } = await import("./DevAuthLab");
    const container = document.createElement("div");
    document.body.append(container);
    const root = createRoot(container);

    await act(async () => {
      root.render(<DevAuthLab />);
    });

    expect(container.querySelector("[data-auth-lab='true']")).not.toBeNull();
    for (const row of AUTH_LAB_CASES) {
      expect(container.textContent).toContain(row.label);
    }
  });
});
