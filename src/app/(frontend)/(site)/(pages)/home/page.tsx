import {HomeArticleLayout} from "@/components/layouts/HomeArticleLayout";
import {RPage} from "@/components/UX/Transition";
import {queryPostOverviews} from "@/payload/collections/Posts/api/queryPostOverviews";
import {Metadata} from "next";
import {Suspense} from "react";

export default async function HomePage() {
	const posts = await getHomePosts();
	return (
		<RPage slug={["home"]} type={"pages"}>
			<div className="pt-30 pb-10 md:pt-[23px] lg:pt-[80px]">
				<div>
					<Suspense>
						<HomeArticleLayout posts={posts.docs}/></Suspense>
				</div>
			</div>
		</RPage>
	);
}

async function getHomePosts() {
	"use cache"
	const posts = await queryPostOverviews({
		limit: 8,
		where: {
			_status: {
				equals: "published"
			}
		},
		sort: "-publishedAt",
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
