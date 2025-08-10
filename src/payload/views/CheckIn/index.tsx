import {type AdminViewServerProps} from "payload";

import React from "react";
import {redirect} from "next/navigation";
import {formatAdminURL} from "@/payload/utilities/formatAdminURL";
import {AdminLoginClient} from "@/lib/auth/better-auth/plugin/payload/views/admin-login/client";

import {getSafeRedirect} from "payload-auth/better-auth/plugin/payload/utils/get-safe-redirect";
import {MinimalTemplate} from "@payloadcms/next/templates";
import {checkPluginExists} from "payload-auth/better-auth/plugin/helpers/check-plugin-exists";
import {
	adminRoutes,
	defaults,
	supportedBAPluginIds,
} from "payload-auth/better-auth/plugin/constants";

import {RP_Roles} from "@/stores/Notification/NotificationStore";
import {betterAuthPluginOptions} from "@/lib/auth/options";
import {
	AdminLoginClient
} from "payload-auth/dist/better-auth/plugin/payload/views/admin-login/client";

export const loginBaseClass = "login";

interface AdminLoginProps extends AdminViewServerProps {
	adminInvitationsSlug: string;
}

export const CheckInView: React.FC<AdminLoginProps> = async ({
	initPageResult,
	params,
	searchParams,

	adminInvitationsSlug,
}) => {
	const {locale, permissions, req} = initPageResult;
	const {
		i18n,
		payload: {config, collections},
		payload,
		user,
	} = req;

	const {
		admin: {components: {} = {}, user: userSlug},
		routes: {admin: adminRoute},
	} = config;

	const pluginOptions = betterAuthPluginOptions;

	const adminRole = pluginOptions.users?.defaultAdminRole ?? defaults.adminRole;
	const redirectUrl = getSafeRedirect(searchParams?.redirect ?? "", adminRoute);

	if (user) {
		const url = formatAdminURL({
			adminRoute: payload.config.routes.admin,
			path: "/account",
			serverURL: payload.config.serverURL,
		});
		redirect(url);
	}
	const adminCount = await req.payload.count({
		collection: "users",
		where: {
			role: {
				equals: adminRole,
			},
		},
	});

	if (adminCount.totalDocs === 0) {
		// Check if we already have an admin invitation
		const existingInvitations = await req.payload.find({
			collection: "admin-invitations",
			where: {
				role: {
					equals: adminRole,
				},
			},
		});

		let token;

		if (
			existingInvitations.totalDocs > 0 &&
			existingInvitations.docs[0] &&
			"token" in existingInvitations.docs[0]
		) {
			// Use existing token

			token = existingInvitations.docs[0]!.token;
		} else {
			// Generate a new secure invite token
			token = crypto.randomUUID();
			await req.payload.create({
				collection: "admin-invitations",
				data: {
					role: adminRole as RP_Roles,
					token,
				},
			});
		}

		redirect(`${adminRoute}${adminRoutes.adminSignup}?token=${token}`);
	}

	// Filter out the first component from afterLogin array or set to undefined if not more than 1
	// This is because of the custom login redirect component, we don't want an infinite loop

	const prefillAutoLogin =
		typeof config.admin?.autoLogin === "object" &&
		config.admin?.autoLogin.prefillOnly;
	const prefillUsername =
		prefillAutoLogin && typeof config.admin?.autoLogin === "object"
			? config.admin?.autoLogin.username
			: undefined;
	const prefillEmail =
		prefillAutoLogin && typeof config.admin?.autoLogin === "object"
			? config.admin?.autoLogin.email
			: undefined;
	const prefillPassword =
		prefillAutoLogin && typeof config.admin?.autoLogin === "object"
			? config.admin?.autoLogin.password
			: undefined;
	const hasUsernamePlugin = checkPluginExists(
		pluginOptions.betterAuthOptions ?? {},
		supportedBAPluginIds.username,
	);
	const hasPasskeyPlugin = checkPluginExists(
		pluginOptions.betterAuthOptions ?? {},
		supportedBAPluginIds.passkey,
	);
	const loginMethods = pluginOptions.admin?.loginMethods ?? [];
	const loginWithUsername =
		collections?.[userSlug]?.config.auth.loginWithUsername;
	const canLoginWithUsername =
		(hasUsernamePlugin && loginWithUsername) ?? false;

	return (
		<MinimalTemplate className={loginBaseClass}>
			<div className="rp-container" data-themed={"background-color"}>
				<AdminLoginClient loginWithUsername={canLoginWithUsername}
				                  hasUsernamePlugin={hasUsernamePlugin}
				                  hasPasskeyPlugin={hasPasskeyPlugin} loginMethods={loginMethods}
				                  prefillEmail={prefillEmail} prefillPassword={prefillPassword}
				                  prefillUsername={prefillUsername}
				                  searchParams={searchParams ?? {}}
				                  baseURL={pluginOptions.betterAuthOptions?.baseURL}
				                  basePath={pluginOptions.betterAuthOptions?.basePath} />
			</div>
		</MinimalTemplate>
	);
};

export default CheckInView;
