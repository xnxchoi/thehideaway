import { getPayload, Where } from "payload";
import config from "@payload-config";
import { redirect } from "next/navigation";
import { sortBy } from "lodash-es";
import { RPage } from "@/components/UX/Transition";
import { CatTitle, TaggedItem } from "@/components/layouts/Tagged/Item";
import {TagOverview} from "@collections/Deltas/delta-types";

export const dynamic = "force-static";
export const revalidate = 600;
export async function generateStaticParams() {
	const payload = await getPayload({ config });
	const slugs = await payload
	.find({
		collection: "categories",
		overrideAccess: true,
		select: {
			slug: true,
		},
		pagination: false,
		limit: 1000,
	})
	.then((r) => r.docs.flatMap((doc) => doc.slug))
	.catch((err) => {
		payload.logger.error(err);
		return null;
	});
	if (!slugs || (Array.isArray(slugs) && slugs.length < 1))
		return [] as Array<{ slug: string }>;
	const fin = slugs.flatMap((slug) => (slug && { slug }) || []);
	return [...fin];
}

type Args = {
	params: Promise<{
		slug: string;
	}>;
};

export default async function Page({ params: paramsPromise }: Args) {
	const { slug } = await paramsPromise;
	console.log("slug", slug);
	if (slug.length < 1) return redirect("/not-found");
	const payload = await getPayload({ config });
	const catID = await payload
	.find({
		collection: "categories",
		where: {
			slug: {
				equals: slug,
			},
		},
		overrideAccess: true,
		pagination: false,
		limit: 1,
		select: {
			title: true,
			slug: true,
		},
	})
	.then((r) => (r.docs && r.docs.length > 0 && r.docs[0]) || null)
	.catch((r) => {
		payload.logger.error(r);
		return null;
	});
	console.log("current fetch result", catID);
	if (slug.length < 1 || !catID) return redirect("/not-found");
	const query: Where = {
		and: [
			{
				category: {
					exists: true,
				},
			},
			{
				category: {
					equals: catID.id,
				},
			},
			{
				or: [
					{
						_status: {
							exists: false,
						},
					},
					{
						_status: {
							equals: "published",
						},
					},
				],
			},
		],
	};
	const defaultParams = {
		where: query,
		limit: 1000,
		sort: "-updatedAt",
	};
	const pages_posts = await payload
	.find({
		collection: "posts",
		...defaultParams,
		select: {
			slug: true,
			title: true,
			author: true,
			createdAt: true,
			bookmarks: true,
			updatedAt: true,
			publishedAt: true,
			tags:true
		},
	})
	.then((r) => (r.docs && r.docs.length > 0 ? r.docs : null))
	.catch((r) => {
		payload.logger.error(r);
		return null;
	});
	const pages_delta = await payload
	.find({
		collection: "delta",
		...defaultParams,
		select: {
			slug: true,
			title: true,
			publishedAt: true,
			tags:true,
			author: true,
			bookmarks: true,
			createdAt: true,
			updatedAt: true,
 		},
	})
	.then((r) => (r.docs && r.docs.length > 0 ? r.docs : null))
	.catch((r) => {
		payload.logger.error(r);
		return null;
	});

	const pages_playlists = await payload
	.find({
		collection: "playlists",
		...defaultParams,
		select: {
			slug: true,
			title: true,
			author: true,
			createdAt: true,
			updatedAt: true,
			tags:true
		},
	})
	.then((r) => (r.docs && r.docs.length > 0 ? r.docs : null))
	.catch((r) => {
		payload.logger.error(r);
		return null;
	});

	const pages_albums = await payload
	.find({
		collection: "albums",
		...defaultParams,
		select: {
			slug: true,
			title: true,
			author: true,
			createdAt: true,
			updatedAt: true,
		},
	})
	.then((r) => (r.docs && r.docs.length > 0 ? r.docs : null))
	.catch((r) => {
		payload.logger.error(r);
		return null;
	});

	const pages_tracks = await payload
	.find({
		collection: "tracks",
		...defaultParams,
		select: {
			slug: true,
			title: true,
			author: true,
			publishedAt: true,
			createdAt: true,
			updatedAt: true,
			tags:true
		},
	})
	.then((r) => (r.docs && r.docs.length > 0 ? r.docs : null))
	.catch((r) => {
		payload.logger.error(r);
		return null;
	});
	const variousPages = [
		...(pages_posts || []).map((r) => ({
			...r,
		})),

		...(pages_delta || []).map((r) => ({
			...r,
		})),
	];
	sortBy(variousPages, "createdAt");
	const additionalC = [
		...(pages_playlists || []).map((r) => ({
			relationTo: "playlists",
			value: r.id,
			...r,
		})),

		...(pages_albums || []).map((r) => ({
			relationTo: "albums",
			value: r.id,
			...r,
		})),
		...(pages_tracks || []).map((r) => ({
			relationTo: "tracks",
			value: r.id,
			...r,
		})),
	];
	sortBy(variousPages, "createdAt");
	const totalPages = [...variousPages, ...additionalC];
	return (
		<RPage type={"categories"} slug={[slug]}>
			<div className={"py-24"}>
				<div className="relative flex w-full flex-col items-center justify-center">
					<CatTitle title={catID.title} />
					<div
						className={
							"relative z-[1] flex w-full flex-col items-center justify-center py-[16px]"
						}
					>
						<div className="mx-auto w-full max-w-[calc(100vw-80px)] px-[20px]">
							{variousPages.map((post) =>
								post.slug && post.publishedAt ? (
									<TaggedItem
										{...post}
										category={{
											...catID,
											slug,
										}}
										slug={post.slug}
										key={post.id}
										publishedAt={post.publishedAt}
										subtitle={post.title}
										author={{
											slug: "",
											id: post.author as string,
											name: "",
										}}
										tags={(post.tags as TagOverview[]|null)||([] as TagOverview[])}
										bookmarks={(post.bookmarks?.docs || []) as string[]}
										bookmarksCount={post.bookmarks?.totalDocs || 0}
									/>
								) : (
									<></>
								),
							)}
						</div>
					</div>
				</div>
			</div>
		</RPage>
	);
}
