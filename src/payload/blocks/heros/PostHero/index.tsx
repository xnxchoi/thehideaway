import React from "react";
import { formatDateTime } from "@/utilities/formatDateTime";
import { FrontImage } from "@/components/UX/Media/FrontImage";
import { ArticleOverview } from "@/types/collections/posts";

export const PostHero: React.FC<{
  post: ArticleOverview;
}> = ({ post }) => {
  const {
    image,
    author: authors,
    publishedAt,
    slug,
    title,
    bookmarks,
    bookmarksCount,
    category,
    id
  } = post;

  return (
    <div className="relative -mt-[10.4rem] flex items-end">
      <div className="relative z-10 container pb-8 text-white lg:grid lg:grid-cols-[1fr_48rem_1fr]">
        <div className="col-span-1 col-start-1 md:col-span-2 md:col-start-2">
          <div className="mb-6 text-sm uppercase"></div>
          <div className="">
            <h1 className="mb-6 text-3xl md:text-5xl lg:text-6xl">{title}</h1>
          </div>
          <div className="flex flex-col gap-4 md:flex-row md:gap-16">
            <div className="flex flex-col gap-4">
              {authors && (
                <div className="flex flex-col gap-1">
                  <p className="text-sm">Author</p>
                  {authors.name}
                </div>
              )}
            </div>
            {publishedAt && (
              <div className="flex flex-col gap-1">
                <p className="text-sm">Date Published</p>
                <time dateTime={publishedAt}>
                  {formatDateTime(publishedAt)}
                </time>
              </div>
            )}
          </div>
        </div>
      </div>
      <div className="min-h-[80vh] select-none">
        {image && (
          <FrontImage
            fill
            priority={false}
            loading="lazy"
            imgClassName="-z-10 object-cover"
            resource={image}
          />
        )}
        <div className="pointer-events-none absolute bottom-0 left-0 h-1/2 w-full bg-linear-to-t from-black to-transparent" />
      </div>
    </div>
  );
};
