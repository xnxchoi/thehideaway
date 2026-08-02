import { adminEndpoints } from "@payload-auth/better-auth/plugin/constants";
import { generateAdminInviteUrl } from "@payload-auth/better-auth/plugin/payload/utils/generate-admin-invite-url";
import { PayloadAuthOptions } from "@payload-auth/better-auth/plugin/types";
import { User } from "@payload-types";
import { status as httpStatus } from "http-status";

import { addDataAndFileToRequest, type Endpoint } from "payload";
import { hasAdminRoles } from "../../utils/payload-access";
import {
  ADMIN_INVITE_TTL_MS,
  hashAdminInviteToken,
  normalizeAdminInviteEmail
} from "../../../admin-invite-security";
import { z } from "zod";

type InviteEndpointProps = {
  roles: { label: string; value: string }[];
  pluginOptions: PayloadAuthOptions;
};

const generateInviteSchema = z.object({
  email: z.string().email(),
  role: z.object({
    label: z.string(),
    value: z.string()
  })
});

export const getGenerateInviteUrlEndpoint = ({
  roles,
  pluginOptions
}: InviteEndpointProps): Endpoint => {
  const endpoint: Endpoint = {
    path: adminEndpoints.generateInviteUrl,
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
      const body = generateInviteSchema.safeParse(req.data);
      const generateAdminInviteUrlFn =
        pluginOptions?.adminInvitations?.generateInviteUrl ??
        generateAdminInviteUrl;

      if (!body.success) {
        return Response.json(
          { message: body.error.message },
          { status: httpStatus.BAD_REQUEST }
        );
      }

      if (!roles.some((role) => role.value === body.data.role.value)) {
        return Response.json(
          { message: "Invalid role" },
          { status: httpStatus.BAD_REQUEST }
        );
      }
      const token = crypto.randomUUID();
      const inviteLink = generateAdminInviteUrlFn({
        payload: req.payload,
        token
      });

      try {
        await req.payload.create({
          collection: (pluginOptions.adminInvitations?.slug ??
            "admin-invitations") as "admin-invitations",
          overrideAccess: false,
          req,
          user: req.user,
          data: {
            email: normalizeAdminInviteEmail(body.data.email),
            token: hashAdminInviteToken(token),
            role: body.data.role.value as User["role"],
            expiresAt: new Date(Date.now() + ADMIN_INVITE_TTL_MS).toISOString()
          }
        });
        const response = new Response(
          JSON.stringify({
            message: "Invite link generated successfully",
            inviteLink
          }),
          {
            status: 200
          }
        );
        return response;
      } catch (error) {
        console.error(error);
        return Response.json(
          { message: "Error generating invite link" },
          { status: httpStatus.INTERNAL_SERVER_ERROR }
        );
      }
    }
  };

  return endpoint;
};
