import { describe, expect, it } from "vitest";

import {
  documentHref,
  documentTitle,
  formatWorkDate,
  isVaultWorkCollection,
  lockTarget,
  lockerName,
  toWorkRow,
  vaultHomeLocale
} from "./home";

describe("vault work rows", () => {
  it("takes title, then slug, then id", () => {
    expect(documentTitle({ id: "1", title: "Essay" })).toBe("Essay");
    expect(documentTitle({ id: "1", slug: "essay" })).toBe("essay");
    expect(documentTitle({ id: "abc" })).toBe("abc");
  });

  it("builds an edit href under the admin route", () => {
    expect(documentHref("/vault", "posts", "abc")).toBe(
      "/vault/collections/posts/abc"
    );
  });

  it("only treats posts, surf, and pages as work collections", () => {
    expect(isVaultWorkCollection("posts")).toBe(true);
    expect(isVaultWorkCollection("users")).toBe(false);
    expect(lockTarget({ relationTo: "posts", value: "p1" })).toEqual({
      collection: "posts",
      id: "p1"
    });
    expect(lockTarget({ relationTo: "users", value: "u1" })).toBeNull();
  });

  it("reads a lock user name without inventing one", () => {
    expect(lockerName({ firstName: "Butler" })).toBe("Butler");
    expect(lockerName({ email: "butler@hideaway.dev" })).toBe(
      "butler@hideaway.dev"
    );
    expect(lockerName(null)).toBeUndefined();
  });

  it("drops documents without an id", () => {
    expect(toWorkRow({ title: "x" }, "posts", "/vault")).toBeNull();
    expect(toWorkRow({ id: "p1", title: "x", _status: "draft" }, "posts", "/vault"))
      .toMatchObject({
        collection: "posts",
        href: "/vault/collections/posts/p1",
        status: "draft",
        title: "x"
      });
  });

  it("formats dates as YYYY-MM-DD", () => {
    expect(formatWorkDate("2026-08-31T01:00:00.000Z")).toBe("2026-08-31");
    expect(formatWorkDate("not-a-date")).toBe("");
  });
});

describe("vaultHomeLocale", () => {
  it("follows the admin locale selector, not the site cookie", () => {
    expect(vaultHomeLocale("en")).toBe("en");
    expect(vaultHomeLocale("ko")).toBe("ko");
    expect(vaultHomeLocale(undefined)).toBe("en");
  });
});

describe("loadVaultHomeCatalog", () => {
  it("loads English Vault.home copy for admin locale en", async () => {
    const { loadVaultHomeCatalog, readVaultHomeString } = await import("./home");
    const catalog = await loadVaultHomeCatalog("en");
    expect(readVaultHomeString(catalog, "drafts")).toBe("Drafts");
    expect(readVaultHomeString(catalog, "emptyDrafts")).toBe("No drafts.");
  });

  it("loads Korean Vault.home copy for admin locale ko", async () => {
    const { loadVaultHomeCatalog, readVaultHomeString } = await import("./home");
    const catalog = await loadVaultHomeCatalog("ko");
    expect(readVaultHomeString(catalog, "drafts")).toBe("초안");
  });
});
