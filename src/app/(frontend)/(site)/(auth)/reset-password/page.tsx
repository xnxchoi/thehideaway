import {RPage} from "@/components/UX/Transition";
import {AuthCard} from "@/lib/auth/betterauth-ui/src";

export default function Page() {
	return (
		<RPage type="account" slug={["reset-password"]}>
			<div className="my-8 flex w-full grow flex-col place-content-center px-4 md:px-8">
				<div className="mx-auto h-full w-full max-w-md self-center px-4 sm:px-0">
					<div className="mb-6 text-center">
						<h1 className="mb-2 text-2xl font-bold tracking-tight">
							Reset Password{" "}
						</h1>
						<p className="text-muted-foreground">
							Enter your email to reset your password{" "}
						</p>
					</div>
					<AuthCard view="RESET_PASSWORD" redirectTo="/sign-in" />
				</div>
			</div>
		</RPage>
	);
}
