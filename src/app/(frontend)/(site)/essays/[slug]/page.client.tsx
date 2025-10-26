"use client";
import { ReactNode, useCallback, useEffect, useRef } from "react";
import { useHighlighter } from "@/components/UX/Highlightr/providers/HighlighterProvider";
import type { SingleArticle } from "@/types/collections/posts";
import { useArticle } from "@/components/UX/Highlightr/providers/ArticleProvider";
import { useShallow } from "zustand/shallow";

export default function PageClient({
  children,
  post
}: {
  children: ReactNode;
  post: SingleArticle;
}) {
  const clearHighlights = useHighlighter((r) => r.clear);
  const resetHighlights = useHighlighter((r) => r.reset);
  const resetArticle = useArticle((r) => r.reset);
  const setArticle = useArticle((r) => r.setArticle);
  const collection = useArticle(useShallow((r) => r.collection));
  const cr = useRef(collection);
  useEffect(() => {
    cr.current = collection;
  }, [collection]);

  const runRef = useRef(false);
  const setTarget = useHighlighter((r) => r.setTarget);
  const resetAll = useCallback(() => {
    resetArticle();
    clearHighlights();
    resetHighlights();
  }, [clearHighlights, resetArticle, resetHighlights]);
  useEffect(() => {
    if (runRef.current) return;
    clearHighlights();
    runRef.current = true;
    setTarget({
      relationTo: "posts",
      value: post.id,
      slug: post.slug,
      author: post.author.id,
      disabled: post.disabled
    });
    setArticle({
      article: {
        id: post.id,
        slug: post.slug,
        category: post.category,
        author: post.author,
        locked: post.locked,
        title: post.title
      },
      collection: "posts"
    });
    return () => {
      runRef.current = false;
      resetAll();
    };
  }, [clearHighlights, resetHighlights, setTarget, resetAll, setArticle, post]);

  return (
    <div
      className={
        "rp_story z-120 w-screen bg-faded-white pb-[20px] leading-[1.28] dark:bg-faded-black"
      }
      data-themed="background-color,color"
    >
      {children}
      <div
        className="relative"
        style={{
          backgroundImage: `linear-gradient(to bottom, oklch(var(--faded-bg)/1) 22%, oklch(var(--faded-bg)/0.75) 40%, oklch(var(--faded-bg)/0.5) 50%, oklch(var(--faded-bg)/0.15) 65%, oklch(var(--faded-bg)/0.05) 72%, oklch(var(--faded-bg)/0.001) 96%)`,
          zIndex: 100,
          height: "14vh",
          width: "100vw",
          top: "0px",
          marginTop: "0px",
          marginBottom: "-13vh",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          position: "relative"
        }}
      >
        <div className="absolute top-0 left-0 z-50 h-px w-screen bg-linear-to-r from-[oklch(var(--muted-faded-fg)/0.15)] from-10% via-[oklch(var(--muted-faded-fg)/0.75)] via-50% to-[oklch(var(--muted-faded-fg)/0.15)] to-90%" />
      </div>
    </div>
  );
}
