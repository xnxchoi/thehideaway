import { Where } from "payload";
import React from "react";

import { HomeArticleLayout } from "@/components/layouts/HomeArticleLayout";
import type { HeroSquareBlock as HeroSquareBlockProps } from "@/payload-types";
import { queryPostOverview } from "@/payload/collections/Posts/api/queryPostOverview";
import { ArticleOverview } from "@/types/collections/posts";

export const HeroSquareBlock: React.FC<
  {
    id?: string;
  } & HeroSquareBlockProps
> = async (props) => {
  const {
    id,
    categories,
    introContent,
    limit: limitFromProps,
    populateBy,
    selectedDocs
  } = props;
  const limit = limitFromProps || 8;
  const posts: ArticleOverview[] = [];

  if (populateBy === "collection") {
    const flattenedCategories = categories?.map((category) => {
      if (typeof category === "object") return category.id;
      return category;
    });
    const where: Where = {};
    if (flattenedCategories) {
      where.category = {
        in: flattenedCategories
      };
    }
    const fetchedPosts = await queryPostOverview({
      where,
      limit
    });
    if (fetchedPosts instanceof Error) {
      console.error(fetchedPosts);
    } else {
      posts.push(...fetchedPosts);
    }

    return <HomeArticleLayout posts={posts} />;
  } else {
    return <></>;
  }
};
/**
 *  } else if (selectedDocs?.length) {
    const filteredSelectedPosts = selectedDocs.flatMap(async (post) => {
      if (typeof post.value === 'object' && post.value.author) {
        const author = await payload.findByID({
          collection: 'users',
          id: post.value.author.value,
        })
        return {
          ...post.value,
        }
      }
    })
    posts = filteredSelectedPosts
  }
 */
