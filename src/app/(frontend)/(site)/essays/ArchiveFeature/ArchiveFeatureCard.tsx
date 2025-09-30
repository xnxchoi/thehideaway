import { Link } from "@/components/UX/Link";
import { FrontImage } from "@/components/UX/Media/FrontImage";
import { RP_BadgeTag } from "@/components/UX/RP_BadgeTag";
import { cn } from "@/lib/utils";
import { CoverCard } from "@/payload/blocks/heros/ArtHero/components";
import type { ArticleOverview } from "@/types/collections/posts";
import type { CSSProperties, ReactNode } from "react";

export type OverviewItem = ArticleOverview & { collection: "posts" };
export function ArchiveFeatureCard(props: {
  contents: OverviewItem[];
  type?: "focus1" | "focus2";
}) {
  const { contents, type = "focus1" } = props;
  let first, second, third, fourth;
  if (contents.length > 0) {
    first = contents[0] as OverviewItem;
  }
  if (contents.length > 1) {
    second = contents[1] as OverviewItem;
  }
  if (contents.length > 2) {
    third = contents[2] as OverviewItem;
  }
  if (contents.length > 3) {
    fourth = contents[3] as OverviewItem;
  }
  return (
    <OuterWrap>
      {first && <FocusHero type={type} item={first} />}
      {second && <SideHero type={type} item={second} />}
      {third && fourth && <SplitBar type={type} items={[third, fourth]} />}
    </OuterWrap>
  );
}
function OuterWrap({ children }: { children: ReactNode }) {
  return (
    <div className={"h-full p-0"}>
      <div className={"relative h-full w-full"}>
        <div
          className={
            "relative z-[150] flex w-[calc(100%-4rem)] max-w-[1440px] flex-col items-center justify-center px-0 py-[1rem]"
          }
        >
          <CoverCard
            style={
              {
                "--highlight": "var(--bleu-400)"
              } as CSSProperties
            }
          >
            <div
              className={
                "grid gap-y-[6rem] lg:grid-cols-[repeat(6,1fr)] lg:gap-x-[2rem] lg:gap-y-[2.4rem]"
              }
            >
              {children}
            </div>
          </CoverCard>
        </div>
      </div>
    </div>
  );
}
function FocusHero({
  item,
  type = "focus1"
}: {
  item: OverviewItem;
  type?: "focus1" | "focus2";
}) {
  const {
    title,

    author,

    category,
    publishedAt,
    slug,
    id
  } = item;
  return (
    <div
      className={cn(
        "relative col-[1] grid items-center gap-y-[2rem] rounded-[1rem] bg-[oklch(var(--highlight,--faded-fg)/.8)] p-[2rem] text-center lg:mb-0 lg:grid-cols-[1fr_1fr] lg:gap-x-[2rem]",
        type === "focus1"
          ? "lg:col-[1/5] lg:row-[1/3]"
          : "lg:col-[3/-1] lg:row-[1/3]"
      )}
    >
      <Link
        className={"absolute inset-0 z-0 h-full w-full"}
        href={`/${item.collection === "posts" ? "essays" : "delta"}/${slug}`}
      />
      <div
        className={
          "col-[1] min-h-px w-full min-w-px self-start rounded-[1rem] pt-[100%] lg:row-[1/5]"
        }
      >
        {"image" in item && (
          <FrontImage
            imgClassName="rounded-[5px] absolute object-cover top-0 block w-full h-full max-w-[100%] border-0 transition-opacity duration-400 backface-hidden"
            resource={item.image}
          />
        )}
      </div>
      <RP_BadgeTag
        wrapperClassName={
          "order-2 col-[2/-1] [&_>*]:!text-foreground [&_>*]:!border-foreground"
        }
        content={category.title}
      />
      <p
        className={
          "order-3 col-[2/-1] m-0 text-3xl leading-[.9] font-bold tracking-[-.01em] uppercase lg:text-[4.2rem]"
        }
      >
        {title}
      </p>
      <div
        className={
          "order-5 col-[2] inline-block font-sans text-[1.12rem] uppercase"
        }
      >
        <div
          className={
            "mx-auto mt-0 mb-[2rem] block h-[1.28rem] w-[1.28rem] bg-current clip-sun"
          }
        ></div>
        {"By " + author.name}
      </div>
      <p
        className={
          "order-4 m-0 block leading-[1.2] lg:col-[2] lg:text-[1.6rem]"
        }
      >
        {("subtitle" in item && item.subtitle) || ""}
      </p>
    </div>
  );
}
function SideHero({
  item,
  type = "focus1"
}: {
  item: OverviewItem;
  type?: "focus1" | "focus2";
}) {
  const {
    title,

    author,

    category,
    publishedAt,
    slug,
    id
  } = item;
  return (
    <div
      className={cn(
        "relative grid grid-cols-[2rem_1fr_2rem] grid-rows-[1fr] gap-y-[2rem] rounded-[1rem] bg-faded-foreground text-faded-background",
        type === "focus1"
          ? "lg:col-[5/-1] lg:row-[1/4]"
          : "lg:col-[1/3] lg:row-[1/4]"
      )}
    >
      <Link
        className={"absolute inset-0 z-0 h-full w-full"}
        href={`/${item.collection === "posts" ? "essays" : "delta"}/${slug}`}
      />
      <div
        className={
          "relative col-[1/-1] row-[1/8] self-start rounded-[1rem] pt-[177%] lg:h-full lg:pt-0"
        }
      >
        {"image" in item && (
          <FrontImage
            imgClassName="rounded-[5px] absolute object-cover top-0 block w-full h-full max-w-[100%] border-0 transition-opacity duration-400 backface-hidden"
            resource={item.image}
          />
        )}
      </div>
      <RP_BadgeTag
        wrapperClassName={"order-2 col-[2] row-[3]"}
        content={category.title}
      />
      <p
        className={
          "order-3 col-[2] row-[4] m-0 text-[1.5rem] leading-[.9] font-bold tracking-[-.01em] uppercase lg:text-[3.2rem]"
        }
      >
        {title}
      </p>
      <div
        className={
          "order-2 col-[2] row-[6] inline-block font-sans text-[1.12rem] uppercase"
        }
      >
        <div
          className={
            "mx-auto mt-0 mb-[2rem] block h-[1.28rem] w-[1.28rem] bg-current clip-sun"
          }
        ></div>
        {"By " + author.name}
      </div>
      <p
        className={
          "order-4 col-[2] row-[5] m-0 block leading-[1.2] lg:text-[1.6rem]"
        }
      >
        {("subtitle" in item && item.subtitle) || ""}
      </p>
    </div>
  );
}
function SplitBar({
  items,
  type = "focus1"
}: {
  items: [OverviewItem, OverviewItem];
  type?: "focus1" | "focus2";
}) {
  const [item1, item2] = items;
  const {
    title: title1,

    author: author1,

    category: category1,
    publishedAt: publishedAt1,
    slug: slug1,
    id: id1
  } = item1;
  const {
    title: title2,

    author: author2,

    category: category2,
    publishedAt: publishedAt2,
    slug: slug2,
    id: id2
  } = item2;
  return (
    <>
      <div
        className={cn(
          "lg:border-b-solid lg:border-t-solid lg:border-r-solid relative grid grid-cols-[minmax(100px,1fr)_repeat(3,1fr)] grid-rows-[repeat(2,auto)_1fr] gap-x-[2rem] border-0 border-faded-foreground lg:border-t-[1px] lg:border-r-[1px] lg:border-b-[1px] lg:p-[2.4rem_2rem_2.4rem_0] lg:px-0 lg:py-[2.4rem]",
          type === "focus1"
            ? "gap-y-[1rem] lg:col-[1/3]"
            : "gap-y-[2rem] lg:col-[3/5]"
        )}
      >
        <Link
          className={"absolute inset-0 z-0 h-full w-full"}
          href={`/${item1.collection === "posts" ? "essays" : "delta"}/${slug1}`}
        />
        <div className="relative col-[1] row-[1/4] min-h-[1px] w-full min-w-[1px] self-start rounded-[5px] pt-[100%] lg:aspect-square">
          {"image" in item1 && (
            <FrontImage
              imgClassName="rounded-[5px] absolute object-cover top-0 block w-full h-full max-w-[100%] border-0 transition-opacity duration-400 backface-hidden"
              resource={item1.image}
            />
          )}
        </div>
        <RP_BadgeTag
          wrapperClassName={
            "order-2 col-[2/-1] [&_>*]:!text-foreground [&_>*]:!border-foreground"
          }
          content={category1.title}
        />
        <p className="order-3 col-[2/-1] m-0 text-[16px] font-bold tracking-[-.01em] lg:text-[18px]">
          {title1}
        </p>
      </div>
      <div
        className={cn(
          "lg:border-b-solid lg:border-t-solid relative grid grid-cols-[minmax(100px,1fr)_repeat(3,1fr)] grid-rows-[repeat(2,auto)_1fr] border-0 border-faded-foreground lg:ml-[-2rem] lg:border-t-[1px] lg:border-b-[1px] lg:px-[2rem] lg:py-[2.4rem]",
          type === "focus1"
            ? "gap-x-[2rem] gap-y-[1rem] lg:col-[3/5]"
            : "gap-x-[2rem] gap-y-[2rem] lg:col-[5/-1]"
        )}
      >
        <Link
          className={"absolute inset-0 z-0 h-full w-full"}
          href={`/${item2.collection === "posts" ? "essays" : "delta"}/${slug2}`}
        />
        <div className="relative col-[1] row-[1/4] min-h-[1px] w-full min-w-[1px] self-start rounded-[5px] pt-[100%] lg:aspect-square">
          {"image" in item2 && (
            <FrontImage
              imgClassName="rounded-[5px] absolute object-cover top-0 block w-full h-full max-w-[100%] border-0 transition-opacity duration-400 backface-hidden"
              resource={item2.image}
            />
          )}
        </div>
        <RP_BadgeTag
          wrapperClassName={
            "order-2 col-[2/-1] [&_>*]:!text-foreground [&_>*]:!border-foreground"
          }
          content={category2.title}
        />
        <p className="order-3 col-[2/-1] m-0 text-[16px] font-bold tracking-[-.01em] lg:text-[18px]">
          {title2}
        </p>
      </div>
    </>
  );
}
