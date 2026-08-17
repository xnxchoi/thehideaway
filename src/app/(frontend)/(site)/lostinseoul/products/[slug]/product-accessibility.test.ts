import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const source = readFileSync(
  new URL("./product.client.tsx", import.meta.url),
  "utf8"
);

describe("LOSTINSEOUL product accessibility", () => {
  it("exposes the selected order mode", () => {
    expect(source).toContain("aria-pressed={mode === item}");
  });

  it("labels the private quote note field", () => {
    expect(source).toContain("aria-label={labels.privateQuote}");
  });

  it("renders plain product information inline without collapsed accordions", () => {
    expect(source).toContain("<h3>{item.label}</h3>");
    expect(source).toContain("{item.body ? <p>{item.body}</p> : null}");
    expect(source).not.toContain("<details");
  });

  it("reserves the detail panel for rich product content", () => {
    expect(source).toContain("panelContent: product.description");
    expect(source).toContain("item.body || item.panelContent");
    expect(source).toContain("<ProductDetailPanel");
    expect(source).toContain("data-panel-detail-container");
  });

  it("gives long product titles and prices separate responsive tracks", () => {
    expect(source).toContain("lg:grid-cols-[minmax(0,1fr)_auto]");
    expect(source).toContain("whitespace-nowrap");
  });
});
