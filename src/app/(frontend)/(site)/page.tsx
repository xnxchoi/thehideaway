import {HomeArticleLayout} from "@/components/layouts/HomeArticleLayout";

import {RPage} from "@/components/UX/Transition";
import {queryPostOverviews} from "@/payload/collections/Posts/api/queryPostOverviews";

import {Metadata} from "next";
import {cacheLife} from "next/cache";
import {Suspense} from "react";

export default async function HomePage() {
	const posts = await getHomePosts();

	return (
		<RPage key={"home"} slug={["home"]} type={"pages"}>
			<div className="pt-[23px] pb-10 lg:pt-[80px]">
				<Suspense>
					<HomeArticleLayout posts={posts.docs}/></Suspense>
			</div>
		</RPage>
	);
}

async function getHomePosts() {
	"use cache"
	cacheLife("hours")
	const posts = await queryPostOverviews({
		limit: 8,
		page: 1,
		overrideAccess: true
	});
	return posts;
}

export function generateMetadata(): Metadata {
	return {
		title: `Reception`,
		description: `THE HIDEAWAY.`
	};
}
