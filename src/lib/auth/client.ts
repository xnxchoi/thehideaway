import {createAuthClient} from "better-auth/react";
import {
	adminClient,
	emailOTPClient,
	inferAdditionalFields,
	magicLinkClient,
	multiSessionClient,
	organizationClient,
	passkeyClient,
	twoFactorClient,
} from "better-auth/client/plugins";
import {accessControl} from "@/lib/auth/permissions";
import {admin, author, editor, patron, user} from "@/lib/auth/roles";
import {errorToast} from "@/components/ui/sonner";

export const authClient = createAuthClient({
	baseURL: `${process.env.NEXT_PUBLIC_BETTER_AUTH_URL}`,
	plugins: [
		twoFactorClient({
			onTwoFactorRedirect() {
				window.location.href = "/two-factor";
			},
		}),
		// usernameClient(),
		// anonymousClient(),
		// phoneNumberClient(),

		magicLinkClient(),
		emailOTPClient(),
		passkeyClient(),
		adminClient({
			ac: accessControl,
			roles: {
				admin,
				author,
				user,
				patron,
				editor,
			},
		}), // apiKeyClient(),
		organizationClient(),
		multiSessionClient(),
		inferAdditionalFields({
			user: {
				role: {
					type: "string",
					defaultValue: "author",
					input: false,
				},
				banned: {
					type: "boolean",
					defaultValue: false,
				},
				username: {
					type: "string",
				},
				slug: {
					type: "string",
				},
				location: {
					type: "string",
					required: false,
				},
				bio: {
					type: "string",
					required: false,
				},
				portrait: {
					type: "string",
				},
				onboarded: {
					type: "boolean",
					required: true,
					defaultValue: false,
				},
				twoFactorEnabled: {
					type: "boolean",
					required: true,
					defaultValue: false,
				},
				emailVerified: {
					type: "boolean",
					required: true,
					defaultValue: false,
				},
				firstName: {
					type: "string",
					required: true,
				},
				lastName: {
					type: "string",
					required: true,
				},
				name: {
					type: "string",
					required: true,
				},
				displayUsername: {
					type: "string",
				},
			},
		}),
	],
	fetchOptions: {
		onError(e) {
			if (e.error.status === 429) {
				errorToast("Too many requests. Please try again later.");
			}
		},
	},
});

export const {
	signUp,
	signIn,
	signOut,

	useSession,
	organization,
	useListOrganizations,
	useListPasskeys,
	updateUser,
	linkSocial,
	refreshToken,
	useActiveOrganization,
} = authClient;

authClient.$store.listen("$sessionSignal", async () => {
});
