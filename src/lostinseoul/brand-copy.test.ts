import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

type TranslationTree = Record<string, string | TranslationTree>;

function readMessages(locale: "en" | "ko") {
  return JSON.parse(
    readFileSync(join(process.cwd(), "messages", `${locale}.json`), "utf8")
  ).LOSTINSEOUL as TranslationTree;
}

function collectStrings(value: TranslationTree | string): string[] {
  if (typeof value === "string") return [value];

  return Object.values(value).flatMap((entry) => collectStrings(entry));
}

describe("LOSTINSEOUL brand copy contract", () => {
  it("keeps route metadata inside the LOSTINSEOUL message namespace", () => {
    const pageSource = readFileSync(
      join(process.cwd(), "src/app/(frontend)/(site)/lostinseoul/page.tsx"),
      "utf8"
    );
    const en = readMessages("en");
    const ko = readMessages("ko");

    expect(pageSource).toContain("generateMetadata");
    expect(pageSource).not.toContain("export const metadata");
    expect(en.meta).toMatchObject({
      description: expect.any(String),
      title: expect.any(String)
    });
    expect(ko.meta).toMatchObject({
      description: expect.any(String),
      title: expect.any(String)
    });
  });

  it("does not ship prototype Korean homepage and navigation copy", () => {
    const ko = readMessages("ko");
    const homepageCopy = [
      ...collectStrings(ko.nav as TranslationTree),
      ...collectStrings(ko.home as TranslationTree)
    ];

    expect(homepageCopy).not.toEqual(
      expect.arrayContaining([
        "...",
        "--- - - --- -",
        "A RESTORED PROJECT™",
        "Archives",
        "BACK",
        "CART",
        "En Route",
        "Limited Runs",
        "LOST WITH CARE",
        "Products",
        "Restorations",
        "Selected Objects",
        "Shop"
      ])
    );
  });
});
