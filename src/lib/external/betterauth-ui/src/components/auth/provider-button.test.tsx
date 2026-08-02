// @vitest-environment happy-dom

import { act } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, describe, expect, it, vi } from "vitest";

import { AuthUIContext } from "../../lib/auth-ui-provider";
import { ProviderButton } from "./provider-button";

(globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT: boolean })
  .IS_REACT_ACT_ENVIRONMENT = true;

vi.mock("../../lib/auth-ui-provider", async () => {
  const { createContext } = await import("react");

  return { AuthUIContext: createContext({}) };
});

vi.mock("../../lib/utils", () => ({
  getLocalizedError: () => "Authentication failed",
  getSearchParam: () => undefined
}));

vi.mock("../ui/button", () => ({
  Button: (props: React.ComponentProps<"button">) => <button {...props} />
}));

afterEach(() => {
  vi.useRealTimers();
  document.body.innerHTML = "";
});

describe("ProviderButton", () => {
  const provider = {
    provider: "google",
    name: "Google",
    icon: (props: React.SVGProps<SVGSVGElement>) => (
      <svg data-testid="provider-icon" {...props} />
    )
  };

  function setup({
    isSubmitting,
    signIn = vi.fn().mockResolvedValue(undefined),
    socialSignIn,
    localization = { SIGN_IN_WITH: "Sign in with" }
  }: {
    isSubmitting: boolean;
    signIn?: ReturnType<typeof vi.fn>;
    socialSignIn?: ReturnType<typeof vi.fn>;
    localization?: { SIGN_IN_WITH?: string };
  }) {
    const setIsSubmitting = vi.fn();
    const context = {
      authClient: { signIn: { social: signIn } },
      basePath: "/",
      baseURL: "",
      persistClient: false,
      redirectTo: "/me",
      social: socialSignIn ? { signIn: socialSignIn } : undefined,
      viewPaths: { CALLBACK: "callback" },
      toast: vi.fn()
    };
    const container = document.createElement("div");
    document.body.append(container);
    const root = createRoot(container);

    act(() => {
      root.render(
        <AuthUIContext.Provider value={context as never}>
          <ProviderButton
            isSubmitting={isSubmitting}
            localization={localization}
            provider={provider}
            redirectTo="/me"
            setIsSubmitting={setIsSubmitting}
            socialLayout="vertical"
          />
        </AuthUIContext.Provider>
      );
    });

    return {
      button: container.querySelector("button") as HTMLButtonElement,
      container,
      root,
      setIsSubmitting
    };
  }

  it("stays labeled while another authentication method is submitting", () => {
    const { button, container, root } = setup({ isSubmitting: true });

    expect(button.disabled).toBe(true);
    expect(button.textContent).toContain("Sign in with Google");
    expect(container.querySelector('[data-testid="provider-icon"]')).not.toBeNull();
    expect(container.querySelector(".animate-spin")).toBeNull();

    act(() => root.unmount());
  });

  it("shows a spinner only after its own provider is clicked", async () => {
    let resolveSignIn: (() => void) | undefined;
    const signIn = vi.fn(
      () => new Promise<void>((resolve) => (resolveSignIn = resolve))
    );
    const { button, container, root, setIsSubmitting } = setup({
      isSubmitting: false,
      signIn
    });

    await act(async () => {
      button.dispatchEvent(new MouseEvent("click", { bubbles: true }));
      await Promise.resolve();
    });

    expect(setIsSubmitting).toHaveBeenCalledWith(true);
    expect(button.disabled).toBe(true);
    expect(button.getAttribute("aria-label")).toBe("Sign in with Google");
    expect(button.getAttribute("aria-busy")).toBe("true");
    expect(container.querySelector(".animate-spin")).not.toBeNull();
    expect(container.querySelector('[data-testid="provider-icon"]')).toBeNull();

    await act(async () => {
      resolveSignIn?.();
      await Promise.resolve();
      root.unmount();
    });
  });

  it("cancels a custom-provider reset when the button unmounts", async () => {
    vi.useFakeTimers();
    const socialSignIn = vi.fn().mockResolvedValue(undefined);
    const { button, root, setIsSubmitting } = setup({
      isSubmitting: false,
      socialSignIn
    });

    await act(async () => {
      button.dispatchEvent(new MouseEvent("click", { bubbles: true }));
      await Promise.resolve();
    });
    act(() => root.unmount());
    await vi.advanceTimersByTimeAsync(10000);

    expect(setIsSubmitting).toHaveBeenCalledTimes(1);
    expect(setIsSubmitting).toHaveBeenNthCalledWith(1, true);
  });

  it("does not schedule a reset when custom sign-in resolves after unmount", async () => {
    vi.useFakeTimers();
    let resolveSignIn: (() => void) | undefined;
    const socialSignIn = vi.fn(
      () => new Promise<void>((resolve) => (resolveSignIn = resolve))
    );
    const { button, root, setIsSubmitting } = setup({
      isSubmitting: false,
      socialSignIn
    });

    await act(async () => {
      button.dispatchEvent(new MouseEvent("click", { bubbles: true }));
      await Promise.resolve();
    });
    act(() => root.unmount());
    await act(async () => {
      resolveSignIn?.();
      await Promise.resolve();
    });
    await vi.advanceTimersByTimeAsync(10000);

    expect(setIsSubmitting).toHaveBeenCalledTimes(1);
    expect(setIsSubmitting).toHaveBeenNthCalledWith(1, true);
  });

  it("falls back to the provider name when the localized prefix is absent", () => {
    const { button, root } = setup({
      isSubmitting: false,
      localization: {}
    });

    expect(button.getAttribute("aria-label")).toBe("Google");

    act(() => root.unmount());
  });
});
