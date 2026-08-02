import type { SanitizedBetterAuthOptions } from "@payload-auth/better-auth/plugin/types";
import { createAuthMiddleware, isAPIError } from "better-auth/api";
import { buildAdminInviteWhere } from "../../admin-invite-security";

/**
 * Modifies options object and adds a middleware to check for admin invite for sign up
 */
export const useAdminInviteAfterEmailSignUpMiddleware = async ({
  options,
  adminInvitationCollectionSlug,
  userCollectionSlug
}: {
  options: SanitizedBetterAuthOptions;
  adminInvitationCollectionSlug: string;
  userCollectionSlug: string;
}) => {
  options.hooks = options.hooks || {};
  const originalAfter = options.hooks.after;
  options.hooks.after = createAuthMiddleware(async (ctx) => {
    const adapter = ctx.context.adapter;
    const runOriginalAfter = async () => {
      if (typeof originalAfter === "function") {
        return originalAfter(ctx);
      }
    };

    if (ctx.path !== "/sign-up/email") {
      return runOriginalAfter();
    }
    const returned = ctx.context.returned;
    if (
      !returned ||
      returned instanceof Response ||
      isAPIError(returned) ||
      typeof returned !== "object" ||
      !("user" in returned)
    ) {
      return runOriginalAfter();
    }
    const successfulUser = (
      returned as {
        user?: { id?: string; email?: string };
      }
    ).user;
    const email = successfulUser?.email;
    const adminInviteToken =
      ctx?.query?.adminInviteToken ?? ctx.body.adminInviteToken;
    if (
      !successfulUser?.id ||
      !email ||
      typeof ctx.body?.email !== "string" ||
      email.toLowerCase() !== ctx.body.email.toLowerCase() ||
      typeof adminInviteToken !== "string"
    ) {
      return runOriginalAfter();
    }
    const successfulUserID = successfulUser.id;

    await adapter.transaction(async (transaction) => {
      const adminInvitation = (await transaction.consumeOne({
        model: adminInvitationCollectionSlug,
        where: buildAdminInviteWhere({
          token: adminInviteToken,
          email
        })
      })) as { role?: string } | null;
      if (!adminInvitation?.role) return;

      const updatedUser = await transaction.update({
        model: userCollectionSlug,
        where: [
          {
            field: "id",
            value: successfulUserID,
            operator: "eq"
          }
        ],
        update: {
          role: adminInvitation.role
        }
      });
      if (!updatedUser) {
        throw new Error("Admin invite role assignment did not update a user");
      }
    });
    return runOriginalAfter();
  });
};
