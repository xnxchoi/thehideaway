import { Suspense, use } from "react";
import { renderToReadableStream } from "react-dom/server";
import { afterEach, describe, expect, it, vi } from "vitest";
import { CartSession } from "./cart-session";

afterEach(() => vi.unstubAllGlobals());

describe("cart session streaming SSR", () => {
  it.each([undefined, null, "account"])(
    "streams async catalog children while identity %s is unresolved",
    async (userId) => {
      const network = vi.fn();
      vi.stubGlobal("fetch", network);
      let resolveRequest!: (value: string) => void;
      const request = new Promise<string>((resolve) => {
        resolveRequest = resolve;
      });
      function Catalog() {
        const marker = use(request);
        return <article>Catalog request {marker}</article>;
      }
      const streaming = renderToReadableStream(
        <CartSession userId={userId}>
          <Suspense fallback={<p>Catalog pending</p>}>
            <Catalog />
          </Suspense>
        </CartSession>
      );
      resolveRequest("request-bound-data");
      const stream = await streaming;
      await stream.allReady;
      const html = await new Response(stream).text();
      expect(html).toContain("request-bound-data");
      expect(html).not.toContain('hidden=""');
      expect(network).not.toHaveBeenCalled();
    }
  );
});
