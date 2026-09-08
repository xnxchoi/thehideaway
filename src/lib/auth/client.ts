import {errorToast} from "@/components/ui/sonner";
import type {BetterAuthOptions} from "@/lib/auth/options";
import {accessControl} from "@/lib/auth/permissions";
import {
	admin,
	author,
	cofounder,
	editor,
	patron,
	resident,
	user
} from "@/lib/auth/roles";
import {passkeyClient} from "@better-auth/passkey/client";
import {
	adminClient,
	emailOTPClient,
	inferAdditionalFields,
	magicLinkClient,
	multiSessionClient,
	organizationClient,
	twoFactorClient,
	usernameClient
} from "better-auth/client/plugins";
import {createAuthClient} from "better-auth/react";
import { readAuthBaseURL } from "@/lib/auth/readAuthBaseURL";

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
		organizationClient(),
		adminClient({
			ac: accessControl,
			roles: {
				admin,
				author,
				cofounder,
				user,
				patron,
				resident,
				editor
			}
		}),
		multiSessionClient(),
		inferAdditionalFields<BetterAuthOptions>()
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
