import { AuthorField } from "@/payload/fields/AuthorFields/AuthorField";
import { CollectionBeforeChangeHook, CollectionConfig, Where } from "payload";
import { Citation } from "@/payload-types";
import { citationHandler } from "@/payload/collections/Citations/endpoints";
import { filterByCurrentUser } from "../helpers";
import { hashContent } from "@/payload/fields/slug/HashId/hasher";
export const Citations: CollectionConfig = {
  slug: "citations",
  lockDocuments: false,

  defaultPopulate: {
    id: true,
    cited: true,
    target: true,
    user: true,
    quote: true,
    selection: true
  },
  admin: {
    useAsTitle: "quote",

    baseFilter: filterByCurrentUser
  },
  access: {
    read: ({ req }) => {
      const ctx = req.context;
      const overrideAccess = ctx.overrideAccess;
      if (overrideAccess) {
        return true;
      }
      const user = req.user;
      if (!user) {
        return {
          private: {
            not_equals: true
          }
        };
      }
      if (user.role === "admin") {
        return true;
      }
      return {
        or: [
          {
            private: {
              not_equals: true
            }
          },
          {
            author: {
              equals: user.id
            }
          }
        ]
      } as Where;
    },
    create: ({ req }) => {
      const ctx = req.context;
      const overrideAccess = ctx.overrideAccess;
      if (overrideAccess) {
        return true;
      }
      const user = req.user;
      if (!user) {
        return false;
      }
      return true;
    },
    update: ({ req }) => {
      const ctx = req.context;
      const overrideAccess = ctx.overrideAccess;
      if (overrideAccess) {
        return true;
      }
      const user = req.user;
      if (!user) {
        return false;
      }
      if (["editor", "admin"].some((role) => role === user.role)) {
        return true;
      }
      return {
        author: {
          equals: user.id
        }
      };
    },
    delete: ({ req }) => {
      const ctx = req.context;
      const overrideAccess = ctx.overrideAccess;
      if (overrideAccess) {
        return true;
      }
      const user = req.user;
      if (!user) {
        return false;
      }
      if (["editor", "admin"].some((role) => role === user.role)) {
        return true;
      }
      return {
        author: {
          equals: user.id
        }
      };
    }
  },
  fields: [
    {
      name: "color",
      type: "text",
      defaultValue: () => "ORANGE",
      required: true,
      index: true
    },
    {
      name: "path",
      type: "text",
      required: true,
      defaultValue: "",
      access: {},
      admin: {
        hidden: true
      },
      index: true
    },
    {
      name: "reference",
      type: "text",
      required: true,
      defaultValue: "",
      admin: {
        hidden: true
      },
      index: true,
      access: {
        update: () => false
      }
    },
    {
      name: "selection",
      type: "group",
      required: true,
      access: {
        update: ({ req }) => {
          const ctx = req.context;
          const overrideAccess = ctx.overrideAccess;
          if (overrideAccess) {
            return true;
          }
          const user = req.user;
          if (!user) {
            return false;
          }
          if (["editor", "admin"].some((role) => role === user.role)) {
            return true;
          }
          return false;
        }
      },
      admin: {
        hidden: true
      },

      fields: [
        {
          name: "text",
          type: "text",
          required: true
        },
        {
          name: "before",
          type: "text",
          required: true,
          defaultValue: ""
        },
        {
          name: "after",
          type: "text",
          defaultValue: "",
          required: true
        }
      ]
    },
    {
      name: "private",
      type: "checkbox",
      defaultValue: false,
      required: true,
      index: true
    },
    {
      name: "quote",
      type: "text",
      required: true,
      defaultValue: "",

      admin: {
        readOnly: true
      }
    },
    ...AuthorField(false),
    {
      access: {
        read: () => true,
        update: ({ req }) => {
          const ctx = req.context;
          const overrideAccess = ctx.overrideAccess;
          if (overrideAccess) {
            return true;
          }
          const user = req.user;
          if (!user) {
            return false;
          }
          if (user.role === "admin") {
            return true;
          }
          return false;
        }
      },
      name: "target",
      type: "relationship",
      relationTo: ["delta", "posts"],
      hasMany: false,
      maxDepth: 0,
      index: true,
      required: true,
      admin: {
        readOnly: true
      }
    },
    {
      name: "cited",
      type: "relationship",
      relationTo: "users",
      hasMany: false,
      required: true,
      maxDepth: 0,
      access: {
        update: ({ req }) => {
          if (req.context.overrideAccess === true) {
            return true;
          }
          return req.user?.role === "admin";
        }
      },
      index: true
    },
    {
      name: "memo",
      type: "textarea"
    }
  ],
  timestamps: true,
  endpoints: [
    {
      path: "/getNotes",
      method: "get",
      handler: citationHandler
    }
  ],
  hooks: {
    beforeValidate: [
      async ({
        data,
        operation,
        req,
        context,
        originalDoc
      }: Parameters<CollectionBeforeChangeHook<Citation>>[0]) => {
        if (operation === "update" || operation === "create") {
          const before = `...\"`;
          const after = `...\"`;
          switch (operation) {
            case "update": {
              if (!originalDoc) {
                req.payload.logger.error(
                  {
                    message: "Original doc not found",
                    data,
                    operation,
                    req,
                    context,
                    originalDoc
                  },
                  "Original doc not found"
                );
                throw new Error("Original doc not found");
              }
              const text = data?.selection?.text || originalDoc.selection.text;

              const selection = {
                before,
                text: `${text}`,
                after
              };
              const quote = `${before}${text}${after}`;
              const reference = originalDoc.reference;
              data.selection = selection;
              data.quote = quote;
              data.path = await hashContent(text);
              data.reference = reference;
              return data;
            }
            case "create": {
              if (!data?.selection?.text) {
                req.payload.logger.error({
                  message: "Selection not found",
                  data,
                  operation,
                  req,
                  context
                });
                throw new Error("Selection not found");
              }
              const selection = {
                before,
                text: `${data?.selection?.text}`,
                after
              };
              const quote = `${before}${selection.text}${after}`;
              data.selection = selection;
              data.quote = quote;
              data.path = await hashContent(selection.text);
              return data;
            }
          }
        }
        return data;
      }
    ]
  }
};
