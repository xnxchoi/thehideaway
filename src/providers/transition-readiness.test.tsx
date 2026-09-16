// @vitest-environment happy-dom
import { act, Suspense, use } from "react";
import { createRoot } from "react-dom/client";
import { renderToReadableStream, renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import {
  TransitionReadinessProvider,
  useTransitionReady
} from "./transition-readiness";

function Readiness() {
  return <output>{String(useTransitionReady())}</output>;
}

describe("transition startup readiness", () => {
  it("defaults to not ready outside the transition tree", () => {
    expect(renderToStaticMarkup(<Readiness />)).toContain("false");
  });

  it("streams request-bound children in a visible inert startup shell", async () => {
    let finish!: (value: string) => void;
    const request = new Promise<string>((resolve) => {
      finish = resolve;
    });
    function Content() {
      return <article>{use(request)}</article>;
    }
    const streaming = renderToReadableStream(
      <TransitionReadinessProvider ready={false}>
        <Readiness />
        <Suspense fallback={<p>Loading</p>}>
          <Content />
        </Suspense>
        <input aria-label="Email" />
        <button>Open cart</button>
      </TransitionReadinessProvider>
    );
    finish("Request-bound catalog");
    const stream = await streaming;
    await stream.allReady;
    const html = await new Response(stream).text();
    expect(html).toContain("Request-bound catalog");
    expect(html).toContain('inert=""');
    expect(html).toContain("display:contents");
    expect(html).not.toContain('hidden=""');
  });

  it("releases controls only in the final tree and preserves later input", async () => {
    (
      globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT: boolean }
    ).IS_REACT_ACT_ENVIRONMENT = true;
    const container = document.createElement("div");
    document.body.append(container);
    const root = createRoot(container);
    const clicked = vi.fn();
    const content = (
      <>
        <Readiness />
        <input aria-label="Email" />
        <button onClick={clicked}>Open cart</button>
      </>
    );
    const tree = (ready: boolean) => (
      <TransitionReadinessProvider ready={ready}>
        {ready ? <main>{content}</main> : content}
      </TransitionReadinessProvider>
    );
    try {
      await act(async () => root.render(tree(false)));
      expect(
        container.querySelector("input")?.closest("[inert]")
      ).not.toBeNull();
      expect(
        container.querySelector("button")?.closest("[inert]")
      ).not.toBeNull();
      expect(container.querySelector("output")?.textContent).toBe("false");
      // Native inert focus/typing behavior requires the browser regression lane.
      await act(async () => root.render(tree(true)));
      const input = container.querySelector("input")!;
      expect(container.querySelector("[inert]")).toBeNull();
      expect(container.querySelector("output")?.textContent).toBe("true");
      input.value = "reader@example.test";
      await act(async () => container.querySelector("button")!.click());
      await act(async () => root.render(tree(true)));
      expect(container.querySelector("input")).toBe(input);
      expect(input.value).toBe("reader@example.test");
      expect(clicked).toHaveBeenCalledOnce();
    } finally {
      await act(async () => root.unmount());
      container.remove();
    }
  });
});
