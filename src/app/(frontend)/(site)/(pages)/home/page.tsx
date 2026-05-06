export const dynamic = "force-dynamic";

import { ArticleHero } from "@/components/layouts/ArticleFrontpage";
import { RPage } from "@/components/UX/Transition";
import { queryPostOverviews } from "@/payload/collections/Posts/api/queryPostOverviews";
import { Metadata } from "next";
import { Suspense } from "react";

/**
 * Home page.
 *
 * The 250vh `StationHideawayHero` parallax has been removed from this
 * route — the 3D cassette is reserved as a runway object and now lives
 * only on hand-crafted Tape pages (`/radio/tapes/vol-NNN/`). The home
 * Radio moment will be reinstated as the J-Card hero (a typeset
 * cassette inlay tied to the current "in rotation" release) when that
 * component lands.
 */
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
        {/* TODO(radio-jcard-hero): mount <RadioJCardHero release={...} />
            once the J-Card component + dynamic forthcoming-release wiring
            land (Phase 2 step 8). */}
      </div>
    </RPage>
  );
}

async function getHomePosts() {
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
