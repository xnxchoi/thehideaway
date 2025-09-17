import {
  MetaDescriptionField,
  MetaImageField,
  MetaTitleField,
  OverviewField,
  PreviewField
} from "@payloadcms/plugin-seo/fields";
import type { CollectionConfig } from "payload";

import { populatePublishedAt } from "@/hooks/populatePublishedAt";
import { Archive } from "@/payload/blocks/ArchiveBlock/config";
import { CallToAction } from "@/payload/blocks/CallToAction/config";
import { Content } from "@/payload/blocks/Content/config";
import { FOTD } from "@/payload/blocks/FOTD/config";
import { hero } from "@/payload/blocks/heros/config";
import { HeroSquare } from "@/payload/blocks/HeroSquareBlock/config";
import { MediaBlock } from "@/payload/blocks/MediaBlock/config";
import { slugField } from "@/payload/fields/slug";
import { pagesAccess } from "@/payload/plugins/locker/access";
import { generatePreviewPath } from "@/utilities/generatePreviewPath";
import { getServerSideURL } from "@/utilities/getURL";
import { hideIfNotAdmin } from "../helpers";
import { revalidateDelete, revalidatePage } from "./hooks/revalidatePage";

export const Pages: CollectionConfig<"pages"> = {
  slug: "pages",
  access: pagesAccess, // This config controls what's populated by default when a page is referenced
  // https://payloadcms.com/docs/queries/select#defaultpopulate-collection-config-property
  // Type safe if the collection slug generic is passed to `CollectionConfig` - `CollectionConfig<'pagess'>
  defaultPopulate: {
    title: true,
    slug: true,
    _status: true,
    meta: {
      image: true
    }
  },
  admin: {
    defaultColumns: ["title", "slug", "updatedAt"],
    hidden: hideIfNotAdmin,

    livePreview: {
      url: ({ data, req }) => {
        const path = generatePreviewPath({
          slug: typeof data?.slug === "string" ? data.slug : "",
          collection: "pages",
          req
        });

        return `${getServerSideURL()}${path}`;
      }
    },
    preview: (doc, { req }) => {
      const path = generatePreviewPath({
        slug: typeof doc?.slug === "string" ? doc.slug : "",
        collection: "pages",
        req
      });

      return `${getServerSideURL()}${path}`;
    },
    useAsTitle: "title",

    components: {}
  },
  fields: [
    {
      name: "title",
      type: "text",

      required: true,
      index: true
    },
    {
      type: "tabs",
      admin: {},
      tabs: [
        {
          fields: [hero],
          label: "Hero"
        },
        {
          fields: [
            {
              name: "layout",
              type: "blocks",
              blocks: [
                CallToAction,
                Content,
                MediaBlock,
                Archive,
                FOTD,
                HeroSquare
              ]
            }
          ],
          label: "Content"
        },
        {
          name: "pageLayout",
          label: "Layout",
          fields: [
            {
              name: "footerType",
              type: "select",
              options: ["standard", "linksOnly", "hidden"],
              defaultValue: "standard",
              label: "Footer Type",
              admin: {
                condition: (data, siblingData) => {
                  return !Boolean(data?.["disableFooter"]?.value);
                }
              },

              index: true
            }
          ]
        },
        {
          name: "meta",
          label: "SEO",
          fields: [
            OverviewField({
              titlePath: "meta.title",
              descriptionPath: "meta.description",
              imagePath: "meta.image"
            }),
            MetaTitleField({
              hasGenerateFn: true
            }),
            MetaImageField({
              relationTo: "media"
            }),

            MetaDescriptionField({}),
            PreviewField({
              // if the `generateUrl` function is configured
              hasGenerateFn: true,

              // field paths to match the target field for data
              titlePath: "meta.title",
              descriptionPath: "meta.description"
            })
          ]
        }
      ]
    },
    {
      name: "publishedAt",
      type: "date",
      admin: {
        position: "sidebar"
      }
    },
    {
      name: "tagged",
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
    ...slugField("title", { slugOverrides: { required: true } })
  ],
  hooks: {
    afterChange: [revalidatePage],
    beforeChange: [populatePublishedAt],
    afterDelete: [revalidateDelete]
  },
  versions: {
    drafts: {
      autosave: {
        interval: 100 // We set this interval for optimal live preview
      }
    },
    maxPerDoc: 50
  }
};
