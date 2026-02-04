import type {ResolvedCollectionLabels} from "../../../types"

import {ReindexButtonClient} from "./index.client"
import type {SearchReindexButtonServerComponent} from "./types"

export const ReindexButton: SearchReindexButtonServerComponent = (props) => {
	const {collectionLabels, i18n, searchCollections, searchSlug} = props

	const resolvedCollectionLabels: ResolvedCollectionLabels = Object.fromEntries(
		searchCollections.map((collection) => {
			const labels = collectionLabels[collection]
			const pluralLabel = labels?.plural

			if (typeof pluralLabel === "function") {
				// @ts-expect-error - I don't know why it gives an error. pluralLabel and i18n.t should both resolve to TFunction<DefaultTranslationKeys>
				return [collection, pluralLabel({t: i18n.t})]
			}

			if (pluralLabel) {
				return [collection, pluralLabel]
			}

			return [collection, collection]
		}),
	) as ResolvedCollectionLabels

	return (
		<ReindexButtonClient
			collectionLabels={resolvedCollectionLabels}
			searchCollections={searchCollections}
			searchSlug={searchSlug}
		/>
	)
}
