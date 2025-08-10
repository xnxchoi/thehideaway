import type {CollectionConfig, CollectionSlug, Plugin, User} from 'payload'
import {lockCollections} from '@/payload/plugins/locker/lockCollections'
import {LockedAccessCollection} from '@/payload/plugins/locker/access'

export interface LockerPluginConfig {
	/**
	 * Enable or disable plugin
	 *
	 * @default true
	 */
	enabled?: boolean

	/**
	 * The slug of the collection that contains the users
	 *
	 * @default []
	 */
	targetCollections?: LockedAccessCollection[]
	userCollections?: CollectionSlug[]
	collectionOverrides?: {
		[x in CollectionSlug]?: Partial<CollectionConfig<x>>
	}
}

export const lockerPlugin =
	(pluginOptions: LockerPluginConfig): Plugin =>
		(incomingConfig) => {
			const config = {...incomingConfig}

			// If the plugin is disabled, return the config as is
			if (pluginOptions.enabled === false) {
				return config
			}

			// Generate users collection
			config.collections = [...(config.collections || [])]
			lockCollections(config.collections, pluginOptions)


			// Add custom components to admin
			config.admin = {
				...config.admin,
			}

			return config
		}
