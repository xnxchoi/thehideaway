import { SlugComponent } from "@/payload/fields/slug/SlugComponent";
import type { CollectionSlug, TextFieldServerProps } from "payload";

// Define collections that have author fields locally
type IndexedCollections = Extract<
  CollectionSlug,
  "posts" | "surf" | "albums" | "playlists" | "tracks" | "tags"
>;

// Define the server component props that extend TextFieldServerProps with additional props
type SlugServerComponentProps = TextFieldServerProps & {
  fieldToUse: string;
  checkboxFieldPath: string;
	useHash?: boolean;
};

export default async function SlugServerComponent(
  props: SlugServerComponentProps
) {
  const {
    field,
    readOnly,
    data,
    path,
    req,
    operation,
    schemaPath,
    permissions,
    clientField,
    user,
    checkboxFieldPath,
    fieldToUse,
    id,
	  collectionSlug,
	  useHash = true
  } = props;
  const userIsAdmin = user.collection === "admins" || user.role === "admin";
  let userIsAuthor = operation === "create";
  if (
    operation === "update" &&
    ["string", "number"].some((r) => {
      const typ = typeof id;
      return (r as "string" | "number") === typ;
    })
  ) {
    const overrideAccess = true;
    const col = req.payload.collections[collectionSlug as CollectionSlug];
    const fields = col.config.fields;
    const authorFieldExists =
      fields.findIndex(
        (r) => "name" in r && r.name === "author" && r.type === "relationship"
      ) > -1;
    if (authorFieldExists) {
      const authorId = await req.payload
        .findByID({
          collection: collectionSlug as Exclude<IndexedCollections, "users">,
          id: `${id}`,
          select: {
            author: true
          },
          context: {
            ...req.context,
            overrideAccess
          },
          overrideAccess,
          req
        })
        .then((r) => {
          return "author" in r
            ? Array.isArray(r.author)
              ? r.author.map((r) => (typeof r === "string" ? r : r.id))
              : typeof r.author === "string"
                ? r.author
                : r.author.id
            : null;
        })
        .catch((e) => {
          req.payload.logger.error(e);
          return null;
        });
      if (authorId) {
        userIsAuthor = Array.isArray(authorId)
          ? (authorId as string[]).some((r) => r === user.id)
          : authorId === user.id;
      }
    }
  }
  const read = readOnly || !(userIsAdmin || userIsAuthor);
  return (
    <SlugComponent
      checkboxFieldPath={checkboxFieldPath}
      field={clientField}
      path={path}
      useHash={useHash}
      fieldToUse={fieldToUse}
      readOnly={read}
    />
  );
}
