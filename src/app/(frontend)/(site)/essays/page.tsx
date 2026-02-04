import {CatTitle, TaggedItem} from "@/components/layouts/Tagged/Item";
import {RPage} from "@/components/UX/Transition";
import {paginatedPosts} from "@/payload/collections/Posts/api/queryPostOverviews";
import {formatCollectionURL} from "@/utilities/formatCollectionURL";
import type {Metadata} from "next/types";
import {ArchiveFeatureCard} from "./ArchiveFeature/ArchiveFeatureCard";
import PageClient from "./page.client";

export default async function Page() {
	const sanitizedPageNumber = Number(1);
	const posts = await paginatedPosts({
		limit: 12,
		page: sanitizedPageNumber
	});

	return (
		<RPage type="posts" slug={["posts"]}>
			<PageClient>
				<div className="relative flex w-full flex-col items-center justify-center">
					<CatTitle>{"Articles & Essays"}</CatTitle>
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
											<ArchiveFeatureCard
												type={"left"}
												contents={[
													{
															id: "1",
															title:
																"Lorem ipsum dolor sit amet consectetur adipisicing elit.",
														subtitle: "Lorem ipsum dolor sit",
														author: "Author",

														category: "Category",

															allowList: [],
															authority: 0,
															locked: false,
															publishedAt: "2025-09-30T00:00:00.000Z",
														url: formatCollectionURL({
															relationTo: "posts",
															slug: "slug"
														}), tagged: [],
														updatedAt: "2025-09-30T00:00:00.000Z",
															bookmarks: [],
															bookmarksCount: 0
													},
													{

															id: "2",
														title:
															"Lorem ipsum dolor sit amet consectetur adipisicing elit.",
														subtitle: "Lorem ipsum dolor sit",
														author: "Author",

														category: "Category",

														allowList: [],
														authority: 0,
														locked: false,
														publishedAt: "2025-09-30T00:00:00.000Z",
														url: formatCollectionURL({
															relationTo: "posts",
															slug: "slug"
														}), tagged: [],
														updatedAt: "2025-09-30T00:00:00.000Z",
														bookmarks: [],
														bookmarksCount: 0
													},
													{

															id: "3",
															title:
																"Lorem ipsum dolor sit amet consectetur adipisicing elit.",
															subtitle: "Lorem ipsum dolor sit",
														author: "Author",

														category: "Category",

															allowList: [],
															authority: 0,
															locked: false,
															publishedAt: "2025-09-30T00:00:00.000Z",
														url: formatCollectionURL({
															relationTo: "posts",
															slug: "slug"
														}), tagged: [],
															updatedAt: "2025-09-30T00:00:00.000Z",
															bookmarks: [],
															bookmarksCount: 0
													},
													{

															id: "4",
														title:
															"Lorem ipsum dolor sit amet consectetur adipisicing elit.",
														subtitle: "Lorem ipsum dolor sit",
														author: "Author",

														category: "Category",

														allowList: [],
														authority: 0,
														locked: false,
														publishedAt: "2025-09-30T00:00:00.000Z",
														url: formatCollectionURL({
															relationTo: "posts",
															slug: "slug"
														}), tagged: [],
														updatedAt: "2025-09-30T00:00:00.000Z",
														bookmarks: [],
														bookmarksCount: 0
													},
													{

															id: "5",
														title:
															"Lorem ipsum dolor sit amet consectetur adipisicing elit.",
														subtitle: "Lorem ipsum dolor sit",
														author: "Author",

														category: "Category",

														allowList: [],
														authority: 0,
														locked: false,
														publishedAt: "2025-09-30T00:00:00.000Z",
														url: formatCollectionURL({
															relationTo: "posts",
															slug: "slug"
														}), tagged: [],
														updatedAt: "2025-09-30T00:00:00.000Z",
														bookmarks: [],
														bookmarksCount: 0
													}
												]}
											/>
										</div>
										<div className={"relative block"}>
											<ArchiveFeatureCard
												type={"right"}
												contents={[
													{

														id: "1",
														title:
															"Lorem ipsum dolor sit amet consectetur adipisicing elit.",
														subtitle: "Lorem ipsum dolor sit",
														author: "Author",

														category: "Category",

														allowList: [],
														authority: 0,
														locked: false,
														publishedAt: "2025-09-30T00:00:00.000Z",
														url: formatCollectionURL({
															relationTo: "posts",
															slug: "slug"
														}), tagged: [],
														updatedAt: "2025-09-30T00:00:00.000Z",
														bookmarks: [],
														bookmarksCount: 0

													},
													{
														id: "2",
														title:
															"Lorem ipsum dolor sit amet consectetur adipisicing elit.",
														subtitle: "Lorem ipsum dolor sit",
														author: "Author",

														category: "Category",

														allowList: [],
														authority: 0,
														locked: false,
														publishedAt: "2025-09-30T00:00:00.000Z",
														url: formatCollectionURL({
															relationTo: "posts",
															slug: "slug"
														}), tagged: [],
														updatedAt: "2025-09-30T00:00:00.000Z",
														bookmarks: [],
														bookmarksCount: 0
													},
													{

														id: "3",
														title:
															"Lorem ipsum dolor sit amet consectetur adipisicing elit.",
														subtitle: "Lorem ipsum dolor sit",
														author: "Author",

														category: "Category",

														allowList: [],
														authority: 0,
														locked: false,
														publishedAt: "2025-09-30T00:00:00.000Z",
														url: formatCollectionURL({
															relationTo: "posts",
															slug: "slug"
														}), tagged: [],
														updatedAt: "2025-09-30T00:00:00.000Z",
														bookmarks: [],
														bookmarksCount: 0

													},
													{

														id: "4",
														title:
															"Lorem ipsum dolor sit amet consectetur adipisicing elit.",
														subtitle: "Lorem ipsum dolor sit",
														author: "Author",

														category: "Category",

														allowList: [],
														authority: 0,
														locked: false,
														publishedAt: "2025-09-30T00:00:00.000Z",
														url: formatCollectionURL({
															relationTo: "posts",
															slug: "slug"
														}), tagged: [],
														updatedAt: "2025-09-30T00:00:00.000Z",
														bookmarks: [],
														bookmarksCount: 0

													},
													{

														id: "5",
														title:
															"Lorem ipsum dolor sit amet consectetur adipisicing elit.",
														subtitle: "Lorem ipsum dolor sit",
														author: "Author",

														category: "Category",

														allowList: [],
														authority: 0,
														locked: false,
														publishedAt: "2025-09-30T00:00:00.000Z",
														url: formatCollectionURL({
															relationTo: "posts",
															slug: "slug"
														}), tagged: [],
														updatedAt: "2025-09-30T00:00:00.000Z",
														bookmarks: [],
														bookmarksCount: 0

													}
												]}
											/>
										</div>
									</div>
								</div>
							</div>
						</div>
						<div className="mx-auto w-full max-w-[calc(100vw-80px)] px-[20px]">
							{posts.docs.map(({slug, author, category, ...post}) => (
								<TaggedItem key={post.id} {...post} author={author.name}
								            category={category.title}
								            url={formatCollectionURL({relationTo: "posts", slug})}/>
							))}
						</div>
					</div>
				</div>
			</PageClient>
		</RPage>
	);
}

export function generateMetadata(): Metadata {
	return {
		title: `Articles & Essays`,
		description: `The latest heard around the estate.`
	};
}
