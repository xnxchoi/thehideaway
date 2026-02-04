import type {SyncWithSearch} from "../../types"

import {syncDocAsSearchIndex} from "../../utilities/syncDocAsSearchIndex"

export const syncWithSearch: SyncWithSearch = (args) => {
	return syncDocAsSearchIndex(args)
}
