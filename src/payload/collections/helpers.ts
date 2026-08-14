import { BaseFilter, ClientUser, CollectionConfig, CollectionSlug } from "payload";
import { Flatten } from "@/utilities/typeUtilities";

export const hideIfNotAdmin: (args: { user: ClientUser }) => boolean = ({
  user
}) => {
  return user?.role !== "admin";
};
export const filterByCurrentUser: BaseFilter = ({ req, sort, locale }) => {
  const user = req.user;
  if (!user)
    return {
      author: {
        exists: false
      }
    };
  if (user.role === "admin") {
    return null;
  }
  return {
    author: {
      equals: user.id
    }
  };
};
export type CollectionHookArgs<T extends keyof NonNullable<CollectionConfig["hooks"]> = "beforeChange", F extends CollectionSlug = CollectionSlug> = Parameters<NonNullable<Flatten<NonNullable<CollectionConfig<F>["hooks"]>[T]>>>[0];