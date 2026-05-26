import {errorToast} from "@/components/ui/sonner";
import type {BetterAuthOptions} from "@/lib/auth/options";
import {accessControl} from "@/lib/auth/permissions";
import {admin, author, editor, patron, user} from "@/lib/auth/roles";
import {passkeyClient} from "@better-auth/passkey/client";
import {
	adminClient,
	emailOTPClient,
	genericOAuthClient,
	inferAdditionalFields,
	magicLinkClient,
	multiSessionClient,
	organizationClient,
	twoFactorClient,
	usernameClient
} from "better-auth/client/plugins";
import {createAuthClient} from "better-auth/react";

function readAuthBaseURL(): string {
	const primary = `${process.env.NEXT_PUBLIC_BETTER_AUTH_URL}`;
	if (typeof window === "undefined") return primary;

	const candidates = [
		primary,
		process.env.NEXT_PUBLIC_SERVER_URL,
		process.env.NEXT_PUBLIC_LOSTINSEOUL_URL,
		process.env.NEXT_PUBLIC_PRODUCTION_URL
	].filter(Boolean) as string[];

	const current = window.location.origin;
	for (const candidate of candidates) {
		try {
			if (new URL(candidate).origin === current) return current;
		} catch {
			// Ignore malformed env values; server env validation reports them.
		}
	}

	return primary;
}

export const authClient = createAuthClient({
	baseURL: readAuthBaseURL(),
	plugins: [
		twoFactorClient({
			onTwoFactorRedirect() {
				window.location.href = "/two-factor";
			}
		}),
		usernameClient(),
		passkeyClient(),
		magicLinkClient(),
		emailOTPClient(),
		genericOAuthClient(),
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
		}),
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
	$InferAuth: {} as BetterAuthOptions
});

export const {
	signUp,
	signIn,updateUser,
	signOut,
	useSession,
	organization,
	useListOrganizations,
	useActiveOrganization
} = authClient

authClient.$store.listen("$sessionSignal", async () => {
});
