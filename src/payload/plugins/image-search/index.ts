import type { Config } from "payload";

import { defaultPluginOptions } from "./defaults";
import { providers } from "./endpoints/providers";
import { translations } from "./translations";
import type { ImageSearchPluginOptions } from "./types";
import { deepMerge } from "./utils/deepMerge";

export const imageSearchPlugin =
  (pluginOptions: ImageSearchPluginOptions = {}) =>
  (incomingConfig: Config): Config => {
    const mergedOptions: Required<ImageSearchPluginOptions> = Object.assign(
      defaultPluginOptions,
      pluginOptions
    );

    const config = { ...incomingConfig };

    if (mergedOptions.enabled === false) {
      return config;
    }

    config.custom = {
      ...(config.custom || {}),
      providerAccess: mergedOptions.providerAccess
    };

    config.i18n = {
      ...(config.i18n || {}),
      translations: {
        ...deepMerge(translations, config.i18n?.translations)
      }
    };

    config.collections = (config.collections || []).map((collection) => {
      const upload = collection.upload;

      if (!upload) {
        return collection;
      }

      const uploadObj =
        upload === true ? {} : typeof upload === "object" ? upload : undefined;

      const modifiedCollection = {
        ...collection,
        upload: {
          ...(uploadObj || {}),
          admin: {
            ...(uploadObj?.admin || {}),
            components: {
              ...(uploadObj?.admin?.components || {}),
              controls: [
                ...(uploadObj?.admin?.components?.controls || []),
                "@/payload/plugins/image-search/components/ImageSearch/index.tsx#ImageSearch"
              ]
            }
          }
        }
      };

      return modifiedCollection;
    });

    config.endpoints = [...(config.endpoints || []), ...providers];

    return config;
  };
