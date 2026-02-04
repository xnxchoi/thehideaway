import {CollectionMap} from "@/payload/plugins/plugin-search/utilities/syncDocAsSearchIndex";
import {createValidQueryStringRegex} from "@/utilities/regexUtilities";
import type {Config, NumberField, Plugin, SingleRelationshipField} from "payload";

export type LikeableCollectionSlug = "posts" |
	"delta" |
	"albums" |
	"playlists" |
	"profile" |
	"tracks" | "media" |
	"responses" |
	"userMedia" |
	"citations"

export type LikeableCollection<T extends LikeableCollectionSlug = LikeableCollectionSlug> = CollectionMap[T]

const validTypes: LikeableCollectionSlug[] = [
	"posts",
	"delta",
	"albums",
	"playlists",
	"profile",
	"tracks", "media",
	"responses",
	"userMedia",
	"citations"
];
type LikeConfig = {
	enabled: boolean;
	collections: LikeableCollectionSlug[];
};
const likesFields: [SingleRelationshipField, NumberField] = [
	{
		name: "likers",
		type: "relationship",
		relationTo: "users",
		hasMany: true,
	},
	{
		name: "likes",
		admin: {
			components: {
				Field: {
					path: "@/AccessControlled/Number"
				}
			}
		},
		type: "number",
		min: 0,
		hooks: {
			beforeChange: [
				async ({value, operation, previousValue}) => {
					if (operation === "create") {
						return 0;
					}
					if (operation === "update") {
						const v = Math.max(value, previousValue);
						return v;
					}
				}
			]
		}
	}
]
export const likesTypesRegex = createValidQueryStringRegex(validTypes);
export const LikesPlugin =
	(pluginConfig: LikeConfig): Plugin =>
		(incomingConfig: Config) => {
			const {collections} = pluginConfig;
			const config = {
				...incomingConfig
			};
			const collectionConfigs = [...(config.collections || [])];
			if (!pluginConfig.enabled) {
				return config;
			}

			collections.forEach((collection) => {
				const collectionConfig = collectionConfigs.find(
					(c) => c.slug === `${collection}`
				);
				if (!collectionConfig) {
					return;
				}
				const fields = [...(collectionConfig?.fields || [])];
				fields.push();
				collectionConfig.fields = fields;
			});
			config.collections = collectionConfigs;
			return config;
		};
