import {
  addDataAndFileToRequest,
  Endpoint,
  headersWithCors,
  killTransaction
} from "payload";
import { status as httpStatus } from "http-status";
import { z } from "zod";
import { adminEndpoints } from "@payload-auth/better-auth/plugin/constants";
import type { PayloadAuthOptions } from "@payload-auth/better-auth/plugin/types";
import { hasAdminRoles } from "../../utils/payload-access";
import {
  hashAdminInviteToken,
  normalizeAdminInviteEmail
} from "../../../admin-invite-security";

const requestSchema = z.object({
  email: z.string().email(),
  link: z.string()
});

export const getSendInviteUrlEndpoint = (
  pluginOptions: PayloadAuthOptions
): Endpoint => {
  const endpoint: Endpoint = {
    path: adminEndpoints.sendInvite,
    method: "post",
    handler: async (req) => {
      if (!req.user) {
        return Response.json(
          { message: "Authentication required" },
          { status: httpStatus.UNAUTHORIZED }
        );
      }

      const adminRoles = pluginOptions.users?.adminRoles ?? ["admin"];
      if (!hasAdminRoles(adminRoles)({ req })) {
        return Response.json(
          { message: "Admin access required" },
          { status: httpStatus.FORBIDDEN }
        );
      }

      await addDataAndFileToRequest(req);
      const { t } = req;
      const body = requestSchema.safeParse(req.data);
      if (!body.success) {
        return Response.json(
          { message: body.error.message },
          { status: httpStatus.BAD_REQUEST }
        );
      }

      let inviteToken: string | null = null;
      try {
        const configuredOrigin = new URL(req.payload.config.serverURL).origin;
        const inviteURL = new URL(body.data.link, configuredOrigin);
        if (inviteURL.origin !== configuredOrigin) {
          throw new Error("Unexpected invite origin");
        }
        inviteToken = inviteURL.searchParams.get("token");
      } catch {
        return Response.json(
          { message: "Invalid invite link" },
          { status: httpStatus.BAD_REQUEST }
        );
      }
      if (!inviteToken) {
        return Response.json(
          { message: "Invalid invite link" },
          { status: httpStatus.BAD_REQUEST }
        );
      }
      const matchingInvite = await req.payload.count({
        collection: (pluginOptions.adminInvitations?.slug ??
          "admin-invitations") as "admin-invitations",
        overrideAccess: false,
        req,
        where: {
          and: [
            { token: { equals: hashAdminInviteToken(inviteToken) } },
            {
              email: {
                equals: normalizeAdminInviteEmail(body.data.email)
              }
            },
            { expiresAt: { greater_than: new Date().toISOString() } }
          ]
        }
      });
      if (matchingInvite.totalDocs !== 1) {
        return Response.json(
          { message: "Invalid invite link" },
          { status: httpStatus.BAD_REQUEST }
        );
      }

      const sendInviteEmailFn = pluginOptions.adminInvitations?.sendInviteEmail;

      if (!sendInviteEmailFn) {
        req.payload.logger.error(
          "Send admin invite email function not configured, please add the function to the betterAuthPlugin options."
        );
        return Response.json(
          { message: "Send invite email function not found" },
          { status: httpStatus.INTERNAL_SERVER_ERROR }
        );
      }

      try {
        const res = await sendInviteEmailFn({
          payload: req.payload,
          email: body.data.email,
          url: body.data.link
        });

        if (!res.success) {
          return Response.json(
            { message: res.message },
            { status: httpStatus.INTERNAL_SERVER_ERROR }
          );
        }

        return Response.json(
          {
            message: t("general:success")
          },
          {
            headers: headersWithCors({
              headers: new Headers(),
              req
            }),
            status: httpStatus.OK
          }
        );
      } catch (error) {
        await killTransaction(req);
        throw error;
      }
    }
  };
  return endpoint;
};
