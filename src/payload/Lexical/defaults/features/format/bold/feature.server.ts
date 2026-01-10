import {createServerFeature} from "@payloadcms/richtext-lexical";
import {
	BOLD_ITALIC_STAR,
	BOLD_ITALIC_UNDERSCORE,
	BOLD_STAR,
	BOLD_UNDERSCORE
} from "./markdownTransformers";

export const BoldFeature = createServerFeature({
	dependenciesSoft: ["italic"],
	feature: ({featureProviderMap}) => {
		const markdownTransformers = [BOLD_STAR, BOLD_UNDERSCORE]
		if (featureProviderMap.get("italic")) {
			markdownTransformers.push(BOLD_ITALIC_UNDERSCORE, BOLD_ITALIC_STAR)
		}

		return {
			ClientFeature: "@/payload/Lexical/defaults/features/format/bold/feature.client.tsx#BoldFeatureClient",
			markdownTransformers,
		}
	},
	key: "bold",
})
