import {deleteFromSearch} from "@/payload/plugins/plugin-search/Search/hooks/deleteFromSearch"
import {syncWithSearch} from "@/payload/plugins/plugin-search/Search/hooks/syncWithSearch"
import type {CollectionAfterChangeHook, CollectionConfig, CollectionSlug, Config} from "payload"
import {generateSearchCollection} from "./Search"

import type {IndexedCollectionSlug, SanitizedSearchPluginConfig, SearchPluginConfig} from "./types"

type CollectionAfterChangeHookArgs = Parameters<CollectionAfterChangeHook>[0]

export const searchPlugin =
	(incomingPluginConfig: SearchPluginConfig) =>
		(config: Config): Config => {
			const {collections} = config

			// If the user defines `localize` to either true or false, use that
			// Otherwise, set it based on if their config has localization enabled or disabled
			const shouldLocalize =
				typeof incomingPluginConfig.localize === "boolean"
					? incomingPluginConfig.localize
					: Boolean(config.localization)
			incomingPluginConfig.localize = shouldLocalize

			if (collections) {
				const locales = config.localization
					? config.localization.locales.map((localeConfig) =>
						typeof localeConfig === "string" ? localeConfig : localeConfig.code,
					)
					: []

				const labels = Object.fromEntries(
					collections
						.filter(({slug}) => incomingPluginConfig.collections?.some(r => r === slug as CollectionSlug))
						.map((collection) => [collection.slug as IndexedCollectionSlug, collection.labels]),
				) as Record<IndexedCollectionSlug, CollectionConfig["labels"]>

				const pluginConfig: SanitizedSearchPluginConfig = {
					// write any config defaults here
					deleteDrafts: true,
					labels,
					locales,
					reindexBatchSize: incomingPluginConfig?.reindexBatchSize || 50,
					syncDrafts: false,
					...incomingPluginConfig,
				}

				// add afterChange and afterDelete hooks to every search-enabled collection
				const collectionsWithSearchHooks = config?.collections
					?.map((collection) => {
						const {hooks: existingHooks} = collection

						const enabledCollections = pluginConfig.collections || []
						const isEnabled = enabledCollections.some(e => e === collection.slug)
						if (isEnabled) {
							return {
								...collection,
								hooks: {
									...collection.hooks,
									afterChange: [
										...(existingHooks?.afterChange || []),
										async (args: CollectionAfterChangeHookArgs) => {
											await syncWithSearch({
												...args,
												collection: collection.slug as IndexedCollectionSlug,
												pluginConfig,
											})
										},
									],
									beforeDelete: [
										...(existingHooks?.beforeDelete || []),
										deleteFromSearch(pluginConfig),
									],
								},
							}
						}

						return collection
					})
					.filter(Boolean)

				return {
					...config,
					collections: [
						...(collectionsWithSearchHooks || []),
						generateSearchCollection(pluginConfig),
					],
				}
			}

			return config
		}
