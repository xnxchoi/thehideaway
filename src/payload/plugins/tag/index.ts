import {authorFields} from "@/payload/fields/AuthorField/AuthorField";
import {sanitizeAuthor} from "@/payload/fields/AuthorField/hooks";
import {slugField} from "@/payload/fields/slug";
import {mergeFields} from "@/utilities/mergeFields";
import type {CollectionSlug, Config, Plugin} from "payload";
import {isAdminOrEditor, standardCreateAccess} from "../locker/access/accessCheckers";

export interface TagPluginConfig {
  enabled: boolean;
  collections: CollectionSlug[];
}

export const tagPlugin =
  (pluginOptions: TagPluginConfig): Plugin =>
  (incomingConfig: Config) => {
    const config = { ...incomingConfig };
    if (pluginOptions.enabled === false) {
      return config;
    }
    config.collections = [...(config.collections ?? [])];
    let tagsCollection = config.collections.find((c) => c.slug === "tags");
    if (!tagsCollection) {
      tagsCollection = {
        slug: "tags",
        access: {
          read: () => true,
          create: standardCreateAccess,
          update: isAdminOrEditor,
          delete: isAdminOrEditor
        },
        defaultPopulate: {
          title: true,
          id: true,
          slug: true
        },
        fields: [
          {
            name: "title",
            type: "text",
            required: true,
            unique: true,
            index: true,
            access: {
              read: () => true,
              create: standardCreateAccess,
              update: isAdminOrEditor
            }
          },

          ...authorFields(false),
          ...slugField("title")
        ],
        hooks: {
          beforeChange: [sanitizeAuthor(false)]
        }
      };
      config.collections.push(tagsCollection);
    }
    pluginOptions.collections.forEach((collection) => {
      const collectionConfig = config.collections?.find(
        (c) => c.slug === `${collection}`
      );
      if (collectionConfig) {
        const { mergedFields, restFields } = mergeFields({
          path: collectionConfig.slug,
          baseFields: [
            {
              name: "tagged",
              label: "Tags",
              type: "relationship",
              relationTo: "tags",
              hasMany: true,

              admin: {
                allowCreate: true,
                allowEdit: false
              },
              access: {
                read: () => true
              },
              maxDepth: 1,
              maxRows: 5,
              index: true
            },
          ],
          patchFields: collectionConfig.fields
        });
        collectionConfig.fields = [...restFields, ...mergedFields];
      }
    });

    // Do not add a reverse `taggedItems` join. Payload 3.88 + Drizzle
    // cannot query polymorphic hasMany `on: "tagged"` (empty column in
    // the UNION). Tags list/edit 500s if that field exists.

    return config;
  };
