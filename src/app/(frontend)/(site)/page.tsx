import { HomeArticleLayout } from "@/components/layouts/HomeArticleLayout";

import { RPage } from "@/components/UX/Transition";

import { Metadata } from "next";
import {queryPostOverviews} from "@/payload/collections/Posts/api/queryPostOverviews";

export default async function HomePage() {
  const posts = await queryPostOverviews({
    limit: 8,
    overrideAccess: true
  });

  return (
    <RPage key={"home"} slug={["home"]} type={"pages"}>
      <div className="pt-[23px] pb-10 lg:pt-[80px]">
        <HomeArticleLayout posts={posts.docs}/>
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
