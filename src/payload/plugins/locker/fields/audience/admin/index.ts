import type { CollectionSlug, Condition, SelectField } from "payload";

const editorOrAdmin: Condition = (_data, _siblingData, { user }) => {
  if (!user || !user.role) return false;
  return ["admin", "editor"].includes(user.role);
};

const editorOrAdminOrAuthor: Condition = (data, _siblingData, { user }) => {
  if (!user || !user.role) return false;
  if (["admin", "editor"].includes(user.role)) return true;
  if (user.role === "author") {
    if (Array.isArray(data?.author)) {
      return data.author.some(
        (a: unknown) =>
          (typeof a === "string" ? a : (a as { id?: string } | null)?.id) ===
          user.id
      );
    }
    return data?.author === user.id;
  }
  return false;
};

export const audienceFieldAdmin = (props: {
  collection: CollectionSlug;
  overrides?: Partial<SelectField["admin"]>;
}): SelectField["admin"] => {
  const { collection, overrides = {} } = props;
  const condition =
    collection === "pages" ? editorOrAdmin : editorOrAdminOrAuthor;
  return {
    position: "sidebar",
    condition,
    description:
      "Who can read this. 'Curated list only' restricts to users picked in Allow List below.",
    ...overrides
  };
};
