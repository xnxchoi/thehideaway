import type {Metadata} from "next/types";

import {PageRange} from "@/payload/components/PageRange";
import {Pagination} from "@/payload/components/Pagination";

import PageClient from "./page.client";
import {RPage} from "@/components/UX/Transition";
import {CatTitle, TaggedItem} from "@/components/layouts/Tagged/Item";
import {queryPostOverview} from "@/payload/collections/Posts/api/queryPostOverview";

export default async function Page() {
	const posts = await queryPostOverview({
		limit: 12,
		page: 1,
	});

	return (
		<RPage key={`posts_${posts.length}`} type="posts" slug={["pages"]}>
			<PageClient>
				<div className="relative flex w-full flex-col items-center justify-center">
					<CatTitle title="Latest" />
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

export function generateMetadata(): Metadata {
	return {
		title: `Articles & Essays`,
		description: `The latest heard around the estate.`,
	};
}
