import {
	INLINE_CODE
} from "@/payload/Lexical/defaults/features/format/inlineCode/markdownTransformers";
import {createServerFeature} from "@payloadcms/richtext-lexical";

export const InlineCodeFeature = createServerFeature({
	feature: {
		ClientFeature: "@/payload/Lexical/defaults/features/format/inlineCode/feature.client.tsx#InlineCodeFeatureClient",
		markdownTransformers: [INLINE_CODE],
	},
	key: "inlineCode",
})
