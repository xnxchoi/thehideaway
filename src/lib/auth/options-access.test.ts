import type { CollectionConfig } from "payload";
import { describe, expect, it, vi } from "vitest";

const sendEmailChangeConfirmation = vi.fn(async () => undefined);
const sendOTP = vi.fn(async () => undefined);

vi.mock("@/lib/email/better-auth-integration", () => ({
  BetterAuthEmailService: class BetterAuthEmailService {
    sendEmailChangeConfirmation = sendEmailChangeConfirmation;
    sendOTP = sendOTP;
  },
  sendAdminInviteWithEmailService: vi.fn(async () => ({ success: true }))
}));
vi.mock("@/payload/fields/handle/formatUserHandle", () => ({
  formatUserHandle: (value: string) => value
}));
vi.mock("@/utilities/names", () => ({
  generateName: () => "User"
}));

describe("Better Auth Payload access overrides", () => {
  it("retains every configured Payload collection override", async () => {
    vi.stubEnv("NEXT_PUBLIC_BETTER_AUTH_URL", "https://hideaway.example");

    const { betterAuthPluginOptions } = await import("./options");

    expect(betterAuthPluginOptions.users.collectionOverrides).toBeTypeOf(
      "function"
    );
    expect(betterAuthPluginOptions.accounts.collectionOverrides).toBeTypeOf(
      "function"
    );
    expect(betterAuthPluginOptions.sessions.collectionOverrides).toBeTypeOf(
      "function"
    );
    expect(
      betterAuthPluginOptions.verifications.collectionOverrides
    ).toBeTypeOf("function");
    expect(betterAuthPluginOptions.users.allowedFields).toContain("link");
  });

  it("sends email-change confirmation to the existing address", async () => {
    vi.stubEnv("NEXT_PUBLIC_BETTER_AUTH_URL", "https://hideaway.example");

    const { betterAuthOptions } = await import("./options");
    const sendConfirmation =
      betterAuthOptions.user?.changeEmail?.sendChangeEmailConfirmation;

    await sendConfirmation?.({
      user: { email: "current@example.com" },
      newEmail: "replacement@example.com",
      url: "https://hideaway.example/api/auth/verify-email?token=change",
      token: "change"
    } as never);

    expect(sendEmailChangeConfirmation).toHaveBeenCalledWith(
      "current@example.com",
      "replacement@example.com",
      "https://hideaway.example/api/auth/verify-email?token=change"
    );
    expect(sendOTP).not.toHaveBeenCalled();
  });

  it("declares every self-service profile field in the Better Auth server schema", async () => {
    vi.stubEnv("NEXT_PUBLIC_BETTER_AUTH_URL", "https://hideaway.example");

    const { betterAuthOptions } = await import("./options");
    const fields = betterAuthOptions.user?.additionalFields;

    expect(Object.keys(fields ?? {})).toEqual(
      expect.arrayContaining([
        "role",
        "firstName",
        "lastName",
        "bio",
        "location",
        "link",
        "portrait",
        "slug",
        "onboarded",
        "verified"
      ])
    );
    expect(fields?.role).toMatchObject({ defaultValue: "user", input: false });
    expect(fields?.onboarded).toMatchObject({ input: false });
    expect(fields?.verified).toMatchObject({ input: false });
    expect(fields?.bio).not.toMatchObject({ input: false });
    expect(fields?.link).not.toMatchObject({ input: false });
  });

  it("allows authenticated, non-banned users into the authoring interface", async () => {
    vi.stubEnv("NEXT_PUBLIC_BETTER_AUTH_URL", "https://hideaway.example");

    const { betterAuthPluginOptions } = await import("./options");
    const collectionOverrides =
      betterAuthPluginOptions.users.collectionOverrides;

    const collection = {
      slug: "users",
      access: {},
      admin: {}
    } as unknown as CollectionConfig;

    const result = collectionOverrides({ collection } as never);
    const adminAccess = result.access?.admin;

    expect(adminAccess?.({ req: { user: null } } as never)).toBe(false);
    expect(
      adminAccess?.({
        req: { user: { id: "author-1", role: "author", banned: false } }
      } as never)
    ).toBe(true);
    expect(
      adminAccess?.({
        req: { user: { id: "author-1", role: "author", banned: true } }
      } as never)
    ).toBe(false);
  });

  it("composes banned-user checks with the bridge's allowlisted writes", async () => {
    vi.stubEnv("NEXT_PUBLIC_BETTER_AUTH_URL", "https://hideaway.example");

    const { betterAuthPluginOptions } = await import("./options");
    const update = vi.fn(() => ({ id: { equals: "author-1" } }));
    const remove = vi.fn(() => ({ id: { equals: "author-1" } }));
    const result = betterAuthPluginOptions.users.collectionOverrides({
      collection: {
        slug: "users",
        access: { update, delete: remove },
        admin: {}
      } as unknown as CollectionConfig
    } as never);

    const authorArgs = {
      req: { user: { id: "author-1", role: "author", banned: false } }
    };
    expect(result.access?.update?.(authorArgs as never)).toEqual({
      id: { equals: "author-1" }
    });
    expect(result.access?.delete?.(authorArgs as never)).toBe(false);

    const bannedArgs = {
      req: { user: { id: "author-1", role: "author", banned: true } }
    };
    expect(result.access?.update?.(bannedArgs as never)).toBe(false);
    expect(result.access?.delete?.(bannedArgs as never)).toBe(false);
    expect(
      result.access?.delete?.({
        req: {
          context: { "payload-db-adapter": { operation: "deleteByID" } },
          user: null
        }
      } as never)
    ).toBe(true);
  });

  it("lets editors manage lower-tier users without touching staff or assigning staff roles", async () => {
    vi.stubEnv("NEXT_PUBLIC_BETTER_AUTH_URL", "https://hideaway.example");

    const { betterAuthPluginOptions } = await import("./options");
    const result = betterAuthPluginOptions.users.collectionOverrides({
      collection: {
        slug: "users",
        access: {
          read: ({ req }: any) => ({ id: { equals: req.user?.id } }),
          update: ({ req, id }: any) =>
            req.user?.role === "admin" || id === req.user?.id,
          create: ({ req }: any) => req.user?.role === "admin",
          delete: ({ req }: any) => req.user?.role === "admin"
        },
        admin: {}
      } as unknown as CollectionConfig
    } as never);
    const editorReq = {
      user: { id: "editor-1", role: "editor", banned: false },
      payload: {}
    };

    expect(result.access?.read?.({ req: editorReq } as never)).toEqual({
      or: [
        { id: { equals: "editor-1" } },
        {
          role: {
            in: ["author", "patron", "resident", "user"]
          }
        }
      ]
    });
    expect(
      result.access?.update?.({
        req: editorReq,
        id: "user-1",
        data: { bio: "Updated", role: "author" }
      } as never)
    ).toEqual({
      and: [
        { id: { equals: "user-1" } },
        { role: { in: ["author", "patron", "resident", "user"] } }
      ]
    });
    expect(
      result.access?.update?.({
        req: editorReq,
        id: "admin-1",
        data: { bio: "Nope" }
      } as never)
    ).toEqual({
      and: [
        { id: { equals: "admin-1" } },
        { role: { in: ["author", "patron", "resident", "user"] } }
      ]
    });
    expect(
      await result.access?.update?.({
        req: editorReq,
        id: "user-1",
        data: { role: "admin" }
      } as never)
    ).toBe(false);
    expect(
      await result.access?.update?.({
        req: editorReq,
        id: "user-1",
        data: { emailVerified: true }
      } as never)
    ).toBe(false);
  });

  it("enforces the editor field allowlist one field at a time", async () => {
    vi.stubEnv("NEXT_PUBLIC_BETTER_AUTH_URL", "https://hideaway.example");

    const { betterAuthPluginOptions } = await import("./options");
    const result = betterAuthPluginOptions.users.collectionOverrides({
      collection: {
        slug: "users",
        access: { update: () => false },
        admin: {}
      } as unknown as CollectionConfig
    } as never);
    const req = {
      user: { id: "editor-1", role: "editor", banned: false },
      payload: {}
    };
    const allowed: Record<string, unknown> = {
      name: "Display Name",
      image: "https://example.com/image.jpg",
      portrait: "portrait-id",
      bio: "Biography",
      displayUsername: "Display",
      slug: "display",
      location: "Seoul",
      link: "https://example.com",
      firstName: "First",
      lastName: "Last",
      role: "author"
    };
    const protectedFields = [
      "id",
      "email",
      "emailVerified",
      "username",
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
      "updatedAt",
      "collections",
      "bookmarks"
    ];

    for (const [field, value] of Object.entries(allowed)) {
      expect(
        result.access?.update?.({
          req,
          id: "user-1",
          data: { [field]: value }
        } as never)
      ).toEqual({
        and: [
          { id: { equals: "user-1" } },
          { role: { in: ["author", "patron", "resident", "user"] } }
        ]
      });
    }
    for (const field of protectedFields) {
      expect(
        await result.access?.update?.({
          req,
          id: "user-1",
          data: { [field]: "forbidden" }
        } as never)
      ).toBe(false);
    }
  });

  it("keeps admin bulk operations and blocks every operation for banned admins", async () => {
    vi.stubEnv("NEXT_PUBLIC_BETTER_AUTH_URL", "https://hideaway.example");

    const { betterAuthPluginOptions } = await import("./options");
    const result = betterAuthPluginOptions.users.collectionOverrides({
      collection: {
        slug: "users",
        access: {
          create: ({ req }: any) => req.user?.role === "admin",
          read: ({ req }: any) => req.user?.role === "admin",
          update: ({ req }: any) => req.user?.role === "admin",
          delete: ({ req }: any) => req.user?.role === "admin"
        },
        admin: {}
      } as unknown as CollectionConfig
    } as never);
    const adminReq = {
      user: { id: "admin-1", role: "admin", banned: false }
    };
    const bannedAdminReq = {
      user: { id: "admin-1", role: "admin", banned: true }
    };

    expect(result.access?.create?.({ req: adminReq } as never)).toBe(true);
    expect(result.access?.read?.({ req: adminReq } as never)).toBe(true);
    expect(result.access?.update?.({ req: adminReq } as never)).toBe(true);
    expect(result.access?.delete?.({ req: adminReq } as never)).toBe(true);

    expect(result.access?.create?.({ req: bannedAdminReq } as never)).toBe(
      false
    );
    expect(result.access?.read?.({ req: bannedAdminReq } as never)).toBe(false);
    expect(result.access?.update?.({ req: bannedAdminReq } as never)).toBe(
      false
    );
    expect(result.access?.delete?.({ req: bannedAdminReq } as never)).toBe(
      false
    );
  });
});
