import {
	BlockquoteFeature,
	BoldFeature,
	HeadingFeature,
	IndentFeature,
	ItalicFeature,
	lexicalEditor,
	LinkFeature,
	type LinkFields,
	OrderedListFeature,
	ParagraphFeature,
	SubscriptFeature,
	SuperscriptFeature,
	UnderlineFeature,
	UnorderedListFeature
} from "@payloadcms/richtext-lexical";
import type {TextFieldSingleValidation} from "payload";

export const defaultLexical = lexicalEditor({
	features: ({defaultFeatures}) => {
		return [
			...defaultFeatures,
			SubscriptFeature(),
			SuperscriptFeature(),
			UnorderedListFeature(),
			OrderedListFeature(),
			IndentFeature(),
			BlockquoteFeature(),
			HeadingFeature(),
			ParagraphFeature(),
			UnderlineFeature(),
			BoldFeature(),
			ItalicFeature(),
			LinkFeature({
				enabledCollections: ["pages", "posts", "delta", "albums", "playlists"],

				fields: ({defaultFields}) => {
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
							label: ({t}) => t("fields:enterURL"),
							required: true,
							validate: ((value, options) => {
								if (
									(options?.siblingData as LinkFields)?.linkType === "internal"
								) {
									return true; // no validation needed, as no url should exist for internal links
								}
								return value ? true : "URL is required";
							}) as TextFieldSingleValidation
						}
					];
				}
			})
		];
	}
});
