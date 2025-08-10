"use client";
import {RPage} from "@/components/UX/Transition";
import {Link} from "@/components/UX/Link";
import {Logo} from "@/components/UX/Logo";
import {VGradientModule} from "@/components/UX/Gradient/Gradient";
import {AuthCard} from "@/lib/auth/betterauth-ui/src";

export default function Page() {
	return (
		<RPage type="account" slug={["sign-up"]}>
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
					<AuthCard view="SIGN_UP" />
				</div>
				<VGradientModule />
			</div>
		</RPage>
	);
}
