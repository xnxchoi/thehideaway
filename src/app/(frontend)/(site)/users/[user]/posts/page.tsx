import type {Metadata} from "next/types";

import {PageRange} from "@/payload/components/PageRange";
import {Pagination} from "@/payload/components/Pagination";

import PageClient from "./page.client";
import {RPage} from "@/components/UX/Transition";
import {CatTitle, TaggedItem} from "@/components/layouts/Tagged/Item";
import {queryPostOverview} from "@/payload/collections/Posts/api/queryPostOverview";
import {getPayload} from "payload";
import config from "@payload-config";
import {PayloadRedirects} from "@/payload/components/PayloadRedirects";

type Args = {
	params: Promise<{
		user?: string;
	}>;
};

export default async function Page({params: paramsPromise}: Args) {
	const {user = ""} = await paramsPromise;

	const url = user.startsWith("@") ? (user.split("@")[1] as string) : user;

	const payload = await getPayload({config});
	const targetUser = await payload.find({
		collection: "users",
		where: {
			slug: {
				equals: url,
			},
		},
		limit: 1,
		overrideAccess: true,
		depth: 0,
	}).then((a) => a.docs[0]).catch(() => null);
	if (!targetUser) {
		return <PayloadRedirects url={"/404"} />;
	}

	const posts = await queryPostOverview({
		limit: 12,
		page: 1,
		overrideAccess: true,
		where: {
			author: {
				equals: targetUser.id,
			},
		},
	});

	return (
		<RPage key={`posts_${posts.length}`} type="users" slug={[url, "posts"]}>
			<PageClient>
				<div className="relative flex w-full flex-col items-center justify-center">
					<CatTitle title={`Latest from ${targetUser.name}`} />
					<div className={
						"relative z-[1] flex w-full flex-col items-center justify-center py-[16px]"
					}>
						<div className="mx-auto w-full max-w-[calc(100vw-80px)] px-[20px]">
							{posts.map((post) => (
								<TaggedItem key={post.id} {...post} />
							))}
						</div>
					</div>
				</div>
				<div className="container">
					<div className="container mb-8">
						<PageRange collection="posts" currentPage={1} limit={12}
						           totalDocs={posts.length} />
					</div>
					{posts.length > 12 && <Pagination page={1} totalPages={1} />}
				</div>
			</PageClient>
		</RPage>
	);
}

export async function generateMetadata({
	params: paramsPromise,
}: Args): Promise<Metadata> {
	const {user = "@"} = await paramsPromise;

	const url = user.startsWith("@") ? (user.split("@")[1] as string) : user;

	return {
		title: `Latest from ${url}`,
		description: `Peek into ${url}'s thoughts in full.`,
	};
}
