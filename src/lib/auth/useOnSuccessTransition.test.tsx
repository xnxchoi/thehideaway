// @vitest-environment happy-dom

import { act, useEffect } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, describe, expect, it, vi } from "vitest";

import { useOnSuccessTransition } from "./useOnSuccessTransition";

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

vi.mock("@/lib/auth/client", () => ({
  authClient: {
    useSession: () => ({ refetch: vi.fn() })
  }
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn()
  })
}));

afterEach(() => {
  transition.isPending = false;
  transition.start.mockClear();
  document.body.innerHTML = "";
});

describe("useOnSuccessTransition", () => {
  it("navigates once even while the session-refresh transition is pending", async () => {
    const navigate = vi.fn();
    const refetch = vi.fn().mockResolvedValue(undefined);
    let onSuccess: (() => Promise<void>) | undefined;

    function Harness({ revision }: { revision: number }) {
      const transitionResult = useOnSuccessTransition({
        redirectTo: "/me",
        navigate,
        refetchSession: refetch
      });

      useEffect(() => {
        onSuccess = transitionResult.onSuccess;
      }, [revision, transitionResult.onSuccess]);

      return null;
    }

    const container = document.createElement("div");
    document.body.append(container);
    const root = createRoot(container);

    const render = async (revision: number) => {
      await act(async () => {
        root.render(<Harness revision={revision} />);
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

    transition.isPending = false;
    await render(2);

    expect(navigate).toHaveBeenCalledOnce();

    await act(async () => root.unmount());
  });
});
