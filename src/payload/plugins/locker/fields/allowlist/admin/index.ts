import {
  CollectionSlug,
  Condition,
  PolymorphicRelationshipField,
  SingleRelationshipField
} from "payload";

/**
 * Field admins condition for locked checkbox
 *
 */
const pagesCondition: Condition = (data, siblingData, { user }) => {
  if (!user) return false;
  if (user?.role === "admin") return true;
  return false;
};
const defaultCondition: Condition = (data, siblingData, { user }) => {
  if (!user || !user.role) return false;
  if (["editor", "admin"].includes(user.role)) return true;
  if (user.role === "author") {
    if (Array.isArray(data?.author)) {
      return (
        data?.author.length > 0 && data?.author.some((au) => au === user?.id)
      );
    } else if (data?.author === user?.id) return true;
  }
  return false;
};
export const allowListFieldAdmin = (props: {
  collection: CollectionSlug;
  overrides?: Partial<SingleRelationshipField["admin"]>;
}): SingleRelationshipField["admin"] => {
  const { collection, overrides = {} } = props;
  const condition: Condition =
    collection === "pages" ? pagesCondition : defaultCondition;
  return {
    position: "sidebar",
    condition,
    description:
      "Specific users granted read access regardless of audience tier. Required when 'Curated list only' is selected.",
    ...overrides
  };
};
