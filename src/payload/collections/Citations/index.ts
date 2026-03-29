import type {
  CreateCitationData,
  ReturnedCitationData,
  UpdateCitationData
} from "@/components/UX/Highlightr/types";
import {Citation} from "@/payload-types";
import {citationHandler} from "@/payload/collections/Citations/endpoints";
import {authorFields} from "@/payload/fields/AuthorField/AuthorField";
import {hashContent} from "@/payload/fields/slug/HashId/hasher";
import {
  type CollectionAfterReadHook,
  type CollectionBeforeValidateHook,
  CollectionConfig,
  Where
} from "payload";
import {filterByCurrentUser} from "../helpers";
import {getUserOverview} from "../Posts/api/queryPostOverviews";

const beforeValidateCitation: CollectionBeforeValidateHook<Citation> = async (
  args
) => {
  const { data: dt, operation, req, context, originalDoc } = args;
  if (!dt) return dt;

  const before = `...\"`;
  const after = `...\"`;

  switch (operation) {
    case "update": {
      const data = dt as UpdateCitationData;
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
      const newData: ReturnedCitationData = {
        reference: originalDoc.reference,
        selection: { ...originalDoc.selection },
        path: originalDoc.path,
        author: originalDoc.author as string,
        quote: originalDoc.quote,
        cited: originalDoc.cited as string,
        target: {
          value: originalDoc.target.value as string,
          relationTo: originalDoc.target.relationTo
        },
        memo: originalDoc.memo,
        private: originalDoc.private
      };
      const dm = data?.memo;
      const dp = data?.private;
      const dataHasMemo = dm !== undefined;
      const dataHasPrivate = dp !== undefined;
      if (dataHasPrivate) {
        newData.private = dp;
      }
      if (dataHasMemo) {
        newData.memo = dm;
      }
      if (typeof newData.memo !== "string") {
        newData.private = true;
      }
      const text = data?.selection;
      if (text) {
        newData.selection = {
          ...text
        };
        newData.path = await hashContent(text.text);
        newData.quote = `${before}${newData.selection.text}${after}`;
      }

      return newData;
    }
    case "create": {
      const data = dt as CreateCitationData;
      const newData: ReturnedCitationData = {
        reference: data.reference,
        selection: data.selection,
        path: await hashContent(data.selection.text),
        author: data.author,
        quote: `${before}${data.selection.text}${after}`,
        cited: data.cited,
        target: {
          value: data.target.value,
          relationTo: data.target.relationTo
        },
        memo: data.memo,
        private: data.private
      };
      if (typeof newData.memo !== "string") {
        newData.private = true;
      }
      return newData;
    }
  }
};
const afterReadCitation: CollectionAfterReadHook<Citation> = async (args) => {
  const { req, context, doc } = args;
  if (!doc || !doc.author) return doc;
  // Skip when called from internal server queries that handle author resolution themselves
  if (context.overrideAccess) return doc;
  //Author field is always a 0-depth value
  const { author: ad, ...rest } = doc;
  const authorId = typeof ad === "string" ? ad : ad.id;
  const author = await getUserOverview(authorId as string);
  return {
    ...rest,
    author
  };
};
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
      if (user.banned) {
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
      if (!user || user.banned) {
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
      if (!user || user.banned) {
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
      name: "path",
      type: "text",
      required: true,
      defaultValue: "",
      access: {},
      admin: {
        hidden: true
      }
    },
    {
      name: "reference",
      type: "text",
      required: true,
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
	  ...authorFields(false),
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
      relationTo: ["surf", "posts"],
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
      maxDepth: 1,
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
    afterRead: [afterReadCitation],
    beforeValidate: [beforeValidateCitation]
  }
};
