import {errorToast} from "@/components/ui/sonner";
import {betterAuthOptions} from "@/lib/auth/options";
import {accessControl} from "@/lib/auth/permissions";
import {admin, author, editor, patron, user} from "@/lib/auth/roles";
import {passkeyClient} from "@better-auth/passkey/client";
import {
	adminClient,
	emailOTPClient,
	inferAdditionalFields,
	magicLinkClient,
	multiSessionClient,
	organizationClient,
	twoFactorClient
} from "better-auth/client/plugins";
import {createAuthClient} from "better-auth/react";

export const authClient = createAuthClient({
	baseURL: `${process.env.NEXT_PUBLIC_BETTER_AUTH_URL}`,
	plugins: [
		twoFactorClient({
			onTwoFactorRedirect() {
				window.location.href = "/two-factor";
			}
		}),
		// usernameClient(),
		// anonymousClient(),
		// phoneNumberClient(),
		passkeyClient(),
		magicLinkClient(),
		emailOTPClient(),
		organizationClient(),
		adminClient({
			ac: accessControl,
			roles: {
				admin,
				author,
				user,
				patron,
				editor
			}
		}), // apiKeyClient(),
		multiSessionClient(),
		inferAdditionalFields({
			user: {
				role: {
					type: "string",
					defaultValue: "author",
					input: false
				},

				username: {
					type: "string"
				},
				slug: {
					type: "string"
				},
				location: {
					type: "string",
					required: false
				},
				bio: {
					type: "string",
					required: false
				},
				portrait: {
					type: "string"
				},
				onboarded: {
					type: "boolean",
					required: true,
					defaultValue: false
				},
				twoFactorEnabled: {
					type: "boolean",
					required: true,
					defaultValue: false
				},
				emailVerified: {
					type: "boolean",
					required: true,
					defaultValue: false
				},
				firstName: {
					type: "string",
					required: true
				},
				lastName: {
					type: "string",
					required: true
				},
				name: {
					type: "string",
					required: true
				},
				displayUsername: {
					type: "string"
				}
			}
		})
	],
	fetchOptions: {
		onError(e) {
			if (e.error.status === 429) {
				errorToast("Too many requests. Please try again later.");
			}
		}
	},
	$InferAuth: betterAuthOptions
});

export const {
	signUp,
	signIn,
	signOut,
	useSession,
	organization,
	useListOrganizations,
	useActiveOrganization
} = authClient

authClient.$store.listen("$sessionSignal", async () => {
});
