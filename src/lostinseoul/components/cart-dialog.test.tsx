// @vitest-environment happy-dom
import { act, useState } from "react";
import { createRoot } from "react-dom/client";
import { createPortal } from "react-dom";
import { NextIntlClientProvider } from "next-intl";
import { expect, it, vi } from "vitest";
import { CartDialog } from "./cart-dialog";

it("names the cart modal, contains focus, dismisses with Escape and restores the opener", async () => {
  (
    globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT: boolean }
  ).IS_REACT_ACT_ENVIRONMENT = true;
  const container = document.createElement("div");
  document.body.append(container);
  const root = createRoot(container);
  function Harness() {
    const [open, setOpen] = useState(false);
    return (
      <NextIntlClientProvider
        locale="ko"
        messages={{ LOSTINSEOUL: { cart: { title: "카트" } } }}
      >
        <button onClick={() => setOpen(true)}>Open cart</button>
        {open
          ? createPortal(
              <CartDialog active onClose={() => setOpen(false)}>
                <button>Inside cart</button>
              </CartDialog>,
              document.body
            )
          : null}
      </NextIntlClientProvider>
    );
  }
  try {
    await act(async () => root.render(<Harness />));
    const opener = container.querySelector<HTMLButtonElement>("button")!;
    opener.focus();
    await act(async () => opener.click());
    const dialog = document.querySelector<HTMLElement>('[role="dialog"]')!;
    expect(dialog.getAttribute("aria-label")).toBe("카트");
    expect(dialog.getAttribute("aria-modal")).toBe("true");
    expect(dialog.contains(document.activeElement)).toBe(true);
    expect(
      container.getAttribute("inert") !== null ||
        container.getAttribute("aria-hidden") === "true"
    ).toBe(true);
    await act(async () =>
      dialog.dispatchEvent(
        new KeyboardEvent("keydown", { key: "Escape", bubbles: true })
      )
    );
    expect(document.querySelector('[role="dialog"]')).toBeNull();
    expect(document.activeElement).toBe(opener);
    expect(container.getAttribute("inert")).toBeNull();
  } finally {
    await act(async () => root.unmount());
    container.remove();
    vi.restoreAllMocks();
  }
});
