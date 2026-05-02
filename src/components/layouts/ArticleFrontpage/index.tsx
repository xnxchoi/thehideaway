import { Link } from "@/components/core/Link/Link";
import { FrontImage } from "@/components/core/Media/FrontImage";
import { PlaceHolderImage } from "@/components/core/Media/Image/PlaceHolderImage";
import { HomeSquare } from "@/components/sections/HomeSquare";
import { RP_BadgeTag } from "@/components/UX/RP_BadgeTag";
import { cn } from "@/lib/utils";
import { PostOverview } from "@/types/collections/posts";
import { DateTime } from "luxon";
import { ComponentProps, ComponentPropsWithoutRef } from "react";

export const ArticleHero = (props: {
  posts: PostOverview[];
  className?: string;
}) => {
  const { posts, className } = props;

  return (
    <div className="mx-2.5 my-0 min-h-[85vh] max-w-240 sm:mx-auto lg:max-w-[98vw]">
      <div
        className={cn(
          `mb-[48px] justify-center gap-x-[20px] rounded-4xl bg-linear-to-b from-faded-background/95 to-transparent p-5 bg-blend-darken md:block md:p-8 lg:mr-8 lg:ml-8 xl:mb-[100px] xl:flex xl:gap-x-[90px] dark:from-off-black/95`
        )}
      >
        <div className="mb-6 border-b border-solid border-off-foreground/50 md:min-w-1/2 md:flex-1 md:border-b-0 md:pb-0 lg:min-w-[680px]">
          <div className="grid grid-cols-[1fr_1fr] gap-y-[20px] lg:grid-cols-[repeat(4,1fr)] lg:gap-x-[20px]">
            {posts[0] && <HomeSquare article={posts[0]} />}
            {posts[1] && (
              <Link
                href={"/essays/" + `${posts[1].slug}`}
                className="grid gap-y-4 border-t border-r border-solid border-foreground/50 bg-transparent p-[20px] pl-0 wrap-break-word decoration-[none] md:border-b lg:col-[1/3] lg:row-2 lg:mr-[-10px] lg:grid-cols-[1fr_1fr] lg:gap-x-[20px] lg:gap-y-8"
              >
                <div
                  className={cn(
                    "relative aspect-4/3 min-h-[1px] w-full min-w-[1px] self-start rounded-[5px] lg:row-[1/3] lg:aspect-square"
                  )}
                >
                  {(posts[1].image && (
                    <FrontImage
                      aspectRatio={1}
                      imgClassName="rounded-[5px] absolute object-cover top-0 block w-full h-full max-w-[100%] border-0 transition-opacity duration-400 backface-hidden"
                      resource={posts[1].image}
                    />
                  )) || (
                    <PlaceHolderImage className="aspect-square rounded-[5px]" />
                  )}
                </div>
                <RP_BadgeTag
                  content={
                    (posts[1]?.category &&
                      typeof posts[1].category === "object" &&
                      posts[1].category.title) ||
                    "RP"
                  }
                />
                <p className="m-0 text-[16px] font-bold tracking-[-.01em] lg:col-[2] lg:row-[2] lg:self-end">
                  <span className="text-3xl text-balance">
                    {posts[1].title}
                  </span>
                </p>
              </Link>
            )}
            {posts[2] && (
              <Link
                href={"/essays/" + `${posts[2].slug}`}
                className="grid gap-y-4 border-t-[1px] border-r-0 border-b-[1px] border-foreground/50 bg-transparent p-[20px] pr-0 break-words decoration-[none] lg:col-[3/5] lg:row-2 lg:mr-[0px] lg:ml-[-10px] lg:grid-cols-[1fr_1fr] lg:gap-x-[20px] lg:gap-y-8"
              >
                <div className="relative aspect-4/3 min-h-[1px] w-full min-w-[1px] self-start rounded-[5px] lg:row-[1/3] lg:aspect-square">
                  {(posts[2].image && (
                    <FrontImage
                      aspectRatio={1}
                      loading="eager"
                      imgClassName="rounded-[5px] absolute object-cover top-0 block w-full h-full max-w-[100%] border-0 transition-opacity duration-400 backface-hidden"
                      resource={posts[2].image}
                    />
                  )) || (
                    <PlaceHolderImage className="aspect-square rounded-[5px]" />
                  )}
                </div>
                <RP_BadgeTag
                  content={
                    (posts[2]?.category &&
                      typeof posts[2].category !== "string" &&
                      posts[2].category.title) ||
                    "RP"
                  }
                />
                <p className="m-0 text-[16px] font-bold tracking-[-.01em] lg:col-[2] lg:row-[2] lg:self-end">
                  <span className="text-3xl text-balance">
                    {posts[2].title}
                  </span>
                </p>
              </Link>
            )}
          </div>
        </div>

        <ArticleList posts={posts} />
      </div>
    </div>
  );
};
const ArticleList = (
  props: { posts: PostOverview[] } & ComponentProps<"div">
) => {
  const { posts, ...rest } = props;

  return (
    <div
      className="m-auto w-full max-w-[96vw] pt-[1rem] lg:m-0 lg:max-w-[420px]"
      {...rest}
    >
      <div>
        <div className="mb-0 flex items-center justify-between gap-x-[16px]">
          <h2 className="text-[16px]">Headliners</h2>
        </div>
      </div>
      {posts.length > 0
        ? posts.map((doc, index) => {
            const {
              title,
              publishedAt,
              author,
              subtitle,
              updatedAt,
              image,
              slug,
              category,
              id,
              tagged,
              bookmarks,
              bookmarksCount
            } = doc;

            return (
              <Article
                articleID={id}
                index={index}
                allowList={[]}
                bookmarks={bookmarks}
                bookmarksCount={bookmarksCount}
                category={category}
                image={image}
                author={author}
                tagged={tagged}
                subtitle={subtitle}
                title={title!}
                publishedAt={publishedAt || ""}
                slug={slug ?? ""}
                updatedAt={updatedAt}
                key={index}
              />
            );
          })
        : [1, 2, 3, 4, 5].map((r) => (
            <div
              key={"r-" + r}
              className="mb-0 flex items-center justify-between gap-x-[16px]"
            >
              <h2 className="text-[16px]"></h2>
            </div>
          ))}
    </div>
  );
};

