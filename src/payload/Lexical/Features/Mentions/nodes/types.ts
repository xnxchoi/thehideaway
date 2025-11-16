import type { UserOverview } from "@/types/collections/posts";
import type { DefaultDocumentIDType } from "payload";

export type MentionItem = Pick<UserOverview, "id" | "name" | "slug" | "image">;
export type MentionFields = {
  data:
    | {
        // Actual doc data, populated in afterRead hook
        name: string;
        slug: string;
        image?: string;

        id: string;
      }
    | string;
};
