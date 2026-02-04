import type {CustomComponent, PayloadServerReactComponent} from "payload"

import type {
	CollectionLabels,
	IndexedCollectionSlug,
	ResolvedCollectionLabels
} from "../../../types"

export type ReindexButtonProps = {
	collectionLabels: ResolvedCollectionLabels
	searchCollections: IndexedCollectionSlug[]
	searchSlug: string
}

export type ReindexButtonServerProps = {
	collectionLabels: CollectionLabels
} & Omit<ReindexButtonProps, "collectionLabels">

export type SearchReindexButtonClientComponent = ReindexButtonProps

export type SearchReindexButtonServerComponent = PayloadServerReactComponent<
	CustomComponent<ReindexButtonServerProps>
>
