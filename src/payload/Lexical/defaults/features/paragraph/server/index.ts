import {createServerFeature} from "@payloadcms/richtext-lexical";
import {i18n} from "./i18n";

export const ParagraphFeature = createServerFeature({
	feature: {
		ClientFeature: "@/payload/Lexical/defaults/features/paragraph/client/index.tsx#ParagraphFeatureClient",
		clientFeatureProps: null,
		i18n,
	},
	key: "paragraph",
})
