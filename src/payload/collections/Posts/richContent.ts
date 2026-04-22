import { Code } from "@/blocks/Code/config";
import { ImageBlock } from "@/blocks/ImageBlock/config";
import { ContentHandOffFeature } from "@/payload/Lexical/Features/HandOff/feature";
import {
  BlocksFeature,
  FeatureProviderProviderServer,
  HeadingFeature,
  HorizontalRuleFeature,
  InlineToolbarFeature,
  lexicalEditor,
  LinkFeature,
  type LinkFields,
  RelationshipFeature
} from "@payloadcms/richtext-lexical";
import type {
  FieldBase,
  FieldClientComponent,
  FieldServerComponent,
  RawPayloadComponent,
  RichTextField,
  TextFieldSingleValidation
} from "payload";
import { MentionFeature } from "@/payload/Lexical/Features/Mentions";
import { RPContextMenuFeature } from "@/payload/Lexical/Features/RP_CtxMenu";
import {
  AmbientAudioAnchorBlock,
  AmbientAudioFeature
} from "@/payload/Lexical/Features/AmbientAudio";

const customizedFeatureKeys = [
  "heading",
  "relationship",
  "blocks",
  "horizontalRule",
  "inlineToolbar",
  "link",
  "handOff",
  "uploads",
  "ambientAudioFeature"
];
export const RichContent = (): RichTextField => {
  return {
    name: "content",
    type: "richText",
    editor: lexicalEditor({
      admin: {
        hideGutter: true,
        hideInsertParagraphAtEnd: true
      },

      features: ({ rootFeatures }) => {
        return [
          ...rootFeatures.filter(
            (feature) => !customizedFeatureKeys.includes(feature.key)
          ),
          HeadingFeature(),
          RelationshipFeature({
            enabledCollections: [
              "posts",
              "surf",
              "users",
              "albums",
              "tracks",
              "pages"
            ]
          }),
          BlocksFeature({
            blocks: [Code, ImageBlock],
            inlineBlocks: [AmbientAudioAnchorBlock]
          }),
          InlineToolbarFeature(),
          HorizontalRuleFeature(),
          LinkFeature({
            enabledCollections: ["pages", "posts", "surf"],
            fields: ({ defaultFields }) => {
              const defaultFieldsWithoutUrl = defaultFields.filter((field) => {
                if ("name" in field && field.name === "url") return false;
                return true;
              });

              return [
                ...defaultFieldsWithoutUrl,
                {
                  name: "url",
                  type: "text",
                  admin: {
                    condition: (_data, siblingData) =>
                      siblingData?.linkType !== "internal"
                  },
                  label: ({ t }) => t("fields:enterURL"),
                  required: true,
                  validate: ((value, options) => {
                    if (
                      (options?.siblingData as LinkFields)?.linkType ===
                      "internal"
                    ) {
                      return true; // no validation needed, as no url should exist for internal links
                    }
                    return value ? true : "URL is required";
                  }) as TextFieldSingleValidation
                }
              ];
            }
          }),
          ContentHandOffFeature(),
          MentionFeature(),
          RPContextMenuFeature(),
          AmbientAudioFeature()
        ];
      }
    }),

    hooks: {},
    admin: {
      components: {
        Field: {
          path: "@/payload/fields/Article/Content/index.tsx#RichTextField"
        }
      }
    },
    label: false,
    required: true
  };
};

export const RP_Bind = ({
  features,
  fieldOverrides = {},
  field: fie,
  adminOverrides = {},
  hooks = {}
}: {
  features: FeatureProviderProviderServer[];
  fieldOverrides?: Partial<
    Omit<RichTextField, "type" | "editor" | "hooks" | "admin">
  >;
  adminOverrides?: Partial<Omit<RichTextField["admin"], "components">>;
  field:
    | string
    | RawPayloadComponent<FieldClientComponent | FieldServerComponent>;
  hooks?: FieldBase["hooks"];
}): RichTextField => {
  const field = typeof fie === "string" ? { path: fie } : fie;
  return {
    name: "content",
    type: "richText",
    label: false,
    required: true,
    editor: lexicalEditor({
      admin: {
        hideGutter: true,
        hideInsertParagraphAtEnd: true
      },

      features: ({ rootFeatures }) => {
        return [
          ...rootFeatures.filter(
            (feature) => !customizedFeatureKeys.includes(feature.key)
          ),
          HeadingFeature(),
          RelationshipFeature({
            enabledCollections: [
              "posts",
              "surf",
              "users",
              "albums",
              "tracks",
              "pages"
            ]
          }),
          BlocksFeature({ blocks: [Code, ImageBlock] }),
          InlineToolbarFeature(),
          HorizontalRuleFeature(),
          LinkFeature({
            enabledCollections: ["pages", "posts", "surf"],
            fields: ({ defaultFields }) => {
              const defaultFieldsWithoutUrl = defaultFields.filter((field) => {
                if ("name" in field && field.name === "url") return false;
                return true;
              });

              return [
                ...defaultFieldsWithoutUrl,
                {
                  name: "url",
                  type: "text",
                  admin: {
                    condition: (_data, siblingData) =>
                      siblingData?.linkType !== "internal"
                  },
                  label: ({ t }) => t("fields:enterURL"),
                  required: true,
                  validate: ((value, options) => {
                    if (
                      (options?.siblingData as LinkFields)?.linkType ===
                      "internal"
                    ) {
                      return true; // no validation needed, as no url should exist for internal links
                    }
                    return value ? true : "URL is required";
                  }) as TextFieldSingleValidation
                }
              ];
            }
          }),
          ...features.map((r) => r())
        ];
      }
    }),
    ...fieldOverrides,
    hooks: {
      ...hooks
    },
    admin: {
      ...adminOverrides,
      components: {
        Field: {
          ...field
        }
      }
    }
  };
};
