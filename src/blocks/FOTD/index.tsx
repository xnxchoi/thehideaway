import { ComponentProps, ComponentPropsWithoutRef } from "react";
import Image from "next/image";
import { Link } from "@/components/UX/Link/Link";
import { DateTime } from "luxon";
import { HomeSquare } from "@/components/sections/ContentShowcase";
import { RP_BadgeTag } from "@/components/UX/RP_BadgeTag";
import { FrontImage } from "@/components/core/Media/FrontImage";
import { PostOverview } from "@/types/collections/posts";

export const HomeArticleLayout = (props: { posts: PostOverview[] }) => {
  const { posts } = props;

  return (
    <div
      className="mb-[48px] justify-center gap-x-[20px] rounded-[2rem] p-[2rem] md:block lg:mr-[2rem] lg:ml-[2rem] xl:mb-[100px] xl:flex xl:gap-x-[90px]"
      style={{
        background:
          "linear-gradient(180deg, var(--faded-bg), oklch(from var(--bg) l c h/0))"
      }}
    >
      <div className="border-foreground/50)] mb-6 border-b-[1px] border-solid md:min-w-1/2 md:flex-[1] md:border-b-0 md:pb-0 lg:min-w-[680px]">
        <div className="grid grid-cols-[1fr_1fr] gap-y-[20px] lg:grid-cols-[repeat(4,1fr)] lg:gap-x-[20px]">
          {posts[0] && <HomeSquare article={posts[0]} />}
          {posts[1] && (
            <Link
              href={"/essays/" + (posts[1].slug ?? "")}
              className="grid gap-y-[20px] border-t-[1px] border-r-[1px] border-b-[1px] border-solid border-foreground/50 bg-transparent p-[20px] pl-0 break-words decoration-[none] lg:col-[1/3] lg:row-[2] lg:mr-[-10px] lg:grid-cols-[1fr_1fr] lg:gap-x-[20px]"
            >
              <div className="relative min-h-[1px] w-full min-w-[1px] self-start rounded-[5px] pt-[100%] lg:row-[1/3]">
                {posts[1].image && (
                  <FrontImage
                    imgClassName="rounded-[5px] absolute object-cover top-0 block w-full h-full max-w-[100%] border-0 transition-opacity duration-400 backface-hidden"
                    resource={posts[1].image}
                  />
                )}
              </div>
              <RP_BadgeTag
                content={
                  (posts[1]?.category &&
                    typeof posts[1].category !== "string" &&
                    posts[1].category.title) ||
                  "RP"
                }
              />
              <p className="m-0 text-[16px] font-bold tracking-[-.01em] lg:col-[2] lg:row-[2] lg:self-end">
                <span className="text-3xl text-balance">{posts[1].title}</span>
              </p>
            </Link>
          )}
          {posts[2] && (
            <Link
              href={"/essays/" + decodeURIComponent(posts[2].slug ?? "")}
              className="grid gap-y-[20px] border-t-[1px] border-r-0 border-b-[1px] border-foreground/50 bg-transparent p-[20px] pr-0 break-words decoration-[none] lg:col-[3/5] lg:row-[2] lg:mr-[0px] lg:ml-[-10px] lg:grid-cols-[1fr_1fr] lg:gap-x-[20px]"
            >
              <div className="relative min-h-[1px] w-full min-w-[1px] self-start rounded-[5px] pt-[100%] lg:row-[1/3] lg:aspect-square">
                {posts[2].image && (
                  <FrontImage
                    imgClassName="rounded-[5px] absolute object-cover top-0 block w-full h-full max-w-[100%] border-0 transition-opacity duration-400 backface-hidden"
                    resource={posts[2].image}
                  />
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
                <span className="text-3xl text-balance">{posts[2].title}</span>
              </p>
            </Link>
          )}
        </div>
      </div>
      <ArticleList posts={posts} />
    </div>
  );
};
const ArticleList = (
  props: { posts: PostOverview[] } & ComponentProps<"div">
) => {
  const { posts, ...rest } = props;

  return (
    <div
      className="m-auto w-full max-w-[96vw] pt-[1rem] md:m-0 lg:max-w-[420px]"
      {...rest}
    >
      <div>
        <div className="mb-0 flex items-center justify-between gap-x-[16px]">
          <h2 className="text-[16px]">Headliners</h2>
        </div>
      </div>
      {posts.length > 0
        ? posts.map((doc, index) => {
            const { title, publishedAt, author, slug } = doc;

            const auth = (author && author.name) || "Author";

            return (
              <Article
                index={index}
                image={doc.image?.value.thumbnailURL || ""}
                author={auth}
                title={title!}
                date={publishedAt || ""}
                link={`/essays/${slug ?? ""}`}
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
export type ArticleProps = {
  title: string;
  image: string;
  link: string;
  date: string;
  author: string;
  index: number;
};
const Article = (props: ComponentPropsWithoutRef<"div"> & ArticleProps) => {
  const { title, image, link, date, author, index } = props;
  return (
    <>
      <div className="absolute z-[10] mt-[30px] ml-[4px] flex h-[15px] w-[15px] items-center justify-center rounded-[50%] bg-off-foreground/40 text-[1.1rem] lg:mt-[20px] lg:ml-[-40px] lg:h-[20px] lg:w-[20px]">
        {index + 1}
      </div>
      <div className="relative flex flex-row-reverse justify-between border-b-[1px] border-foreground/50 pt-[16px] pr-0 pb-[10px] pl-0 lg:pt-[20px] lg:pb-[20px]">
        <div className="relative ml-[16px] aspect-square h-[75px] self-start bg-off-background/10">
          <div>
            {image && (
              <Image
                alt={title}
                width={200}
                height={200}
                className="border-color-off-background/90 rounded-[4px] border-[1px] border-solid"
                style={{
                  position: "absolute",
                  height: "100%",
                  width: "100%",
                  inset: 0,
                  color: "transparent"
                }}
                sizes="100px"
                src={image}
              />
            )}
          </div>
        </div>
        <div className="grow self-start">
          <div>
            <div>
              <div>
                <div className="text-[18px] tracking-normal lg:text-[20px]">
                  <Link
                    className="shadow-[inset 0 -1px 0 0 transparent] font-bold before:absolute before:inset-0 before:z-[1] before:h-full before:w-full before:content-['']"
                    href={link}
                  >
                    {title}
                  </Link>
                </div>
              </div>
              <div className="relative mt-[6px] leading-[1px]">
                <span className="inline text-[1.1rem] tracking-[0.1em] uppercase">
                  <span>{author}</span>
                </span>
                <span className="ml-[.75em] inline text-[1.1rem] tracking-[0.1em] uppercase">
                  <time dateTime={date}>
                    {date.length > 0 && DateTime.fromISO(date).toRelative()}
                  </time>
                </span>
                <span className="mx-3 inline text-[1.1rem] tracking-[0.1em] text-faded-foreground uppercase before:content-['|']">
                  <Link
                    className="mr-2 inline-block whitespace-nowrap"
                    href={link + "/#comments"}
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
                    <span className="mx-[4px] my-0 inline-flex flex-[0_0_auto] leading-[20px]">
                      <span className="text-[1.1rem] tracking-widest text-faded-foreground uppercase">
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
