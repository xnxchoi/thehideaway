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

  return <>{children}</>;
}
