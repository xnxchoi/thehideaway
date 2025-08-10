import {PageRedirect, RPage} from "@/components/UX/Transition";
import {Link} from "@/components/UX/Link";
import {LoginForm} from "@/components/login-form";
import {Logo} from "@/components/UX/Logo";
import {VGradientModule} from "@/components/UX/Gradient/Gradient";
import {authClient} from "@/lib/auth/client";

export default async function CheckInPage() {
	const {data} = await authClient.getSession();
	const user = data?.user;
	return user ? (
		<PageRedirect pageType={"users"} slug={`@${user?.name}`} />
	) : (
		<RPage type={"account"} slug={["check-in"]}>
			<div
				className="relative z-[100] flex min-h-svh flex-col items-center justify-center gap-10 p-9 md:p-16">
				<div className={
					"absolute inset-[35px] z-[120] flex rounded-[35px] bg-[oklch(var(--opaque-bg)/.54)] backdrop-blur-[54px]"
				}></div>
				<div className="z-[120] flex w-full max-w-[384px] flex-col gap-9">
					<Link href="/" className="flex items-center gap-3.5 self-center font-medium">
						<div
							className="bg-primary flex size-9 items-center justify-center rounded-lg">
							<Logo />
						</div>
						The Hideaway.
					</Link>
					<LoginForm />
				</div>
				<VGradientModule />
			</div>
		</RPage>
	);
}
