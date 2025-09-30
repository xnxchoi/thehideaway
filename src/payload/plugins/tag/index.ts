import { mergeFields } from "@/utilities/mergeFields";
import type { CollectionSlug, Config, JoinField, Plugin } from "payload";
import { AuthorField } from "@/payload/fields/AuthorFields/AuthorField";
import { slugField } from "@/payload/fields/slug";
import {
  isAdminOrEditor,
  standardCreateAccess
} from "../locker/access/accessCheckers";
import { sanitizeAuthor } from "@/payload/fields/AuthorFields/hooks";

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

          ...AuthorField(false),
          ...slugField("title")
        ],
        hooks: {
          beforeChange: [sanitizeAuthor(false)]
        }
      };
      config.collections.push(tagsCollection);
    }
    const joinField: JoinField = {
      name: "tagged",
      type: "join",
      on: "tagged",
      hasMany: true,
      collection: [...(pluginOptions.collections ?? [])],

      where: {
        _status: {
          equals: "published"
        }
      }
    };
    pluginOptions.collections.forEach((collection) => {
      const collectionConfig = config.collections?.find(
        (c) => c.slug === `${collection}`
      );
      if (collectionConfig) {
        const { mergedFields, restFields } = mergeFields({
          path: collectionConfig.slug,
          baseFields: [
            {
              name: "tags",
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
            }
          ],
          patchFields: collectionConfig.fields
        });
        collectionConfig.fields = [...restFields, ...mergedFields];
      }
    });

    const { mergedFields, restFields } = mergeFields({
      path: tagsCollection.slug,
      baseFields: [joinField],
      patchFields: tagsCollection.fields
    });
    tagsCollection.fields = [...restFields, ...mergedFields];

    return config;
  };
