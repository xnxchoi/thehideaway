import { Field } from "payload";
import { nanoid } from "nanoid";

export const searchFields: Field[] = [
  {
    name: "id",
    type: "text",
    defaultValue: () => nanoid(24),
    access: {
      update: () => false
    },
    required: true,
    admin: {
      hidden: true
    },
    index: true
  },
  {
    name: "slug",
    type: "text",
    index: true,
    admin: {
      readOnly: true
    },
    required: true
  },
  {
    admin: {
      readOnly: true
    },
    name: "author",
    type: "array",
    fields: [
      {
        name: "authorId",
        type: "text"
      }
    ],
    index: true
  },
  {
    admin: {
      readOnly: true
    },
    name: "allowList",
    type: "array",
    fields: [
      {
        type: "text",
        name: "allowListId"
      }
    ],
    index: true
  },
  {
    admin: {
      readOnly: true
    },
    name: "locked",
    type: "checkbox",
    index: true,
    defaultValue: false
  },
  {
    admin: {
      readOnly: true
    },
    name: "authority",
    type: "number",
    index: true,
    max: 4,
    defaultValue: 0
  },
  {
    name: "tags",
    type: "array",
    maxRows: 5,
    admin: {
      readOnly: true
    },
    index: true,
    fields: [
      { name: "tagTitle", type: "text", required: true },
      { name: "tagKey", type: "text", required: true },
      { name: "weight", type: "number", defaultValue: 1, required: true }
    ]
  },
  {
    label: "Category",
    name: "category",
    type: "group",
    index: true,
    admin: {
      readOnly: true
    },
    fields: [
      {
        name: "categoryKey",
        type: "text",
        index: true
      },
      {
        name: "categoryTitle",
        type: "text"
      },
      {
        name: "categorySlug",
        type: "text"
      }
    ]
  },
  {
    name: "meta",
    label: "Meta",
    type: "group",
    index: true,
    admin: {
      readOnly: true
    },
    fields: [
      {
        type: "text",
        name: "title",
        label: "Title"
      },
      {
        type: "text",
        name: "description",
        label: "Description"
      },
      {
        name: "image",
        label: "Image",
        type: "upload",
        relationTo: "media",
        admin: {
          allowCreate: false
        },
        hasMany: false
      }
    ]
  }
];
