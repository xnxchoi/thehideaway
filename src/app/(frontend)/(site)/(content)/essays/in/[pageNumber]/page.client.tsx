"use client";

import { paginatedPosts } from "@/payload/collections/Posts/api/queryPostOverviews";
import { useHeaderTheme } from "@/providers/HeaderTheme";
import { formatCollectionURL } from "@/utilities/formatCollectionURL";
import { PaginatedDocs } from "payload";
import { useEffect, useRef, useState } from "react";
import { InView } from "react-intersection-observer";
import { ArticleArchiveItem } from "../../../../../../../components/layouts/Tagged/Item";
import type { PostOverview } from "@/types/collections/posts";

const PageClient = (props: { posts: PaginatedDocs<PostOverview> }) => {
  const [posts, setPosts] = useState<PaginatedDocs<PostOverview>>(props.posts);
  const [docs, setDocs] = useState<PostOverview[]>(posts.docs);
  const [currentPage, setCurrentPage] = useState(props.posts.page!);
  const currentPageRef = useRef(currentPage);
  const initialPage = useRef(props.posts.page!);
  const [limit, setLimit] = useState(props.posts.limit);
  const hasNextPage = useRef(typeof props.posts.nextPage === "number");
  const hasPrevPage = useRef(typeof props.posts.prevPage === "number");
  const onChange = async (
    inView: boolean,
    entry: IntersectionObserverEntry
  ) => {
    if (!inView || !hasNextPage.current) return;
    await paginatedPosts({
      limit: 12,
      page: currentPageRef.current + 1
    }).then((posts) => {
      if (posts.docs.length === 0) return;
      setDocs((prev) => {
        return [...prev, ...posts.docs];
      });
      setPosts(posts);
    });
    setCurrentPage(currentPageRef.current + 1);
  };
  useEffect(() => {
    currentPageRef.current = currentPage;
    if (currentPage === initialPage.current) return;
    window.history.replaceState({}, "", `/essays/in/${currentPage}`);
  }, [currentPage]);
  /* Force the header to be dark mode while we have an image behind it */
  const { setHeaderTheme } = useHeaderTheme();
  useEffect(() => {
    setHeaderTheme("dark");
  }, [setHeaderTheme]);
  return (
    <div className="min-h-[calc(100vh-64px)] py-24">
      {docs.map(({ slug, author, category, ...post }) => (
        <ArticleArchiveItem
          key={post.id}
          {...post}
          author={author.name}
          category={category.title}
          url={formatCollectionURL({ relationTo: "posts", slug })}
        />
      ))}
      {limit > currentPage && hasNextPage && (
        <InView
          className="next-loader absolute bottom-0 h-[15vh] w-full"
          onChange={onChange}
          threshold={0.8}
          as="div"
        />
      )}
    </div>
  );
};

export default PageClient;
