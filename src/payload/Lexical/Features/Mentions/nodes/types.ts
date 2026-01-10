import {UserOverview} from "@/types/collections/users";

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
