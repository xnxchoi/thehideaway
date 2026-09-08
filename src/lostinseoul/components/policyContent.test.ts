import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const en = JSON.parse(
  readFileSync(join(process.cwd(), "messages/en.json"), "utf8")
);
const ko = JSON.parse(
  readFileSync(join(process.cwd(), "messages/ko.json"), "utf8")
);

const REQUIRED_LEGAL_SECTIONS = {
  privacy: ["scope", "data", "use", "sharing", "rights", "contact"],
  terms: ["service", "orders", "payment", "limits", "changes", "contact"],
  refund: ["window", "custom", "shipping", "process", "exceptions", "contact"]
} as const;

describe("legal copy", () => {
  it.each([
    ["en", en],
    ["ko", ko]
  ])("ships complete %s legal copy", (_locale, messages) => {
    const legal = messages.LOSTINSEOUL.legal;

    expect(legal.eyebrow).toBeTruthy();
    expect(legal.contents).toBeTruthy();
    expect(legal.relatedLabel).toBeTruthy();
    expect(legal.backToShop).toBeTruthy();

    for (const [kind, sections] of Object.entries(REQUIRED_LEGAL_SECTIONS)) {
      const page = legal.pages[kind];

      expect(page.metaTitle).toBeTruthy();
      expect(page.metaDescription).toBeTruthy();
      expect(page.eyebrow).toBeTruthy();
      expect(page.title).toBeTruthy();
      expect(page.lede).toBeTruthy();
      expect(page.lastUpdatedLabel).toBeTruthy();
      expect(page.lastUpdated).toMatch(/^\d{4}-\d{2}-\d{2}$/);

      for (const section of sections) {
        expect(page.sections[section].title).toBeTruthy();
        expect(page.sections[section].body).toBeTruthy();
      }
    }

    for (const relatedKind of Object.keys(REQUIRED_LEGAL_SECTIONS)) {
      expect(legal.related[relatedKind]).toBeTruthy();
    }
  });
});
