import {getPayload} from "payload";
import PageClient from "./page.client";
import config from "@payload-config";
import {queryPostBySlug} from "@/payload/collections/Posts/api/queryPostBySlug";
import {authClient} from "@/lib/auth/client";

export default async function Page() {
	const payload = await getPayload({config});
	const ses = await authClient.getSession();

	return (
		<>
			<div className={"p-0"}>
				<div className={"h-full w-full"}>
					<PageClient />
				</div>
			</div>
		</>
	);
}
