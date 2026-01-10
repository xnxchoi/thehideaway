import { HomeArticleLayout } from "@/components/layouts/HomeArticleLayout";
import { RPage } from "@/components/UX/Transition";
import { Metadata } from "next";
import {queryPostOverviews} from "@/payload/collections/Posts/api/queryPostOverviews";
export const dynamic = "force-dynamic";
export default async function HomePage() {
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

  return (
    <RPage slug={["home"]} type={"pages"}>
	    <div className="pt-30 pb-10 md:pt-[23px] lg:pt-[80px]">
		    <div>
          <HomeArticleLayout posts={posts} />
        </div>
      </div>
    </RPage>
  );
}

export function generateMetadata(): Metadata {
  return {
    title: `Reception`,
    description: `THE HIDEAWAY.`
  };
}
