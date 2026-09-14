import { describe, expect, it } from "vitest";
import { isEntryPath, isShopChromePath } from "./routes";

describe("lostinseoul route chrome", () => {
  it("shows shop chrome on catalog routes only", () => {
    expect(isShopChromePath("/lostinseoul")).toBe(true);
    expect(isShopChromePath("/lostinseoul/products/coat")).toBe(true);
    expect(isShopChromePath("/lostinseoul/privacy")).toBe(true);
    expect(isShopChromePath("/lostinseoul/cart")).toBe(false);
    expect(isShopChromePath("/lostinseoul/checkout")).toBe(false);
    expect(isShopChromePath("/lostinseoul/payment/success")).toBe(false);
    expect(isShopChromePath("/lostinseoul/gate")).toBe(false);
    expect(isShopChromePath("/lostinseoul/auth/sign-in")).toBe(false);
    expect(isShopChromePath("/lostinseoul/orders/abc")).toBe(false);
  });

  it("runs the entry overlay only on home and collections", () => {
    expect(isEntryPath("/lostinseoul")).toBe(true);
    expect(isEntryPath("/lostinseoul/collections/drop")).toBe(true);
    expect(isEntryPath("/lostinseoul/products/coat")).toBe(false);
    expect(isEntryPath("/lostinseoul/cart")).toBe(false);
  });
});

describe("clean LOST chrome routes", () => {
  it.each([
    "/",
    "/products/coat",
    "/collections/archive",
    "/fragrance",
    "/policy/privacy"
  ])("keeps shop chrome on %s", (path) => {
    expect(isShopChromePath(path)).toBe(true);
  });
  it("keeps entry limited to home and collections", () => {
    expect(isEntryPath("/")).toBe(true);
    expect(isEntryPath("/collections/archive")).toBe(true);
    expect(isEntryPath("/products/coat")).toBe(false);
    expect(isShopChromePath("/checkout")).toBe(false);
    expect(isShopChromePath("/cart")).toBe(false);
  });
});
