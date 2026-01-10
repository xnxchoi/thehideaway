import {CatTitle, TaggedItem} from "@/components/layouts/Tagged/Item";
import {RPage} from "@/components/UX/Transition";
import {queryPostsByIDs} from "@/payload/collections/Posts/api/queryPostOverviews";
import config from "@payload-config";
import {notFound} from "next/navigation";
import type {Metadata} from "next/types";
import {getPayload} from "payload";

import PageClient from "./page.client";

export async function generateStaticParams() {
	const payload = await getPayload({config});
	const tags = await payload.find({
		collection: "tags",
		limit: 100,
		select: {
			slug: true
		},
		overrideAccess: true
	});

	const slugs = tags.docs.map((tag) => ({slug: tag.slug}));
	return [...slugs];
}

type Args = {
	params: Promise<{
		slug: string;
	}>;
};

export default async function Page({params: paramsPromise}: Args) {
	const {slug} = await paramsPromise;
	const payload = await getPayload({config});

	const tag = await payload
		.find({
			collection: "tags",
			where: {
				slug: {
					equals: slug
				}
			},
			limit: 1,
			select: {
				title: true,
				slug: true,
				tagged: true
			}
		})
		.then((result) => result.docs[0] ?? null)
		.catch((e) => (console.error(e), null));
	if (!tag) {
		notFound();
	}

	const tagged = (tag.tagged?.docs || []).flatMap(t => {
		const {relationTo, value} = t;
		if (!relationTo) return [];
		return {relationTo, value: typeof value === "string" ? value : value.id}
	})
	const postSel = tagged.flatMap(t => t.relationTo === "posts" ? t.value : [])
	const deltaSel = tagged
		.flatMap((t) => t.relationTo === "delta" ? t.value : [])
	const posts = await queryPostsByIDs({ids: postSel});

	return (
		<RPage type="tags" slug={[tag.slug]}>
			<PageClient>
				<div className="relative flex w-full flex-col items-center justify-center">
					<CatTitle title={tag.title}/>
					<div
						className={
							"relative z-[1] flex w-full flex-col items-center justify-center py-[16px]"
						}
					>
						<div className="mx-auto w-full max-w-[calc(100vw-80px)] px-[20px]">
							{posts.docs.map((post) => (
								<TaggedItem
									key={post.id}
									{...post}
									subtitle={post.subtitle ?? ""}
								/>
							))}
						</div>
					</div>
				</div>
			</PageClient>
		</RPage>
	);
}

export async function generateMetadata({
	                                       params: paramsPromise
                                       }: Args): Promise<Metadata> {
	const {slug} = await paramsPromise;
	const payload = await getPayload({config});
	const tag = await payload
		.find({
			collection: "tags",
			where: {
				slug: {
					equals: slug
				}
			},
			limit: 1,
			select: {
				title: true,
				slug: true,
				id: true
			}
		})
		.then((result) => result.docs[0] ?? null)
		.catch((e) => (console.error(e), null));
	if (!tag) {
		return {
			title: "Tagged"
		};
	}
	return {
		title: `Tagged: ${tag.title || ""}`,
		description: `${tag.title || ""}`
	};
}
