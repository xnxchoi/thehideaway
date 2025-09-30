"use client";
import type { CatOverview, TagOverview } from "@/types/collections/delta";
import type { AuthorOverview } from "@/types/collections/posts";
import type { DataFromCollectionSlug } from "payload";
import type { HighlightsCollectionSlug } from "../types";
import { type ReactNode, useRef, useContext, createContext } from "react";
import { type StoreApi, createStore, useStore } from "zustand";

export type HighlightsCollection =
  DataFromCollectionSlug<HighlightsCollectionSlug>;
export type HighlightsArticleOverview = Pick<
  HighlightsCollection,
  "id" | "slug" | "title" | "locked"
> & {
  tagged?: TagOverview[];
  category: CatOverview;
  author: AuthorOverview;
  allowList?: string[];
  authority?: number;
};
type ArticleActions = {
  setArticle: (args: {
    article: HighlightsArticleOverview;
    collection?: HighlightsCollectionSlug;
  }) => void;
  reset: () => void;
};
type ArticleStore = {
  collection: HighlightsCollectionSlug;
} & HighlightsArticleOverview &
  ArticleActions;
type ArticleAPI = StoreApi<ArticleStore>;
const ArticleContext = createContext<ArticleAPI>(null!);
const createArticleStore = () =>
  createStore<ArticleStore>()((set) => ({
    collection: "posts",
    id: null!,
    slug: null!,
    author: null!,
    title: null!,
    locked: null!,
    allowList: null!,
    authority: null!,
    category: null!,
    tagged: null!,
    setArticle: ({ article, collection }) =>
      set((state) => ({
        ...state,
        ...article,
        tagged: [...(article.tagged || [])],
        category: article.category,
        author: article.author,
        allowList: [...(article.allowList || [])],
        authority: article.authority || 0,
        locked: article.locked || false,
        slug: article.slug,
        title: article.title,
        id: article.id,
        collection: collection || state.collection
      })),
    reset: () =>
      set((state) => ({
        ...state,
        collection: "posts",
        id: null!,
        slug: null!,
        author: null!,
        title: null!,
        locked: null!,
        allowList: null!,
        authority: null!,
        category: null!,
        tagged: null!
      }))
  }));
export const ArticleProvider = ({ children }: { children: ReactNode }) => {
  const ref = useRef<ArticleAPI>(null!);
  if (!ref.current) {
    ref.current = createArticleStore();
  }
  return (
    <ArticleContext.Provider value={ref.current}>
      {children}
    </ArticleContext.Provider>
  );
};
export const useArticle = <T,>(selector: (state: ArticleStore) => T) => {
  const ctx = useContext(ArticleContext);
  if (!ctx)
    throw new Error("useArticle must be used within an ArticleInfoProvider");
  return useStore(ctx, selector);
};
