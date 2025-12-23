import {Code} from "@/blocks/Code/config";
import {MediaBlock} from "@/blocks/MediaBlock/config";
import {ContentHandOffFeature} from "@/payload/Lexical/Features/HandOff/feature";
import {
  BlocksFeature,
  HeadingFeature,
  HorizontalRuleFeature,
  InlineToolbarFeature,
  lexicalEditor,
  LinkFeature,
	type LinkFields,
	RelationshipFeature
} from "@payloadcms/richtext-lexical";
import type {RichTextField, TextFieldSingleValidation} from "payload";

const customizedFeatureKeys = [
	"heading",
	"relationship",
	"blocks",
	"horizontalRule",
	"inlineToolbar",
	"link",
	"handOff"
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
			        "delta",
			        "users",
			        "albums",
			        "tracks",
			        "pages"
		        ]
          }),
	        BlocksFeature({blocks: [Code, MediaBlock]}),
          InlineToolbarFeature(),
          HorizontalRuleFeature(),
          LinkFeature({
            enabledCollections: ["pages", "posts", "delta"],
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
          ContentHandOffFeature()
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
