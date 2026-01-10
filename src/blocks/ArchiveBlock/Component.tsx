import React from "react";

import { CollectionArchive } from "@/payload/components/CollectionArchive";
import RichText from "@/payload/fields/RichText";
import type { ArchiveBlock as ArchiveBlockProps } from "@/payload-types";
import {queryPostOverviews} from "@/payload/collections/Posts/api/queryPostOverviews";
import {PostOverview} from "@/types/collections/posts";

export const ArchiveBlock: React.FC<
  ArchiveBlockProps & {
    id?: string;
  }
> = async (props) => {
  const {
    id,
    categories,
    introContent,
    limit: limitFromProps,
    populateBy,
    selectedDocs
  } = props;
  const limit = limitFromProps || 3;
	let posts: PostOverview[] = [];

  if (populateBy === "collection") {
    const flattenedCategories = categories?.map((category) => {
      if (typeof category === "object") return category.id;
      return category;
    });

	  const fetchedPosts = await queryPostOverviews({
      limit,
      page: 1,
      where: {
        category: {
          in: flattenedCategories
        }
      }
    });
    posts = fetchedPosts;
  } else if (selectedDocs?.length) {
	  const fetchFilteredPosts = await queryPostOverviews({
      limit,
      page: 1,
      where: {
        id: {
          in: selectedDocs.map((post) => post.value as string)
        }
      }
    });
    posts = fetchFilteredPosts;
  }
  return (
    <div className="my-16" id={`block-${id}`}>
      {introContent && (
        <div className="container mb-16">
          <RichText
            className="ml-0 max-w-3xl"
            data={introContent}
            enableGutter={false}
          />
        </div>
      )}
      <CollectionArchive posts={posts} />
    </div>
  );
};
