import {
  BoldFeature,
  ItalicFeature,
  lexicalEditor
} from "@payloadcms/richtext-lexical";
import { nanoid } from "nanoid";
import {
  Access,
  AccessArgs,
  CheckboxField,
  type CollapsibleField,
  CollectionConfig,
  CollectionSlug,
  FieldAccess,
  flattenAllFields,
  Plugin
} from "payload";
import { uuidv7 } from "uuidv7";
import { Post, Response, Surf } from "../../payload-types";
import { ACField } from "../fields/AccessControlled/plugin";
import { PROPS_COLLAPSIBLE } from "./constants";

// Access control functions
const isAdminOrAuthor: Access = ({ req: { user } }) => {
  if (!user) return false;
  if (user?.role === "admin") return true;
  if (user?.role === "editor") return true;

  return {
    author: {
      equals: user.id
    }
  };
};

// Check if comments are enabled for the referenced document
const areCommentsEnabled: Access = async ({
  req,
  data,
  id
}: AccessArgs<Response>) => {
  const { payload } = req;

  // For existing comments, get collection and documentId from saved data
  const documen = data?.target;
  if (!documen) return false;
  const collectionValue = documen?.relationTo;
  const document = documen.value as undefined | Post | Surf;
  if (!document) return false;
  const documentId = (documen?.value as undefined | Post | Surf)?.id;
  // If we have collection and documentId, check if comments are enabled
  try {
    // If commentsEnabled is explicitly false, block access
    if (
      !("commentsEnabled" in document) ||
      document.commentsEnabled === false
    ) {
      // Allow admins and editors to still see the comments even if disabled
      if (["editor", "admin"].some((r) => r === req.user?.role)) {
        return true;
      }

      // Check if user is an author of the post
      if (req.user && document.author) {
        if (document.author === req.user?.id) {
          return true;
        }
      }
      return false;
    }
    // Comments are enabled, grant access
    return true;
  } catch (error) {
    console.error(
      `Error checking commentsEnabled for ${collectionValue}/${documentId}:`,
      error
    );
    // If we can't determine, default to allowing access
    return true;
  }
  // If we can't determine, default to allowing access
  return true;
};

// Field-level access for sticky functionality
// Only allow collection admins or content author to make sticky
const canMakeSticky: FieldAccess = ({ req: { user }, data }) => {
  if (!user) return false;
  if (user?.role === "admin") return true;
  if (user?.role === "editor") return true;
  if (Array.isArray(data?.author)) {
    return data?.author.length > 0 && data?.author.some((au) => au === user.id);
  } else if (data?.author === user.id) return true;
  // Check if the user is the author of the content being commented on
  // This requires additional logic in an actual hook
  return false;
};
type CommentEnabledCollection = Extract<CollectionSlug, "posts" | "surf">;

interface CommentsPluginOptions {
  enabled?: boolean;
  commentsSlug?: string;
  overrides?: {
    [key in CommentEnabledCollection]?: {
      /**
       * whether comments are deletable
       * default false
       */
      allowDelete?: boolean /**
       * Custom access control for comments
       * default:
       * read - anyone
       * create - anyone logged in
       * update - author of the comment / admin
       * delete - author of the comment / admin
       */;
      access?: {
        read?: Access;
        create?: Access;
        update?: Access;
        delete?: Access;
      };
      maxDepth?: number;
      enableNotifications?: boolean;
      moderationRequired?: boolean;
    };
  };
}

