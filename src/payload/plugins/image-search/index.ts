import type {CollectionConfig, CollectionSlug, Config} from "payload"

import {baseFields, fundFields} from "./collections/collectionFields"
import {imageHooks} from "./collections/collectionHooks"
import {configureUpload} from "./collections/uploadConfig"
import {defaultPluginOptions} from "./defaults"
import {providers} from "./endpoints/providers"
import {translations} from "./translations"
import type {ImageSearchPluginOptions} from "./types"
import {deepMerge} from "./utils/deepMerge"

export const imageSearchPlugin =
	(pluginOptions: ImageSearchPluginOptions = {}) =>
		(incomingConfig: Config): Config => {
			const mergedOptions: Required<ImageSearchPluginOptions> = Object.assign(
				defaultPluginOptions,
				pluginOptions
			);

			const config = {...incomingConfig};

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
			const targets: CollectionSlug[] = ["userMedia", "media", "assets"]
			config.collections = (config.collections || []).map((collection) => {
				const upload = collection.upload;
				if (targets.indexOf(collection.slug as CollectionSlug) < 0) {
					return collection;
				}
				if (!upload) {
					return collection;
				}

				const uploadObj =
					upload === true ? {} : typeof upload === "object" ? upload : undefined;
				const collectionFields = [...collection.fields];

				[...fundFields, ...baseFields].forEach((fled) => {
					const hasFled = collectionFields.find((field) => {
						if (!("name" in field)) return false;
						return field.name === fled.name;
					});
					if (!hasFled) {
						collectionFields.push(fled);
					} else {
						if (hasFled.type !== fled.type) {
							collectionFields.splice(
								collectionFields.indexOf(hasFled),
								1, fled
							);
						} else {
							collectionFields.splice(
								collectionFields.indexOf(hasFled),
								1, fled
							);
						}
					}
				})

				const collectionAfterReadHooks = [...(collection.hooks?.afterRead || []), ...(imageHooks?.afterRead || [])]
				const collectionBeforeChangeHooks = [...(collection.hooks?.beforeChange || []), ...(imageHooks?.beforeChange || [])]
				const modifiedCollection: CollectionConfig = {
					...collection,
					hooks: {
						...(collection.hooks || {}),
						afterRead: collectionAfterReadHooks,
						beforeChange: collectionBeforeChangeHooks
					},
					fields: [...collectionFields],
					upload: configureUpload({
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
					})
				};

				return modifiedCollection;
			});

			config.endpoints = [...(config.endpoints || []), ...providers,];

			return config;
		};
