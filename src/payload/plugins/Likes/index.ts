import { Plugin, CollectionSlug, Config } from "payload";
import { uuidv7 } from "uuidv7";
import { createValidQueryStringRegex } from "../../../utilities/regexUtilities";
import { filterByCurrentUser, hideIfNotAdmin } from "../../collections/helpers";

export const validTypes: CollectionSlug[] = [
  "posts",
  "delta",
  "albums",
  "playlists",
  "profile",
  "tracks",
  "responses",
  "userMedia",
  "citations"
];
type LikeConfig = {
  enabled: boolean;
  collections: CollectionSlug[];
};
export const likesTypesRegex = createValidQueryStringRegex(validTypes);
export const LikesPlugin =
  (pluginConfig: LikeConfig): Plugin =>
  (incomingConfig: Config) => {
    const { collections } = pluginConfig;
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
      fields.push({
        name: "likes",
        admin: {
          components: {
            Field: {
              path: "@adminOnlyFields/number"
            }
          }
        },
        type: "number",
        min: 0,
        hooks: {
          beforeChange: [
            async ({ value, operation, previousValue }) => {
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
      });
      collectionConfig.fields = fields;
    });
    config.collections = collectionConfigs;
    return config;
  };
