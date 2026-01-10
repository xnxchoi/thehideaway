import {CatTitle, TaggedItem} from "@/components/layouts/Tagged/Item";
import {RPage} from "@/components/UX/Transition";
import {queryPostsByIDs} from "@/payload/collections/Posts/api/queryPostOverviews";
import config from "@payload-config";
import {notFound, redirect} from "next/navigation";
import type {Metadata} from "next/types";
import {getPayload} from "payload";

import PageClient from "./page.client";

export const dynamic = "force-dynamic";

export async function generateStaticParams() {
	const payload = await getPayload({config});
	const cats = await payload.find({
		collection: "categories",
		limit: 100,
		select: {
			slug: true, popularity: true
		},
		sort: "-popularity",

		overrideAccess: true
	});

	const slugs = cats.docs.map((cat) => ({slug: cat.slug}));
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

	const cat = await payload
		.find({
			collection: "categories",
			where: {
				slug: {
					equals: slug
				}
			},
			limit: 1,
			select: {
				title: true,
				slug: true,

			}
		})
		.then((result) => result.docs[0] ?? null)
		.catch((e) => (console.error(e), null));
	if (!cat) {
		notFound();
	}
	const postSel = payload.find({
		collection: "posts",
		where: {
			and: [
				{
					category: {
						equals: cat.id
					}
				}, {
					_status: {
						equals: "published"
					}
				}
			]
		}, depth: 0, limit: 12
	}).then((result) => result.docs.map((doc) => doc.id)).then((ids) => queryPostsByIDs({ids}));
	const deltaSel = payload.find({
		collection: "delta", where: {
			and: [
				{
					category: {
						equals: cat.id
					}
				}, {
					_status: {
						equals: "published"
					}
				}
			]
		}, depth: 0, limit: 12
	}).then((result) => result.docs.map((doc) => doc.id));
	const posts = await postSel.then((results) => (results.docs))
	return (
		<RPage type="categories" slug={[cat.slug]}>
			<PageClient>
				<div className="relative flex w-full flex-col items-center justify-center">
					<CatTitle title={cat.title}/>
					<div
						className={
							"relative z-[1] flex w-full flex-col items-center justify-center py-[16px]"
						}
					>
						<div className="mx-auto w-full max-w-[calc(100vw-80px)] px-[20px]">
							{posts.map((post) => (
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
	const cat = await payload
		.find({
			collection: "categories",
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
	if (!cat) {
		return {
			title: "Categories"
		};
	}
	return {
		title: `Archived: ${cat.title || ""}`,
		description: `${cat.title || ""}`
	};
}
