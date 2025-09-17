/* eslint-disable react-hooks/rules-of-hooks */
"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { useHeaderTheme } from "@/providers/HeaderTheme";
import { Article } from "@/components/content/article";

import { useScroll } from "@/providers/RP_Pro";
import { useTabMessenger } from "@/utilities/visibilityChange";
import { wait } from "@/utilities/wait";
import { PayloadRedirects } from "@components/PayloadRedirects";
import { SingleArticle } from "@/payload/collections/Posts/post-types";
import { useLenis } from "lenis/react";
import { useTheme } from "@/providers/Theme";
import { useReadStore } from "./ReaderProvider";

const T = (props: { post: SingleArticle; queuedIDs: string[] }) => {
  const { post, queuedIDs } = props;
  if (!post?.slug) return <PayloadRedirects url="" />;
  /* Force the header to be dark mode while we have an image behind it */
  const { setHeaderTheme } = useHeaderTheme();
  const setCurrentIdx = useReadStore((r) => r.setCurrentItem);
  const setQueue = useReadStore((r) => r.setQueue);
  const [currentIndex, setCurrentIndex] = useState(0);
  const articleLoadQueue = useRef<Record<string, number>>({});
  const [loadedArticles, setLoadedArticles] = useState<SingleArticle[]>([post]);
  const [progress, setProgress] = useState(0);
  const storyRef = useRef<HTMLDivElement>(null);
  useLenis((lenis) => {
    if (lenis.isScrolling) {
      setProgress(lenis.progress);
    }
  });
  const articleRefs = useRef<HTMLElement[]>([]);
  const setTitle = useTabMessenger((store) => store.setTitle);
  const [currentPost, setCurrentPost] = useState(post);
  useEffect(() => {
    setTitle(`${post.title} | @${post.author.name}`);
    setCurrentPost(post);
    const q = [
      { collection: "posts", id: post.id },
      ...queuedIDs.map((id) => ({ collection: "posts", id }))
    ];

    setQueue(q);
    setCurrentIdx(0);
  }, [post, queuedIDs, setCurrentIdx, setQueue, setTitle]);

  useEffect(() => {
    setHeaderTheme("dark");
  }, [setHeaderTheme]);
  const scrollDirection = useScroll((state) => state.scrollDirection);

  const [isMaxIndex, setIsMaxIndex] = useState(false);
  const loadNextArticle = useCallback(async (id: string) => {
    return await fetch(`/api/posts/${id}/article`, {
      method: "GET",
      credentials: "include",
      headers: {
        "Content-Type": "application/json"
      }
    })
      .then((res) => {
        if (!res.ok) return null;
        return res.json();
      })
      .then((post: SingleArticle | null) => {
        if (!post) return null;
        setLoadedArticles(
          (prev) => (
            (articleLoadQueue.current[id] = prev.length),
            [...prev, post]
          )
        );
        return post;
      });
  }, []);
  const getNextPost = useCallback(
    (index: number) => {
      return loadedArticles.at(index) ?? false;
    },
    [loadedArticles]
  );
  useEffect(() => {
    if (currentIndex >= queuedIDs.length) {
      setIsMaxIndex(true);
    }
    const articleID = queuedIDs[currentIndex];

    if (!articleID) return;
    const gnextPost = async () =>
      getNextPost(currentIndex)
        ? await wait(150).then(() => {
            return getNextPost(currentIndex)!;
          })
        : await loadNextArticle(articleID);

    gnextPost().then((r) => {
      if (!r || !r.slug) return;
      window.history.pushState({}, "", `/posts/${decodeURIComponent(r.slug)}`);
      setCurrentPost(r);
      setCurrentIdx(currentIndex);
      setTitle(`${r.title} | @${r.author.displayUsername}`);
    });
  }, [
    currentIndex,
    getNextPost,
    loadNextArticle,
    queuedIDs,
    setCurrentIdx,
    setTitle
  ]);
  const theme = useTheme((store) => store.theme);

  return (
    <>
      <div className="fixed right-0 bottom-[30px] left-0 z-[248] mx-auto mb-[24px] w-full">
        <div className={"grid grid-cols-[auto_1fr_auto] items-stretch gap-y-5"}>
          <div className="relative col-[2] justify-self-center">
            <div className="transform-none">
              <div className="relative overflow-hidden rounded-[12px]">
                <div className="absolute top-0 left-0 z-[1] h-full w-full bg-off-white/35 dark:bg-off-d-gray/55"></div>
                <div className="absolute top-0 left-0 z-[2] h-full w-full backdrop-blur-[20px] backdrop-saturate-[1.15]"></div>
                <div className="relative z-[3] flex w-fit max-w-[400px] min-w-[150px] origin-[50%_50%_0px] transform-none flex-col flex-nowrap items-start justify-center gap-0 overflow-hidden rounded-[12px] border-[oklab(0.7716_-0.00387748_-0.0277302/0.1)] px-[12px] py-[6px] select-none">
                  <div className="filter-blur-0 transform-origin-[50%_50%_0px] flex w-full transform-none items-center gap-4 opacity-100">
                    <div className="h-8 w-8 origin-[50%_50%_0px] rounded-[50%]">
                      <svg
                        width="20"
                        height="20"
                        viewBox="0 0 20 20"
                        style={{ transform: "rotate(-90deg)" }}
                      >
                        <circle
                          cx="10"
                          cy="10"
                          r="8"
                          strokeWidth="1.25"
                          stroke="oklch(var(--faded-d-gray)/1)"
                          fill="none"
                          strokeLinecap="round"
                        ></circle>
                        <circle
                          cx="10"
                          cy="10"
                          r="8"
                          strokeWidth="1.25"
                          stroke="oklch(var(--rouge-400)/1)"
                          fill="none"
                          strokeDasharray={`${progress}px 1px`}
                          strokeLinecap="round"
                          pathLength="1"
                          strokeDashoffset="0px"
                        ></circle>
                      </svg>
                    </div>
                    <span
                      className={
                        "m-0 overflow-hidden p-0 font-sans text-lg leading-[1.75] font-light tracking-[0.3px] text-ellipsis whitespace-nowrap"
                      }
                    >
                      {currentPost.title}
                    </span>
                  </div>
                </div>
              </div>
              <div className="relative"></div>
            </div>
          </div>
        </div>
      </div>
      <div
        className="rp_story"
        ref={storyRef}
        data-themed="background-color"
        style={{
          backgroundColor:
            theme === "dark"
              ? "oklch(var(--faded-black)/1)"
              : "oklch(var(--faded-white)/1)"
        }}
      >
        {loadedArticles.map((article, index) => {
          return (
            <Article
              key={article.slug ?? index + post.title}
              post={article}
              onChange={(inView, entry) => {
                if (inView) {
                  scrollDirection === "down"
                    ? setCurrentIndex(index + 1)
                    : setCurrentIndex(index);
                }
              }}
              ref={(el) => {
                if (el && typeof article.slug === "string") {
                  articleRefs.current[index] = el;
                  articleLoadQueue.current[article.slug] = index;
                }
              }}
            />
          );
        })}
        {isMaxIndex && (
          <div className="rp_story_max">
            <h1>That&apos;s all folks!</h1>
          </div>
        )}
      </div>
    </>
  );
};

export default T;
