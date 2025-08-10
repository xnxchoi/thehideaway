import {notFound} from "next/navigation";
import type {Metadata} from "next/types";
import {getPayload} from "payload";
import config from "@payload-config";
import {PageRange} from "@/payload/components/PageRange";
import {Pagination} from "@/payload/components/Pagination";

import PageClient from "./page.client";
import {RPage} from "@/components/UX/Transition";
import {paginatedPosts} from "@/payload/collections/Posts/api/queryPostOverview";
import {CatTitle, TaggedItem} from "@/components/layouts/Tagged/Item";

export const revalidate = 600;

type Args = {
	params: Promise<{
		pageNumber: string;
	}>;
};

export default async function Page({params: paramsPromise}: Args) {
	const {pageNumber} = await paramsPromise;
	const payload = await getPayload({config});

	const sanitizedPageNumber = Number(pageNumber);

	if (!Number.isInteger(sanitizedPageNumber)) notFound();

	const posts = await paginatedPosts({
		limit: 12,
		page: sanitizedPageNumber,
		overrideAccess: false,
	});
	return (
		<RPage type="posts" slug={[sanitizedPageNumber.toString()]}>
			<PageClient>
				<div className="container mb-16">
					<div className="prose dark:prose-invert max-w-none">
						<h1>Posts</h1>
					</div>
				</div>
				<div className="container mb-8">
					<PageRange collection="posts" currentPage={posts.page} limit={12}
					           totalDocs={posts.totalDocs} />
				</div>
				<div className="relative flex w-full flex-col items-center justify-center">
					<CatTitle title="Tagged" />
					<div className={
						"relative z-[1] flex w-full flex-col items-center justify-center py-[16px]"
					}>
						<div className="mx-auto w-full max-w-[calc(100vw-80px)] px-[20px]">
							{posts.docs.map((post) => (
								<TaggedItem key={post.id} {...post} />
							))}
						</div>
					</div>
				</div>
				<div className="container">
					{posts?.page && posts?.totalPages > 1 && (
						<Pagination page={posts.page} totalPages={posts.totalPages} />
					)}
				</div>
			</PageClient>
		</RPage>
	);
}

export async function generateMetadata({
	params: paramsPromise,
}: Args): Promise<Metadata> {
	const {pageNumber} = await paramsPromise;
	return {
		title: `The Hideaway Posts Page ${pageNumber || ""}`,
	};
}

export async function generateStaticParams() {
	const payload = await getPayload({config});
	const {totalDocs} = await payload.count({
		collection: "posts",
		overrideAccess: false,
	});

	const totalPages = Math.ceil(totalDocs / 10);

	const pages: { pageNumber: string }[] = [];

	for (let i = 1; i <= totalPages; i++) {
		pages.push({pageNumber: String(i)});
	}

	return pages;
}
