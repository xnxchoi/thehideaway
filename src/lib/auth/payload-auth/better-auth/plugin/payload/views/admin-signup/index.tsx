import React from "react";
import { z } from "zod";
import { Logo } from "@payload-auth/shared/components/logo";
import { AdminSignupClient } from "./client";
import { FormHeader } from "@payload-auth/shared/form/ui/header";
import { supportedBAPluginIds } from "@payload-auth/better-auth/plugin/constants";
import { MinimalTemplate } from "@payloadcms/next/templates";
import type { AdminViewServerProps, CollectionSlug } from "payload";
import type { PayloadAuthOptions } from "../../../types";
import { checkPluginExists } from "@payload-auth/better-auth/plugin/helpers/check-plugin-exists";
import { resolveBaseURL } from "../../utils/resolve-base-url";
import { hashAdminInviteToken } from "../../../lib/admin-invite-security";

//  Avoid the need for custom styles
const baseClass = "login";

const searchParamsSchema = z.object({
  token: z.string()
});

interface AdminSignupProps extends AdminViewServerProps {
  adminInvitationsSlug: string;
  pluginOptions: PayloadAuthOptions;
}

const AdminSignup: React.FC<AdminSignupProps> = async ({
  initPageResult,
  params,
  searchParams,
  pluginOptions,
  adminInvitationsSlug
}: AdminSignupProps) => {
  const {
    locale,
    permissions,
    req,
    req: {
      i18n,
      user,
      payload: {
        collections,
        config: {
          admin: { user: userSlug }
        }
      }
    }
  } = initPageResult;

  const { success, data } = searchParamsSchema.safeParse(searchParams);

  let hasInvalidToken = false;
  if (!success) {
    hasInvalidToken = true;
  } else {
    const { totalDocs: isValidInvite } = await req.payload.count({
      collection: adminInvitationsSlug as CollectionSlug,
      where: {
        and: [
          { token: { equals: hashAdminInviteToken(data.token) } },
          { expiresAt: { greater_than: new Date().toISOString() } }
        ]
      }
    });
    if (!isValidInvite) {
      hasInvalidToken = true;
    }
  }

  const loginMethods = pluginOptions.admin?.loginMethods ?? [];
  const hasUsernamePlugin = checkPluginExists(
    pluginOptions.betterAuthOptions ?? {},
    supportedBAPluginIds.username
  );
  const hasPasskeyPlugin = checkPluginExists(
    pluginOptions.betterAuthOptions ?? {},
    supportedBAPluginIds.passkey
  );
  const hasMagicLinkPlugin = checkPluginExists(
    pluginOptions.betterAuthOptions ?? {},
    supportedBAPluginIds.magicLink
  );
  const loginWithUsername =
    collections?.[userSlug as CollectionSlug]?.config.auth.loginWithUsername;
  const loginIdentifiers: ("email" | "username")[] = (() => {
    if (!hasUsernamePlugin || !loginWithUsername) return ["email"];
    const allowEmail =
      typeof loginWithUsername === "object"
        ? loginWithUsername.allowEmailLogin !== false
        : true;
    return allowEmail
      ? (["email", "username"] as const)
      : (["username"] as const);
  })();

  return (
    <MinimalTemplate className={`${baseClass} admin-signup`}>
      <div className={`${baseClass}__brand admin-signup__brand`}>
        <Logo
          i18n={i18n}
          locale={locale}
          params={params}
          payload={req.payload}
          permissions={permissions}
          searchParams={searchParams}
          user={user ?? undefined}
        />
      </div>
      {hasInvalidToken ? (
        <FormHeader
          style={{ textAlign: "center" }}
          heading="Invalid or expired token"
          description="You need to get a new invite to sign up."
        />
      ) : (
        data && (
          <AdminSignupClient
            adminInviteToken={data.token}
            userSlug={userSlug}
            loginMethods={loginMethods}
            searchParams={searchParams ?? {}}
            loginWithUsername={
              hasUsernamePlugin ? (loginWithUsername ?? false) : false
            }
            loginIdentifiers={loginIdentifiers}
            plugins={{
              username: hasUsernamePlugin,
              passkey: hasPasskeyPlugin,
              magicLink: hasMagicLinkPlugin
            }}
            baseURL={resolveBaseURL(
              pluginOptions.betterAuthOptions?.baseURL,
              req.headers
            )}
            basePath={pluginOptions.betterAuthOptions?.basePath}
          />
        )
      )}
    </MinimalTemplate>
  );
};

export default AdminSignup;
