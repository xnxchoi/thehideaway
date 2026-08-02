import { adminEndpoints } from "@payload-auth/better-auth/plugin/constants";
import { User } from "@payload-types";
import { status as httpStatus } from "http-status";
import { type Endpoint } from "payload";
import { z } from "zod";
import { PayloadAuthOptions } from "../../../../types";
import { getPayloadAuth } from "../../../get-payload-auth";
import { buildAdminInviteWhere } from "../../../admin-invite-security";

const setAdminRoleSchema = z.object({
  token: z.string().optional(),
  redirect: z.string().optional()
});

export const resolveSafeAdminRedirect = (
  redirect: string,
  configuredOrigin: string
): string | null => {
  if (
    !redirect.startsWith("/") ||
    redirect.startsWith("//") ||
    redirect.includes("\\")
  ) {
    return null;
  }

  try {
    const origin = new URL(configuredOrigin).origin;
    const resolved = new URL(redirect, origin);
    if (resolved.origin !== origin) return null;
    return `${resolved.pathname}${resolved.search}${resolved.hash}`;
  } catch {
    return null;
  }
};

export const getSetAdminRoleEndpoint = (
  pluginOptions: PayloadAuthOptions,
  userSlug: string
): Endpoint => {
  const endpoint: Endpoint = {
    path: adminEndpoints.setAdminRole,
    method: "get",
    handler: async (req) => {
      const { config } = req.payload;
      const schema = setAdminRoleSchema.safeParse(req.query);
      if (!schema.success) {
        return Response.json(
          { message: schema.error.message },
          { status: httpStatus.BAD_REQUEST }
        );
      }
      const payloadAuth = await getPayloadAuth(config);
      const session = await payloadAuth.betterAuth.api.getSession({
        headers: req.headers
      });
      if (!session) {
        return Response.json(
          { message: "No session found" },
          { status: httpStatus.UNAUTHORIZED }
        );
      }
      const { token, redirect } = schema.data;
      if (!token) {
        return Response.json(
          { message: "Invalid token" },
          { status: httpStatus.UNAUTHORIZED }
        );
      }
      const redirectLocation = redirect
        ? resolveSafeAdminRedirect(redirect, config.serverURL)
        : config.routes.admin;
      if (!redirectLocation) {
        return Response.json(
          { message: "Invalid redirect" },
          { status: httpStatus.BAD_REQUEST }
        );
      }
      const authContext = await payloadAuth.betterAuth.$context;
      const assignedRole = await authContext.adapter.transaction(
        async (transaction) => {
          const invite = (await transaction.consumeOne({
            model: pluginOptions.adminInvitations?.slug ?? "admin-invitations",
            where: buildAdminInviteWhere({
              token,
              email: session.user.email
            })
          })) as { role?: User["role"] } | null;
          if (!invite?.role) return false;

          const updatedUser = await transaction.update({
            model: userSlug,
            where: [
              {
                field: "id",
                value: session.user.id,
                operator: "eq"
              }
            ],
            update: {
              role: invite.role
            }
          });
          if (!updatedUser) {
            throw new Error(
              "Admin invite role assignment did not update a user"
            );
          }
          return true;
        }
      );
      if (!assignedRole) {
        return Response.json(
          { message: "Invalid token" },
          { status: httpStatus.UNAUTHORIZED }
        );
      }
      try {
        const response = new Response(null, {
          status: 307,
          headers: {
            Location: redirectLocation
          }
        });
        return response;
      } catch (_error) {
        return Response.json(
          { message: "Error updating user role" },
          { status: httpStatus.INTERNAL_SERVER_ERROR }
        );
      }
    }
  };

  return endpoint;
};
