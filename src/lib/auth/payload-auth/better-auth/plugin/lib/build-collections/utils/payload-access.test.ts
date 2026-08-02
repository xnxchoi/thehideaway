import { describe, expect, it, vi } from "vitest";
import {
  hasAdminRoles,
  isAdminOrCurrentUserUpdateWithAllowedFields,
  isAdminWithRoles
} from "./payload-access";

describe("Payload Better Auth access helpers", () => {
  it("revokes role-based authority from banned admins", () => {
    const req = {
      user: { id: "admin-1", role: "admin", banned: true }
    };

    expect(hasAdminRoles(["admin"])({ req } as never)).toBe(false);
    expect(isAdminWithRoles({ adminRoles: ["admin"] })({ req } as never)).toBe(
      false
    );
  });

  it("accepts an allowed self-service field without widening the allowlist", async () => {
    const allowedFields = ["name", "link"];
    const access = isAdminOrCurrentUserUpdateWithAllowedFields({
      adminRoles: ["admin"],
      allowedFields,
      userSlug: "users"
    });
    const req = {
      user: { id: "user-1", role: "user", email: "user@example.com" },
      payload: { login: vi.fn() }
    };

    await expect(
      access({
        req,
        id: "user-1",
        data: { link: "https://example.com" }
      } as never)
    ).resolves.toBe(true);
    expect(allowedFields).toEqual(["name", "link"]);
  });

  it("rejects a self-service update containing any protected field", async () => {
    const access = isAdminOrCurrentUserUpdateWithAllowedFields({
      adminRoles: ["admin"],
      allowedFields: ["name", "link"],
      userSlug: "users"
    });

    await expect(
      access({
        req: { user: { id: "user-1", role: "user" } },
        id: "user-1",
        data: { link: "https://example.com", role: "admin" }
      } as never)
    ).resolves.toBe(false);
  });

  it("checks every configured self-service and protected field independently", async () => {
    const allowedFields = [
      "name",
      "image",
      "portrait",
      "bio",
      "displayUsername",
      "slug",
      "location",
      "link",
      "firstName",
      "lastName",
      "collections",
      "bookmarks"
    ];
    const access = isAdminOrCurrentUserUpdateWithAllowedFields({
      adminRoles: ["admin"],
      allowedFields,
      userSlug: "users"
    });
    const req = {
      user: { id: "user-1", role: "user" },
      payload: { login: vi.fn() }
    };

    for (const field of allowedFields) {
      await expect(
        access({
          req,
          id: "user-1",
          data: { [field]: "updated" }
        } as never)
      ).resolves.toBe(true);
    }

    for (const field of [
      "id",
      "email",
      "emailVerified",
      "username",
      "role",
      "verified",
      "onboarded",
      "banned",
      "banReason",
      "banExpires",
      "twoFactorEnabled",
      "normalizedEmail",
      "phoneNumber",
      "phoneNumberVerified",
      "isAnonymous",
      "stripeCustomerId",
      "createdAt",
      "updatedAt"
    ]) {
      await expect(
        access({
          req,
          id: "user-1",
          data: { [field]: "forbidden" }
        } as never)
      ).resolves.toBe(false);
    }
  });
});
