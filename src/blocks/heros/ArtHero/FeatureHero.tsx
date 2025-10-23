import type { SingleArticle } from "@/types/collections/posts";
import type React from "react";
import {
  CoverAuthor,
  CoverCard,
  CoverImage,
  CoverMeta,
  CoverSubtitle,
  CoverTag,
  CoverTitle,
  CoverTitleCard,
  CoverWrap
} from "./components";
import { ProgressiveBlur } from "@/components/UX/Blur/ProgressiveBlur";
type INN = "category" | "title" | "subtitle" | "publishedAt" | "author";
export const FeaturedCard: React.FC<{
  post: Required<Pick<SingleArticle, INN>> & Partial<Omit<SingleArticle, INN>>;
}> = ({ post }) => {
  const { category, image, author, publishedAt, title, subtitle } = post;
  const darkmode = image?.darkmode || false;
  return (
    <CoverWrap>
      <CoverCard
        className="featured group"
        data-theme={(darkmode && "dark") || ""}
      >
        <CoverTitleCard className={"group-dark:text-faded-white!"}>
          <CoverTag category={category} />
          <CoverTitle title={title} />
          <CoverSubtitle subtitle={subtitle} />
          <CoverAuthor author={author} className="leading-[1.17]" />
          <CoverMeta publishedAt={publishedAt} />
          <div className="featured rp_thumb select-none">
            <CoverImage image={image} />
            <ProgressiveBlur
              className={
                "absolute right-0 bottom-0 left-0 z-10 h-[45%] overflow-hidden rounded-(--cardBorder)"
              }
              direction={"bottom"}
            />
            <div
              className={
                "absolute right-0 bottom-0 left-0 h-[45%] overflow-hidden rounded-(--cardBorder) bg-linear-to-b from-background/0 from-20% via-background/25 via-70% to-background/45 to-100% dark:to-background/65"
              }
            />
            <div className="absolute right-0 bottom-0 left-0 z-5 h-full overflow-hidden rounded-(--cardBorder) bg-transparent backdrop-brightness-110 dark:backdrop-brightness-90" />
          </div>
        </CoverTitleCard>
      </CoverCard>
    </CoverWrap>
  );
};
