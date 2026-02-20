import {
	ArchiveFeatureCard,
	OverviewAgnosticItem
} from "@/app/(frontend)/(site)/essays/ArchiveFeature/ArchiveFeatureCard";
import {CatTitle, TaggedItem} from "@/components/layouts/Tagged/Item";
import {PageRange} from "@/components/UX/PageRange";
import {RPage} from "@/components/UX/Transition";
import {queryPostOverviews} from "@/payload/collections/Posts/api/queryPostOverviews";
import {formatCollectionURL} from "@/utilities/formatCollectionURL";
import config from "@payload-config";
import {notFound} from "next/navigation";
import type {Metadata} from "next/types";
import {getPayload} from "payload";

import PageClient from "./page.client";

type Args = {
	params: Promise<{
		slug: string;
		pageNumber: `${number}`;
	}>;
};

export default async function Page({params: paramsPromise}: Args) {
	const {slug, pageNumber: pageFromParams} = await paramsPromise;
	const cat = await getCategoryPage({slug});
	if (!cat) {
		notFound();
	}

	const {
		docs,
		totalDocs,
		totalPages,
		limit,
		page,
		hasNextPage,
		hasPrevPage,
		nextPage,
		prevPage
	} = await getPostsWithCategory({id: cat.id, page: pageFromParams})
	const firstFive = docs.slice(0, 5).map(({
		                                        slug,
		                                        author,
		                                        category,
		                                        ...posts
	                                        }): OverviewAgnosticItem => ({
		category: category.title,
		author: author.name,
		url: formatCollectionURL({relationTo: "posts", slug}),
		...posts
	}));
	const rest = docs.slice(5);
	return (
		<RPage type="categories" slug={[cat.slug]}>
			<PageClient>
				<div className="relative flex w-full flex-col items-center justify-center">
					<CatTitle> {cat.title}</CatTitle>
					<div
						className={
							"relative z-[1] flex w-full flex-col items-center justify-center py-[16px]"
						}
					>
						<div>
							<div className={"p-0"}>
								<div className={"relative h-full w-full"}>
									<div className={"w-full"}>
										<div
											className={
												"relative z-[150] mx-auto flex w-[calc(100%-5rem)] max-w-[var(--maxContainerWidth)] translate-y-[1rem] rounded-t-[20px] rounded-b-[0]"
											}
										></div>
										<div className={"relative block"}>
											<ArchiveFeatureCard contents={firstFive} type={"left"}/>
										</div>
									</div>
								</div>
							</div>
						</div>
						<div className="mx-auto w-full max-w-[calc(100vw-80px)] px-[20px]">
							{rest.map(({slug, author, category, ...post}) => (
								<TaggedItem key={post.id} {...post} author={author.name}
								            category={category.title}
								            url={formatCollectionURL({relationTo: "posts", slug})}/>
							))}
						</div>
					</div>
				</div>
				<div className="container">
					<PageRange basePath={`/archived/${cat.slug}`} prevPage={prevPage || undefined}
					           page={page} nextPage={nextPage || undefined} totalDocs={totalDocs}
					           limit={limit}/>
				</div>
			</PageClient>
		</RPage>
	);
}

export async function generateMetadata({
	                                       params: paramsPromise
                                       }: Args): Promise<Metadata> {
	const {slug, pageNumber} = await paramsPromise;
	return {
		title: `Archived: ${slug || ""} - ${pageNumber || ""}`
	};
}

export async function generateStaticParams(params: {
	slug: string;
}) {
	const {slug} = params;
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
				slug: true
			}
		})
		.then((result) => result.docs[0] ?? null)
		.catch((e) => (console.error(e), null));
	if (!cat) {
		return [];
	}
	const categorized = await payload
		.find({
			collection: "categories",
			where: {
				slug: {
					equals: slug
				}
			},
			select: {
				categorized: true
			}
		})
		.then((result) => result.docs?.[0]?.categorized ?? null)
		.catch((e) => (console.error(e), null));
	if (!categorized || !categorized.totalDocs || !categorized.docs) {
		return [];
	}
	const totalDocs = categorized.totalDocs;
	const totalPages = Math.ceil(totalDocs / 12);
	const pages: { page: string }[] = [];
	for (let i = 1; i <= totalPages; i++) {
		pages.push({page: String(i)});
	}

	return pages;
}

async function getPostsWithCategory({id, page}: { id: string; page: `${number}`; }) {
	"use cache"
	return await queryPostOverviews({
		limit: 12,
		page: Number(page),

		where: {
			categorized: {
				equals: id
			}
		}
	});
}

async function getCategoryPage({slug}: { slug: string }) {
	"use cache"
	const payload = await getPayload({config});
	return await payload
		.find({
			collection: "categories",
			where: {
				slug: {
					equals: slug
				}
			},
			overrideAccess: true,
			limit: 1,
			select: {
				title: true,
				slug: true
			}
		})
		.then((result) => result.docs[0] ?? null)
		.catch((e) => (console.error(e), null));
}