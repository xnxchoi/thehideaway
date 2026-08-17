import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const read = (path: string) => readFileSync(join(__dirname, path), "utf8");

describe("LOST cursor integration", () => {
  it("uses the global route theme cursor without a pointer-move bridge", () => {
    expect(read("components.tsx")).not.toContain("LostCursorBridge");
    expect(read("storefront.tsx")).not.toContain("<LostCursorBridge />");
    expect(read("fragrance/page.client.tsx")).not.toContain(
      "<LostCursorBridge />"
    );
    expect(read("products/[slug]/product.client.tsx")).not.toContain(
      "<LostCursorBridge />"
    );
  });

  it("does not override global cursor colors inside LOST commerce", () => {
    const css = read("index.css");

    expect(css).not.toContain('.rp__cursor[data-theme="light"]');
    expect(css).not.toContain('.rp__cursor[data-theme="dark"]');
  });
});
