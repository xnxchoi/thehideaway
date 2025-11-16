// store/mentionStore.ts
import { createStore } from "zustand/vanilla";
import { LRUCache as LRU } from "lru-cache";
import { MakeRequired } from "@/utilities/typeUtilities";
import { User } from "@/payload-types";
import type { UserOverview } from "@/types/collections/posts";

export type MentionItem = Pick<UserOverview, "id" | "name" | "slug" | "image">;
type MentionResult = MentionItem;
