import { ArchiveFeatureCard } from "@/components/content/archive-view/ArchiveFeature/ArchiveFeatureCard";
import { formatCollectionURL } from "@/utilities/formatCollectionURL";

const DemoLayout = () => {
  return (
    <>
      <div className={"relative block"}>
        <ArchiveFeatureCard
          type={"left"}
          contents={[
            {
              id: "1",
              title: "Lorem ipsum dolor sit amet consectetur adipisicing elit.",
              subtitle: "Lorem ipsum dolor sit",
              author: "Author",

              category: "Category",

              allowList: [],
              authority: 0,
              locked: false,
              publishedAt: "2025-09-30T00:00:00.000Z",
              url: formatCollectionURL({
                relationTo: "posts",
                slug: "slug"
              }),
              tagged: [],
              updatedAt: "2025-09-30T00:00:00.000Z",
              bookmarks: [],
              bookmarksCount: 0
            },
            {
              id: "2",
              title: "Lorem ipsum dolor sit amet consectetur adipisicing elit.",
              subtitle: "Lorem ipsum dolor sit",
              author: "Author",

              category: "Category",

              allowList: [],
              authority: 0,
              locked: false,
              publishedAt: "2025-09-30T00:00:00.000Z",
              url: formatCollectionURL({
                relationTo: "posts",
                slug: "slug"
              }),
              tagged: [],
              updatedAt: "2025-09-30T00:00:00.000Z",
              bookmarks: [],
              bookmarksCount: 0
            },
            {
              id: "3",
              title: "Lorem ipsum dolor sit amet consectetur adipisicing elit.",
              subtitle: "Lorem ipsum dolor sit",
              author: "Author",

              category: "Category",

              allowList: [],
              authority: 0,
              locked: false,
              publishedAt: "2025-09-30T00:00:00.000Z",
              url: formatCollectionURL({
                relationTo: "posts",
                slug: "slug"
              }),
              tagged: [],
              updatedAt: "2025-09-30T00:00:00.000Z",
              bookmarks: [],
              bookmarksCount: 0
            },
            {
              id: "4",
              title: "Lorem ipsum dolor sit amet consectetur adipisicing elit.",
              subtitle: "Lorem ipsum dolor sit",
              author: "Author",

              category: "Category",

              allowList: [],
              authority: 0,
              locked: false,
              publishedAt: "2025-09-30T00:00:00.000Z",
              url: formatCollectionURL({
                relationTo: "posts",
                slug: "slug"
              }),
              tagged: [],
              updatedAt: "2025-09-30T00:00:00.000Z",
              bookmarks: [],
              bookmarksCount: 0
            },
            {
              id: "5",
              title: "Lorem ipsum dolor sit amet consectetur adipisicing elit.",
              subtitle: "Lorem ipsum dolor sit",
              author: "Author",

              category: "Category",

              allowList: [],
              authority: 0,
              locked: false,
              publishedAt: "2025-09-30T00:00:00.000Z",
              url: formatCollectionURL({
                relationTo: "posts",
                slug: "slug"
              }),
              tagged: [],
              updatedAt: "2025-09-30T00:00:00.000Z",
              bookmarks: [],
              bookmarksCount: 0
            }
          ]}
        />
      </div>

      <div className={"relative block"}>
        <ArchiveFeatureCard
          type={"right"}
          contents={[
            {
              id: "1",
              title: "Lorem ipsum dolor sit amet consectetur adipisicing elit.",
              subtitle: "Lorem ipsum dolor sit",
              author: "Author",

              category: "Category",

              allowList: [],
              authority: 0,
              locked: false,
              publishedAt: "2025-09-30T00:00:00.000Z",
              url: formatCollectionURL({
                relationTo: "posts",
                slug: "slug"
              }),
              tagged: [],
              updatedAt: "2025-09-30T00:00:00.000Z",
              bookmarks: [],
              bookmarksCount: 0
            },
            {
              id: "2",
              title: "Lorem ipsum dolor sit amet consectetur adipisicing elit.",
              subtitle: "Lorem ipsum dolor sit",
              author: "Author",

              category: "Category",

              allowList: [],
              authority: 0,
              locked: false,
              publishedAt: "2025-09-30T00:00:00.000Z",
              url: formatCollectionURL({
                relationTo: "posts",
                slug: "slug"
              }),
              tagged: [],
              updatedAt: "2025-09-30T00:00:00.000Z",
              bookmarks: [],
              bookmarksCount: 0
            },
            {
              id: "3",
              title: "Lorem ipsum dolor sit amet consectetur adipisicing elit.",
              subtitle: "Lorem ipsum dolor sit",
              author: "Author",

              category: "Category",

              allowList: [],
              authority: 0,
              locked: false,
              publishedAt: "2025-09-30T00:00:00.000Z",
              url: formatCollectionURL({
                relationTo: "posts",
                slug: "slug"
              }),
              tagged: [],
              updatedAt: "2025-09-30T00:00:00.000Z",
              bookmarks: [],
              bookmarksCount: 0
            },
            {
              id: "4",
              title: "Lorem ipsum dolor sit amet consectetur adipisicing elit.",
              subtitle: "Lorem ipsum dolor sit",
              author: "Author",

              category: "Category",

              allowList: [],
              authority: 0,
              locked: false,
              publishedAt: "2025-09-30T00:00:00.000Z",
              url: formatCollectionURL({
                relationTo: "posts",
                slug: "slug"
              }),
              tagged: [],
              updatedAt: "2025-09-30T00:00:00.000Z",
              bookmarks: [],
              bookmarksCount: 0
            },
            {
              id: "5",
              title: "Lorem ipsum dolor sit amet consectetur adipisicing elit.",
              subtitle: "Lorem ipsum dolor sit",
              author: "Author",

              category: "Category",

              allowList: [],
              authority: 0,
              locked: false,
              publishedAt: "2025-09-30T00:00:00.000Z",
              url: formatCollectionURL({
                relationTo: "posts",
                slug: "slug"
              }),
              tagged: [],
              updatedAt: "2025-09-30T00:00:00.000Z",
              bookmarks: [],
              bookmarksCount: 0
            }
          ]}
        />
      </div>
    </>
  );
};
