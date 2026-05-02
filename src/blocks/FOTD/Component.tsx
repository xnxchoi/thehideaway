import { Link } from "@/components/core/Link/Link";
import {
  FOTDBlock as FOTDBlockProps,
  Page,
  type Post,
  Surf
} from "@/payload-types";
import RichText from "../../components/UX/RichText";
import config from "@payload-config";
import Image from "next/image";
import { getPayload } from "payload";
import { FC } from "react";
import "@/styles/__fotd.scss";

export const FOTDBlock: FC<
  {
    id?: string;
  } & FOTDBlockProps
> = async (props) => {
  const {
    subheading,
    populateBy,
    categories,
    selectedDocs,
    relationTo,
    headline,
    limit: limitfromProps
  } = props;
  const limit = limitfromProps || 3;
  let posts: Array<Post | Page | Surf> = [];

  if (populateBy === "collection") {
    const payload = await getPayload({ config });
    const flattenedCategories = categories?.map((category) => {
      if (typeof category === "object") return category.id;
      return category;
    });
    const collectionsTolookfor = relationTo;
    if (!collectionsTolookfor) throw new Error("No collection to search for.");
    for (const col of collectionsTolookfor) {
      const re = await payload
        .find({
          collection: col,
          depth: 1,
          limit,
          ...(flattenedCategories && flattenedCategories.length > 0
            ? {
                where: {
                  category: {
                    in: flattenedCategories
                  }
                }
              }
            : {})
        })
        .then((res) => res.docs);
      posts.push(...re);
    }
  } else if (selectedDocs?.length) {
    const filteredSelectedPosts = selectedDocs.map((post) => {
      if (typeof post.value === "object") return post.value;
    }) as Array<Post | Page>;
    posts = filteredSelectedPosts;
  }
  return (
    <>
      <style>
        {`
        [data-fotd] * {max-width: revert;}`}
      </style>
      <section className="overflow-hidden">
        <div className="relative top-0 min-w-[99vw] origin-[50%_0]" data-fotd>
          <div className="sticky top-0 z-[2] -mt-16 flex h-screen max-h-none w-full items-stretch justify-between bg-background/85 p-[40px_1vw_1vw] text-foreground">
            <div className="relative z-[2] flex h-full w-1/2 flex-col items-start justify-start gap-y-[1vw] rounded-[4px] pt-[1vw] max-md:w-full max-md:flex-nowrap">
              <div className="flex-1 gap-x-[1vw] gap-y-[2vw] border-[1px] border-none border-[oklch(87.6%_0_none/0.5)_var(--color-faded-white)_var(--color-faded-white)]">
                <div className="relative z-[1] mb-auto flex w-5/12 max-w-full flex-col justify-between gap-x-[1vw] gap-y-[2vw] rounded-[2px] border-[1px] border-none border-[oklch(87.6%_0_none/0.5)_var(--color-faded-white)_var(--color-faded-white)] pb-[1vw]">
                  <div>
                    <Image
                      width={456}
                      height={555}
                      src={"/assets/brand/H_P.png"}
                      alt="the Hideaway Logo alternative"
                    />
                  </div>
                  <div className="gap-x-[1vw] gap-y-[2vw] border-[1px] border-none border-[oklch(87.6%_0_none/0.5)_var(--color-faded-white)_var(--color-faded-white)]">
                    <div className="ss01 t-h4">{headline}</div>
                    <div className="s gap-x-[1vw] gap-y-[2vw] border-[1px] border-none border-[oklch(87.6%_0_none/0.5)_var(--color-faded-white)_var(--color-faded-white)]">
                      <div className="t-h5">
                        <RichText data={subheading} />
                      </div>
                      <div className="t-h6">THE HIDEAWAY.</div>
                    </div>
                  </div>
                </div>
                <div className="home-hero-meta gap-x-[1vw] gap-y-[2vw] border-[1px] border-none border-[oklch(87.6%_0_none/0.5)_var(--color-faded-white)_var(--color-faded-white)]">
                  <div>
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      height="30"
                      className="img"
                      viewBox="0 0 812.64 866.3"
                      fill="currentColor"
                    >
                      <path d="m451.98,385.85c-22.87-24.16-31.37-64.77-40.76-141.17l-4.75-38.62-4.75,38.62c-9.4,76.4-17.89,117.01-40.76,141.17-22.81,24.1-61.17,33.05-133.36,42.96l-34.54,4.74,34.54,4.74c72.18,9.91,110.55,18.87,133.36,42.96,22.87,24.16,31.37,64.78,40.76,141.17l4.75,38.62,4.75-38.62c9.4-76.4,17.89-117.01,40.76-141.17,22.81-24.1,61.17-33.05,133.36-42.96l34.54-4.74-34.54-4.74c-72.18-9.91-110.55-18.87-133.36-42.96Z"></path>
                      <path d="m492.97,523.97c-27.38,28.93-43.94,70.26-56.91,133.12.49-.43.97-.86,1.46-1.28-.51.58-1.02,1.16-1.53,1.74,66.84-14.12,91.48-35.49,121.48-66.49s61.32-66.63,74.29-129.49c-.49.43-.97.86-1.46,1.28.51-.58,1.02-1.16,1.53-1.74-66.84,14.12-109.58,31.94-138.85,62.87Z"></path>
                      <path d="m406.32,682.7l-2.91-2.47c-9.1-7.73-18.03-15.43-26.83-23.14.02.11.04.22.07.33-.36-.41-.72-.82-1.08-1.23.34.3.67.6,1.01.89-12.97-62.86-29.53-104.19-56.91-133.12-29.27-30.93-72.01-48.75-138.85-62.87.4.45.79.9,1.19,1.35-.34-.3-.67-.6-1.01-.89,12.97,62.86,30.1,88.56,57.48,117.49,29.26,30.91,71.41,64.35,138.2,78.47,7.61,37.01,14,81.46,20.61,135.23l9.04,73.53,9.05-73.53c6.64-53.98,13.04-98.57,20.7-135.67-8.8,7.7-17.73,15.41-26.83,23.14l-2.91,2.47Z"></path>
                      <path d="m746.88,424.12c-44.79-6.15-82.74-12.11-115.05-18.93,7.18,8.22,14.37,16.56,21.57,25.04l2.47,2.91-2.47,2.91c-7.2,8.48-14.39,16.82-21.57,25.05,32.32-6.82,70.26-12.78,115.05-18.93l65.75-9.03-65.75-9.03Z"></path>
                      <path d="m406.32,183.59l2.91,2.47c9.1,7.73,18.03,15.43,26.83,23.14-7.65-37.1-14.06-81.69-20.7-135.67L406.32,0l-9.04,73.53c-6.64,53.98-13.04,98.57-20.7,135.67,8.8-7.7,17.73-15.41,26.83-23.14l2.91-2.47Z"></path>
                      <path d="m156.76,433.15l2.47-2.91c7.21-8.48,14.39-16.82,21.57-25.05-32.32,6.82-70.26,12.78-115.05,18.93L0,433.15l65.75,9.03c44.79,6.15,82.74,12.11,115.05,18.93-7.18-8.22-14.37-16.56-21.57-25.05l-2.47-2.91Z"></path>
                      <path d="m180.61,410.93c2.89-2.52,5.74-5.05,8.6-7.57,62.05-13.83,102.43-31.43,130.45-61.04,26.22-27.7,42.51-66.78,55.24-125.23.57-.64,1.13-1.28,1.7-1.92-.45.09-.89.2-1.34.29.44-2.06.88-4.14,1.32-6.25-3.05,2.67-6.07,5.35-9.09,8.02-56.65,13.76-84.53,40.81-112.02,66.83-29.76,28.16-58.47,57.72-73.18,119.45-.49.56-.98,1.11-1.48,1.68.38-.08.75-.16,1.13-.24-.46,1.96-.9,3.96-1.33,5.99Z"></path>
                      <path d="m435.87,209.67c.13.14.25.28.38.43,12.94,62.35,29.47,103.43,56.73,132.22,29.22,30.87,71.87,48.69,138.52,62.8.12.11.24.22.37.32-.02-.09-.04-.17-.06-.26,0,0,.02,0,.02,0,0-.01-.02-.02-.03-.03-14.11-66.65-34.45-97.87-65.34-127.1-28.78-27.24-67.34-55.12-129.63-68.18-.26-.23-.51-.45-.77-.68.04.18.08.36.11.54-.1-.02-.2-.04-.3-.06Z"></path>
                    </svg>
                  </div>
                  <div className="t-meta list">
                    <div className="">12.2021</div>
                    <div className="">60 - 250 Hz</div>
                    <div className="c-span">
                      <div className="">+82</div>
                      <div className="">SC - KS</div>
                    </div>
                    <div className="">THE HIDEAWAY, A RESTORED PROJECT</div>
                  </div>
                </div>
              </div>
            </div>
            <div>
              {posts.map((post) => {
                return (
                  <div key={post.id}>
                    <div className="t-meta">{post.title}</div>
                    <Link
                      className="nothingIsActive-cta meta"
                      href={`/${post.title}`}
                    >
                      <div className="t-meta">읽어보기</div>
                    </Link>
                    <div
                      className="w-background-video"
                      style={{ filter: "grayscale(1)" }}
                    ></div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </section>
    </>
  );
};
