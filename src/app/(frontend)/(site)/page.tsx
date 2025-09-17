import { HomeArticleLayout } from "@/components/layouts/HomeArticleLayout";

import { RPage } from "@/components/UX/Transition";

import { Metadata } from "next";
import { queryPostOverview } from "@/payload/collections/Posts/api/queryPostOverview";

export default async function HomePage() {
  const posts = await queryPostOverview({
    limit: 8,
    overrideAccess: true
  });

  return (
    <RPage slug={["home"]} type={"pages"}>
      <div className="pt-[23px] pb-10 lg:pt-[80px]">
        <div className="mx-2.5 my-0 max-w-[600px] sm:mx-auto lg:max-w-[98vw]">
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
