import AccountSwitcher from "@/components/account-switch";
import {UserCard} from "./user-card";
import {RPage} from "@/components/UX/Transition";
import {authClient} from "@/lib/auth/client";
import {redirect} from "next/navigation";

export default async function Page() {
	const user = await authClient.getSession();
	if (!user) return redirect("/");
	return (
		<RPage type="account" slug={["prive"]}>
			<div
				className="flex w-full flex-col pt-[80px] pb-[80px] text-base max-md:max-w-[calc(100vw-20px)] md:min-h-screen md:w-screen lg:pt-[100px]"
				data-lenis-prevent>
				<div className="mx-2.5 my-0 w-full px-[15px] sm:mx-auto xl:max-w-[98vw]">
					<div className="mx-auto flex h-full w-full flex-col gap-6 xl:max-w-screen-lg">
						<AccountSwitcher />
						<UserCard />
					</div>
				</div>
			</div>
		</RPage>
	);
}
