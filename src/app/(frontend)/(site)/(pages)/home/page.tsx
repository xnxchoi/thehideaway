export const dynamic = "force-dynamic";

import { ArticleHero } from "@/components/layouts/ArticleFrontpage";
import { StationHideawayHero } from "@/components/sections/StationHideaway/block";
import { TapePlayer } from "@/components/UX/TapePlayer";
import { Tape3DScene } from "@/components/UX/TapePlayer/visuals/Tape3DScene";
import { RPage } from "@/components/UX/Transition";
import { queryPostOverviews } from "@/payload/collections/Posts/api/queryPostOverviews";
import { Metadata } from "next";
import { Suspense } from "react";

export default async function HomePage() {
  const posts = await getHomePosts();
  return (
    <RPage slug={["home"]} type={"pages"}>
      <div className="pt-30 pb-10 md:pt-[23px] lg:pt-[80px]">
        <div>
          <Suspense>
            <ArticleHero posts={posts.docs} />
          </Suspense>
        </div>
        <StationHideawayHero />
      </div>
    </RPage>
  );
}

async function getHomePosts() {
  // "use cache";
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