const commentsSlug = "responses";
const enabledCollections: CollectionSlug[] = ["posts", "surf"];
export const Comments: CollectionConfig<"responses"> = {
  slug: commentsSlug,
  admin: {
    useAsTitle: "content",
    defaultColumns: ["content", "author", "createdAt", "isSticky"]
  },
  defaultPopulate: {
    author: true,
    target: true,
    parent: true,
    depth: true,
    isSticky: true,
    _status: true,
    createdAt: true,
    updatedAt: true
  },
  access: {
    read: areCommentsEnabled,
    create: (args) => {
      const {
        req: { user }
      } = args;
      if (!user) return false;
      // Check if comments are enabled before allowing creation
      return areCommentsEnabled(args);
    },
    update: async (args) => {
      // Must be admin/author AND comments must be enabled
      const canEdit = isAdminOrAuthor(args);
      if (!canEdit) return false;

      return areCommentsEnabled(args);
    },
    delete: async ({ req, data, id }) => {
      // Must be admin/author AND comments must be enabled
      const user = req.user;
      if (req.context.overrideAccess === true) return true;
      if (user?.role === "admin") return true;
      return false;

      return areCommentsEnabled({ req, data, id });
    }
  },
  hooks: {
    beforeChange: [
      // Process mentions from content
      // Set isEdited flag when content is updated after creation
      ({ data, originalDoc }) => {
        if (originalDoc && data.content !== originalDoc.content) {
          data.isEdited = true;
        }
        return data;
      }
    ]
  },
  fields: [
    {
      name: "id",
      type: "text",
      admin: {
        hidden: true
      },
      required: true,
      index: true,
      access: {
        update: () => false
      },
      defaultValue: () => uuidv7()
    },
    {
      name: "content",
      type: "richText",
      required: true,
      editor: lexicalEditor({
        features: () => {
          return [BoldFeature(), ItalicFeature()];
        }
      })
    },
    {
      name: "author",
      type: "relationship",
      relationTo: "users",
      hasMany: false,
      maxDepth: 0,
      required: true,
      index: true,
      access: {
        update: ({ req, data, doc, id }) => {
          if (req.context.overrideAccess) return true;
          if (req.user && req.user.role === "admin") return true;
          return false;
        }
      }
    },
    {
      name: "target",
      label: "Document",
      type: "relationship",
      relationTo: enabledCollections,
      required: true,
      index: true,

      access: {
        update: () => false
      },
      hasMany: false,
      maxDepth: 1
    },

    {
      name: "isEdited",
      label: "Edited",
      type: "checkbox",
      admin: {
        readOnly: true
      },
      required: true,
      defaultValue: false,
      access: {
        read: () => true,
        create: () => false,
        update: ({ doc, data, req }) => {
          if (req.user && req.user.role === "admin") return true;
          if (req.context.overrideAccess) return true;
          if (!doc) return false;
          return "isEdited" in doc && doc.isEdited !== true;
        }
      }
    },
    {
      name: "depth",
      type: "number",
      admin: {
        hidden: true
      },
      required: true,
      defaultValue: 0,
      hooks: {
        beforeChange: []
      },
      access: {
        update: () => false
      },
      index: true,
      min: 0,
      max: 5
    },
    {
      name: "hash",
      type: "text",
      index: true,
      defaultValue: () => nanoid(11),
      access: {
        update: () => false
      },
      required: true
    },
    {
      name: "parent",
      label: "Parent",
      type: "relationship",
      relationTo: ["responses", "citations"],
      hasMany: false,
      maxDepth: 0,
      admin: {
        hidden: true
      },
      access: {
        update: () => false
      }
    },
    {
      name: "mentions",
      label: "Mentions",
      type: "relationship",
      relationTo: "users",
      maxDepth: 0,
      hasMany: true,
      index: true,
      hooks: {
        afterChange: []
      }
    },
    {
      name: "isSticky",
      label: "Sticky Comment",
      type: "checkbox",
      defaultValue: () => false,
      access: {
        create: canMakeSticky,
        update: canMakeSticky
      },
      admin: {
        description: "Pin this response to the top",
        position: "sidebar"
      },
      index: true,
      required: true
    }
  ],
  timestamps: true,
  versions: {
    drafts: {
      autosave: false,
      schedulePublish: false
    },
    maxPerDoc: 2
  }
};
const commentsField: CheckboxField = {
  name: "commentsEnabled",
  label: "Enable responses",
  type: "checkbox",
  defaultValue: true,
  access: {
    update: ({ req, data, doc }) => {
      if (req.context.overrideAccess) return true;
      if (
        req.user &&
        req.user.role &&
        ["editor", "admin"].includes(req.user.role)
      ) {
        return true;
      }
      if (doc) {
        if (doc.author && doc.author === req.user?.id) {
          return true;
        }
      }
      return false;
    }
  },
  required: true,
  index: true,
  admin: {
    position: "sidebar",
    components: ACField("checkbox", {
      allowAuthor: true
    })
  }
};
export const commentsPlugin =
  (pluginOptions: CommentsPluginOptions): Plugin =>
  (incomingConfig) => {
    const config = { ...incomingConfig };
    const configcollections = [...(config.collections || [])];
    if (pluginOptions.enabled === false) {
      return config;
    }
    const c = configcollections.findIndex((r) => r.slug === commentsSlug);
    if (c < 0) {
      configcollections.push(Comments);
    }
    const commentsCollection = configcollections.find(
      (r) => r.slug === commentsSlug
    ) as CollectionConfig;
    commentsCollection.admin = {
      ...commentsCollection.admin,
      hidden: ({ user }) => {
        return !["admin", "editor"].some((r) => r === user?.role);
      }
    };
    for (const r of enabledCollections) {
      const collection = configcollections.find(
        (c) => (r as string) === c.slug
      );
      if (collection) {
        const collectionFields = [...collection.fields];
        const allFields = flattenAllFields({
          cache: true,
          fields: collectionFields
        });
        const commentsExist = allFields.some(
          (r) => r.type === "checkbox" && r.name === commentsField.name
        );
        if (commentsExist) continue;
        const f = collectionFields.find(
          (r) =>
            r.type === "collapsible" && r.label && r.label === PROPS_COLLAPSIBLE
        ) as null | CollapsibleField;
        if (f) {
          const ff = f.fields.slice(0, 3),
            ff2 = f.fields.slice(3);
          f.fields = [...ff, commentsField, ...ff2];
          collection.fields = collectionFields;
        } else {
          collection.fields = [
            ...collectionFields,
            commentsField

            // {
            //   name: "responses",
            //   type: "join",
            //   collection: ["responses", "citations"],
            //   on: "target",
            //   hooks: {
            //     afterRead: [
            //       ({ req, data, siblingData, value }) => {
            //         const user = req.user;
            //         const userId = user?.id;
            //         let enabled =
            //           (siblingData?.commentsEnabled as undefined | boolean) ??
            //           false;
            //         const isAuthor = Boolean(
            //           userId &&
            //             (data as Surf | Post).author &&
            //             userId === (data!.author as string)
            //         );
            //         const isAdminOrEditor = ["admin", "editor"].some(
            //           (r) => r === user?.role
            //         );
            //         enabled = enabled || isAuthor || isAdminOrEditor;
            //         if (!enabled) {
            //           delete siblingData["responses"];
            //           return {
            //             docs: []
            //           };
            //         } else if (!(isAuthor || isAdminOrEditor)) {
            //           return ((value || []) as Array<Response | Citation>).filter(
            //             (r) => {
            //               if ("_status" in r) {
            //                 return r._status === "published";
            //               }
            //               if ("private" in r) {
            //                 return r.private === false;
            //               }
            //               return true;
            //             }
            //           );
            //         }
            //         return value;
            //       }
            //     ]
            //   },
            //   hasMany: true,
            //   defaultSort: ["isSticky", "-createdAt"]
            // }
          ];
        }

        collection.hooks = {
          ...collection.hooks,
          afterDelete: [
            ...(collection.hooks?.afterDelete || []),
            async ({ req, doc, id, context, collection }) => {
              const payload = req.payload;
              const reses = [
                payload
                  .delete({
                    collection: "responses",
                    req,
                    context: {
                      ...context,
                      overrideAccess: true
                    },
                    overrideAccess: true,
                    where: {
                      "target.value": {
                        equals: id
                      }
                    }
                  })
                  .then((r) => r.docs)
                  .catch((e) => payload.logger.error(e)),
                payload
                  .delete({
                    collection: "citations",
                    req,
                    context: {
                      ...context,
                      overrideAccess: true
                    },
                    overrideAccess: true,
                    where: {
                      "target.value": {
                        equals: id
                      }
                    }
                  })
                  .then((r) => r.docs)
                  .catch((e) => payload.logger.error(e))
              ];
              return doc;
            }
          ]
        };
      }
    }
    config.collections = configcollections;
    return config;
  };
