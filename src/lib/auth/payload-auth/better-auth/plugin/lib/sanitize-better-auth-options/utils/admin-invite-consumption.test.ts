import { describe, expect, it, vi } from "vitest";

import { hashAdminInviteToken } from "../../admin-invite-security";
import { useAdminInviteAfterEmailSignUpMiddleware } from "./use-admin-invite-after-email-sign-up-middleware";

vi.mock("better-auth/api", async (importOriginal) => {
  const actual = await importOriginal<typeof import("better-auth/api")>();
  return {
    ...actual,
    createAuthMiddleware: (handler: unknown) => handler
  };
});

const makeContext = (adapter: Record<string, unknown>, returned: unknown) =>
  ({
    body: {
      adminInviteToken: "raw-invite-token",
      email: "invitee@example.com"
    },
    context: { adapter, returned },
    path: "/sign-up/email",
    query: {}
  }) as never;

describe("admin invitation consumption", () => {
  it("uses the successful signup user and promotes inside one transaction", async () => {
    const consumeOne = vi.fn(async () => ({ role: "editor" }));
    const update = vi.fn(async () => ({ id: "new-user-id", role: "editor" }));
    const transaction = vi.fn(async (callback) =>
      callback({ consumeOne, update })
    );
    const options = {} as any;
    await useAdminInviteAfterEmailSignUpMiddleware({
      options,
      adminInvitationCollectionSlug: "admin-invitations",
      userCollectionSlug: "users"
    });

    await options.hooks.after(
      makeContext(
        { transaction },
        { user: { id: "new-user-id", email: "invitee@example.com" } }
      )
    );

    expect(transaction).toHaveBeenCalledOnce();
    expect(consumeOne).toHaveBeenCalledWith({
      model: "admin-invitations",
      where: [
        {
          field: "token",
          value: hashAdminInviteToken("raw-invite-token"),
          operator: "eq"
        },
        { field: "expiresAt", value: expect.any(Date), operator: "gt" },
        {
          field: "email",
          value: "invitee@example.com",
          operator: "eq"
        }
      ]
    });
    expect(update).toHaveBeenCalledWith(
      expect.objectContaining({
        model: "users",
        update: { role: "editor" },
        where: [{ field: "id", value: "new-user-id", operator: "eq" }]
      })
    );
  });

  it("does not consume an invite after a failed signup response", async () => {
    const transaction = vi.fn();
    const options = {} as any;
    await useAdminInviteAfterEmailSignUpMiddleware({
      options,
      adminInvitationCollectionSlug: "admin-invitations",
      userCollectionSlug: "users"
    });

    await options.hooks.after(makeContext({ transaction }, null));

    expect(transaction).not.toHaveBeenCalled();
  });

  it("fails the transaction when role assignment does not update the new user", async () => {
    const consumeOne = vi.fn(async () => ({ role: "editor" }));
    const update = vi.fn(async () => null);
    const transaction = vi.fn(async (callback) =>
      callback({ consumeOne, update })
    );
    const options = {} as any;
    await useAdminInviteAfterEmailSignUpMiddleware({
      options,
      adminInvitationCollectionSlug: "admin-invitations",
      userCollectionSlug: "users"
    });

    await expect(
      options.hooks.after(
        makeContext(
          { transaction },
          { user: { id: "new-user-id", email: "invitee@example.com" } }
        )
      )
    ).rejects.toThrow("did not update a user");
    expect(consumeOne).toHaveBeenCalledOnce();
  });
});
