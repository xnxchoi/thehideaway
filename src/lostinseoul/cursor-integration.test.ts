import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const here = dirname(fileURLToPath(import.meta.url));
const read = (path: string) => readFileSync(join(here, path), "utf8");
const app = (...parts: string[]) =>
  readFileSync(
    join(here, "../app/(frontend)/(site)/lostinseoul", ...parts),
    "utf8"
  );

describe("cursor integration", () => {
  it("uses the global route theme cursor without a pointer-move bridge", () => {
    expect(read("components.tsx")).not.toContain("LostCursorBridge");
    expect(read("storefront.tsx")).not.toContain("<LostCursorBridge />");
    expect(app("fragrance/page.client.tsx")).not.toContain(
      "<LostCursorBridge />"
    );
    expect(app("products/[slug]/product.client.tsx")).not.toContain(
      "<LostCursorBridge />"
    );
  });

  it("does not override global cursor colors inside commerce CSS", () => {
    const css = read("index.css");
    expect(css).not.toContain('.rp__cursor[data-theme="light"]');
    expect(css).not.toContain('.rp__cursor[data-theme="dark"]');
  });
});
