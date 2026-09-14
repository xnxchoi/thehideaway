import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const source = readFileSync(
  new URL(
    "./migrations-baseline/20260831_120000_uncategorized_category.ts",
    import.meta.url
  ),
  "utf8"
);
const indexSource = readFileSync(
  new URL("./migrations-baseline/index.ts", import.meta.url),
  "utf8"
);

describe("uncategorized category seed migration", () => {
  it("inserts the default bucket only when missing", () => {
    expect(source).toContain('"slug"');
    expect(source).toContain("uncategorized");
    expect(source).toContain("Uncategorized");
    expect(source).toMatch(/WHERE NOT EXISTS/i);
  });

  it("is registered in the baseline index", () => {
    expect(indexSource).toContain("20260831_120000_uncategorized_category");
  });
});