const Article = async (
  props: ComponentPropsWithoutRef<"div"> &
    Omit<PostOverview, "id"> & {
      articleID: string;
      index: number;
    }
) => {
  // "use cache";
  // cacheLife("max");
  const {
    title,
    image,
    slug,
    publishedAt,
    author,
    index,
    category,
    subtitle,
    articleID,
    tagged,
    updatedAt
  } = props;
  return (
    <>
      <div className="absolute z-[10] mt-[32px] -ml-[4px] flex h-[14px] w-[14px] items-center justify-center rounded-[50%] bg-off-foreground/40 text-[9px] lg:mt-[20px] lg:ml-[-40px] lg:h-[20px] lg:w-[20px] lg:text-[1.1rem]">
        {index + 1}
      </div>
      <div className="relative flex flex-row-reverse justify-between border-b-[1px] border-foreground/50 pt-[16px] pr-0 pb-[15px] pl-0 lg:pt-[20px] lg:pb-[20px]">
        <div className="relative ml-[16px] aspect-[4/3] h-[75px] self-start bg-off-background/10">
          {(image && (
            <FrontImage
              className="border-color-off-background/90 absolute inset-0 rounded-[4px] border-[1px] border-solid"
              resource={image}
            />
          )) || (
            <PlaceHolderImage className="border-color-off-background/90 absolute inset-0 rounded-[4px] border-[1px] border-solid" />
          )}
        </div>
        <div className="grow self-start">
          <div className="max-lg:px-[10px] max-lg:py-[5px]">
            <div className="relative max-lg:pl-[10px]">
              <div>
                <div className="text-[18px] tracking-normal lg:text-[20px]">
                  <Link
                    className="shadow-[inset 0 -1px 0 0 transparent] font-bold before:absolute before:inset-0 before:z-[1] before:h-full before:w-full before:content-['']"
                    href={"/essays/" + `${slug}`}
                  >
                    {title}
                  </Link>
                </div>
              </div>
              <div className="relative mt-[6px] leading-[1px]">
                <span className="inline text-[1.1rem] tracking-[0.1em] uppercase">
                  <span>{author.name}</span>
                </span>
                <span className="ml-[.75em] inline text-[1.1rem] tracking-[0.1em] uppercase">
                  <time dateTime={publishedAt}>
                    {publishedAt.length > 0 &&
                      DateTime.fromISO(publishedAt).toRelative()}
                  </time>
                </span>
                <span className="mx-3 inline font-sans text-[1.1rem] tracking-[0.1em] text-faded-foreground uppercase before:content-['|']">
                  <Link
                    className="mr-2 inline-block whitespace-nowrap"
                    href={"/essays/" + slug + "#comments"}
                  >
                    <svg
                      className="inline fill-current align-middle"
                      width={12}
                      height={12}
                      fill="none"
                      viewBox="0 0 12 12"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <title>Comments</title>
                      <desc>Comment Icon Bubble</desc>
                      <path
                        fillRule="evenodd"
                        clipRule="evenodd"
                        d="M2.8999 2.10001C2.76729 2.10001 2.64012 2.15268 2.54635 2.24645C2.45258 2.34022 2.3999 2.4674 2.3999 2.60001V9.3929L3.6928 8.10001H9.8999C10.0325 8.10001 10.1597 8.04733 10.2535 7.95356C10.3472 7.85979 10.3999 7.73261 10.3999 7.60001V2.60001C10.3999 2.4674 10.3472 2.34022 10.2535 2.24645C10.1597 2.15268 10.0325 2.10001 9.8999 2.10001H2.8999ZM1.83924 1.53935C2.12055 1.25804 2.50208 1.10001 2.8999 1.10001H9.8999C10.2977 1.10001 10.6793 1.25804 10.9606 1.53935C11.2419 1.82065 11.3999 2.20218 11.3999 2.60001V7.60001C11.3999 7.99783 11.2419 8.37936 10.9606 8.66067C10.6793 8.94197 10.2977 9.10001 9.8999 9.10001H4.10701L1.3999 11.8071V2.60001C1.3999 2.20218 1.55794 1.82065 1.83924 1.53935Z"
                      />
                    </svg>
                    <span
                      className="group mx-[4px] my-0 inline-flex flex-[0_0_auto] leading-[20px] data-[count=0]:before:content-['+']"
                      data-count={0}
                    >
                      <span className="text-[1.1rem] tracking-widest text-faded-foreground uppercase group-data-[count=0]:hidden">
                        0
                      </span>
                    </span>
                  </Link>
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};
