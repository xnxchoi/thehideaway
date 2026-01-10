import {createServerFeature} from "@payloadcms/richtext-lexical";
import {i18n} from "./i18n";

export const AlignFeature = createServerFeature({
	feature: {
		ClientFeature: "@/payload/Lexical/defaults/features/align/client/index.tsx#AlignFeatureClient",
		i18n,
	},
	key: "align",
})
