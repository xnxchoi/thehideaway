import { uuidv7 } from "uuidv7";

import type { Search } from "@/payload-types";

export const DEFAULT_SEARCH_AUTHOR = {
  key: "the-hideaway",
  name: "The Hideaway",
  slug: "the-hideaway",
  image: ""
} as const;

export const ensureSearchAuthor = (
  author: Search["author"] | null | undefined
): Search["author"] => {
  if (Array.isArray(author) && author.length > 0) return author;
  return [
    {
      id: uuidv7(),
      ...DEFAULT_SEARCH_AUTHOR
    }
  ];
};
