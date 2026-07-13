import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

type CatalogValue = string | number | boolean | null | Catalog;
type Catalog = Record<string, CatalogValue>;

function readCatalog(locale: "en" | "ko"): Catalog {
  return JSON.parse(
    readFileSync(resolve(process.cwd(), `messages/${locale}.json`), "utf8")
  ) as Catalog;
}

function leafPaths(catalog: Catalog, prefix = ""): string[] {
  return Object.entries(catalog).flatMap(([key, value]) => {
    const path = prefix ? `${prefix}.${key}` : key;
    return value !== null && typeof value === "object"
      ? leafPaths(value, path)
      : [path];
  });
}

describe("message catalog parity", () => {
  it("keeps English and Korean field structures identical", () => {
    expect(leafPaths(readCatalog("ko")).sort()).toEqual(
      leafPaths(readCatalog("en")).sort()
    );
  });
});
