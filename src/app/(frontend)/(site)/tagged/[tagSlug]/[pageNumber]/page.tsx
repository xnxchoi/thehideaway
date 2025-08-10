import {notFound} from "next/navigation";
import type {Metadata} from "next/types";
import {getPayload} from "payload";

import {PageRange} from "@/payload/components/PageRange";

import PageClient from "./page.client";
import {RPage} from "@/components/UX/Transition";
import {queryPostOverview} from "@/payload/collections/Posts/api/queryPostOverview";
import {CatTitle, TaggedItem} from "@/components/layouts/Tagged/Item";
import config from "@payload-config";

export const revalidate = 600;

type Args = {
	params: Promise<{
		tagSlug: string;
		pageNumber: string;
	}>;
};

export default async function Page({params: paramsPromise}: Args) {
	const {tagSlug, pageNumber} = await paramsPromise;
	const payload = await getPayload({config});
	const tag = await payload.find({
		collection: "tags",
		where: {
			slug: {
				equals: tagSlug,
			},
		},
		overrideAccess: true,
		limit: 1,
		select: {
			title: true,
			slug: true,
		},
	}).then((result) => result.docs[0] ?? null).catch((e) => (console.error(e), null));
	if (!tag) {
		notFound();
	}

	const posts = await queryPostOverview({
		limit: 12,
		page: Number(pageNumber),

		where: {
			tags: {
				equals: tag.id,
			},
		},
	});
	return (
		<RPage type="tags" slug={[tag.slug]}>
			<PageClient>
				<div className="relative flex w-full flex-col items-center justify-center">
					<CatTitle title={tag.title} />
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
					<PageRange collection="posts" currentPage={1} limit={12}
					           totalDocs={posts.length} />
				</div>
			</PageClient>
		</RPage>
	);
}

export async function generateMetadata({
	params: paramsPromise,
}: Args): Promise<Metadata> {
	const {tagSlug, pageNumber} = await paramsPromise;
	return {
		title: `Tagged: ${tagSlug || ""} - Page ${pageNumber || ""}`,
	};
}

export async function generateStaticParams(params: { tagSlug: string }) {
	const {tagSlug} = params;
	const payload = await getPayload({config});
	const tag = await payload.find({
		collection: "tags",
		where: {
			slug: {
				equals: tagSlug,
			},
		},
		limit: 1,
		select: {
			slug: true,
		},
	}).then((result) => result.docs[0] ?? null).catch((e) => (console.error(e), null));
	if (!tag) {
		return [];
	}
	const tagged = await payload.find({
		collection: "tags",
		where: {
			slug: {
				equals: tagSlug,
			},
		},
		select: {
			tagged: true,
		},
	}).then((result) => result.docs?.[0]?.tagged ?? null).catch((e) => (console.error(e), null));
	if (!tagged || !tagged.totalDocs || !tagged.docs) {
		return [];
	}
	const totalDocs = tagged.totalDocs;
	const totalPages = Math.ceil(totalDocs / 12);
	const pages: { pageNumber: string }[] = [];
	for (let i = 1; i <= totalPages; i++) {
		pages.push({pageNumber: String(i)});
	}

	return pages;
}
