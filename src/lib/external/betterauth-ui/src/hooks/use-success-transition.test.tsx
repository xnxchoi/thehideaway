// @vitest-environment happy-dom

import { act, useEffect } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, describe, expect, it, vi } from "vitest";

import { AuthUIContext } from "../lib/auth-ui-provider";
import { useOnSuccessTransition } from "./use-success-transition";

(globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT: boolean })
  .IS_REACT_ACT_ENVIRONMENT = true;

const transition = vi.hoisted(() => ({
  isPending: false,
  start: vi.fn((callback: () => void) => callback())
}));

vi.mock("react", async (importOriginal) => {
  const actual = await importOriginal<typeof import("react")>();

  return {
    ...actual,
    useTransition: () => [transition.isPending, transition.start] as const
  };
});

vi.mock("../lib/auth-ui-provider", async () => {
  const { createContext } = await import("react");

  return { AuthUIContext: createContext({}) };
});

afterEach(() => {
  transition.isPending = false;
  transition.start.mockClear();
  document.body.innerHTML = "";
});

describe("useOnSuccessTransition", () => {
  it("navigates once even while the session-refresh transition is pending", async () => {
    const navigate = vi.fn();
    const onSessionChange = vi.fn();
    const refetch = vi.fn().mockResolvedValue(undefined);
    let onSuccess: (() => Promise<void>) | undefined;

    function Harness({ revision }: { revision: number }) {
      const transitionResult = useOnSuccessTransition({ redirectTo: "/me" });

      useEffect(() => {
        onSuccess = transitionResult.onSuccess;
      }, [revision, transitionResult.onSuccess]);

      return null;
    }

    const context = {
      redirectTo: "/",
      navigate,
      onSessionChange,
      hooks: { useSession: () => ({ refetch }) }
    };
    const container = document.createElement("div");
    document.body.append(container);
    const root = createRoot(container);

    const render = async (revision: number) => {
      await act(async () => {
        root.render(
          <AuthUIContext.Provider value={context as never}>
            <Harness revision={revision} />
          </AuthUIContext.Provider>
        );
      });
    };

    await render(0);
    transition.isPending = true;
    await render(1);

    await act(async () => {
      await onSuccess?.();
    });

    expect(refetch).toHaveBeenCalledOnce();
    expect(navigate).toHaveBeenCalledOnce();
    expect(navigate).toHaveBeenCalledWith("/me");
    expect(onSessionChange).not.toHaveBeenCalled();

    transition.isPending = false;
    await render(2);

    expect(navigate).toHaveBeenCalledOnce();

    await act(async () => root.unmount());
  });
});
