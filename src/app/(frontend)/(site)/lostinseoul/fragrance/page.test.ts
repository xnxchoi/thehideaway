import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

describe("fragrance chapter Phase 7 cart wiring", () => {
  it("passes next-intl chrome labels and locale so the add-to-bag CTA can render", () => {
    const page = readFileSync(new URL("./page.tsx", import.meta.url), "utf8");
    expect(page).toContain("checkoutEnabled = true");
    expect(page).toContain("getLostFragranceData");
    expect(page).toContain("labels={{");
    expect(page).toContain("locale={locale}");
    expect(page).toContain("copy={{");
    expect(page).toContain("getLostBusinessFooterProps");
    expect(page).not.toContain('from "@payloadcms/translations"');
  });

  it("adds through useStoreCart and keeps product links on the LOSTINSEOUL route", () => {
    const client = readFileSync(
      new URL("./page.client.tsx", import.meta.url),
      "utf8"
    );
    expect(client).toContain("useStoreCart");
    expect(client).toContain("labels: ChromeLabels");
    expect(client).toContain('locale: "en" | "ko"');
    expect(client).toContain("Promise.resolve(");
    expect(client).toContain("add({");
    expect(client).toContain("href={`/lostinseoul/products/${product.slug}`}");
    expect(client).not.toContain("href={`/products/${product.slug}`}");
  });
});
