import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";
import { describe, expect, it } from "vitest";

const SRC = join(process.cwd(), "src");

const BANNED = [
  "/api/lost/cart",
  "/api/lost/checkout",
  "/api/commerce/",
  "commerce-products",
  "commerce-orders",
  "product-carts"
] as const;

const RETIRED_TREE_PREFIXES = [
  "app/api/lost/cart/",
  "app/api/lost/checkout/",
  "app/api/commerce/",
  "lib/commerce/",
  "payload/collections/commerce/",
  "payload/collections/(consumption)/ProductCarts/",
  "payload/collections/(consumption)/ProductOrders/",
  "payload/collections/(consumption)/ProductPayments/"
];

function isTestFile(path: string): boolean {
  return (
    path.endsWith(".test.ts") ||
    path.endsWith(".test.tsx") ||
    path.endsWith(".postgres.test.ts") ||
    path.endsWith(".postgres.fixtures.ts")
  );
}

function walk(dir: string, files: string[] = []): string[] {
  for (const name of readdirSync(dir)) {
    if (name === "node_modules") continue;
    const full = join(dir, name);
    if (statSync(full).isDirectory()) walk(full, files);
    else if (/\.(ts|tsx|js|mjs|cjs)$/.test(name)) files.push(full);
  }
  return files;
}

function rel(path: string): string {
  return relative(SRC, path).split("\\").join("/");
}

function isAllowlistedFor(path: string, token: string): boolean {
  const file = rel(path);
  if (file === "payload/plugins/ecommerce/retire-proprietary.test.ts") {
    return true;
  }
  if (file === "proxy.ts" || file === "proxy.test.ts") {
    return (
      token === "/api/lost/cart" ||
      token === "/api/lost/checkout" ||
      token === "/api/commerce/"
    );
  }
  return false;
}

describe("Phase 8 proprietary product commerce retirement", () => {
  it("does not keep retired cart, checkout, or Stack A trees in src/", () => {
    const present = RETIRED_TREE_PREFIXES.filter((prefix) => {
      try {
        statSync(join(SRC, prefix));
        return true;
      } catch {
        return false;
      }
    });
    expect(present).toEqual([]);
  });

  it("keeps live source free of retired product HTTP and collection slugs", () => {
    const hits: string[] = [];
    for (const file of walk(SRC)) {
      if (isTestFile(file)) continue;
      const source = readFileSync(file, "utf8");
      for (const token of BANNED) {
        if (!source.includes(token)) continue;
        if (isAllowlistedFor(file, token)) continue;
        hits.push(`${rel(file)}: ${token}`);
      }
    }
    expect(hits).toEqual([]);
  });

  it("does not register proprietary product cart/order/payment collections", () => {
    const collections = readFileSync(
      join(SRC, "payload/collections/index.ts"),
      "utf8"
    );
    const plugins = readFileSync(join(SRC, "payload/plugins/index.ts"), "utf8");
    const membership = readFileSync(
      join(SRC, "payload/plugins/membership/plugin.ts"),
      "utf8"
    );
    for (const source of [collections, plugins, membership]) {
      expect(source).not.toContain("ProductCarts");
      expect(source).not.toContain("ProductOrders");
      expect(source).not.toContain("ProductPayments");
      expect(source).not.toContain("CommerceProducts");
      expect(source).not.toContain("CommerceOrders");
    }
  });
});
