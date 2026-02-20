import {getCategoryOverview} from "@/payload/collections/Posts/api/queryPostBySlug";
import {Config, Search} from "@payload-types";
import {Locale} from "next-intl";
import {CollectionSlug, DataFromCollectionSlug} from "payload";
import {uuidv7} from "uuidv7";
import type {DocToSync, SyncDocArgs} from "../types"

export type CollectionMap = Config["collections"]
export const syncDocAsSearchIndex = async ({
	                                           collection,
	                                           doc,
	                                           locale,
	                                           onSyncError,
	                                           operation,
	                                           pluginConfig,
	                                           req: {payload},
	                                           req,
                                           }: SyncDocArgs) => {
	const {id, _status: status, title, allowList, authority, locked, slug} = doc || {}
	const category: Search["category"] = []
	if ("category" in doc) {
		const catId = typeof doc.category === "string" ? doc.category : doc.category.id;
		const c = await getCategoryOverview({
			id: catId,

		}).then(r => ({
			id: uuidv7(),
			key: r.id,
			slug: r.slug,
			title: r.title,
		}));
		category.push(c)
	}

	const {beforeSync, defaultPriorities, deleteDrafts, searchOverrides, syncDrafts} = pluginConfig

	const searchSlug = (searchOverrides?.slug || "search") as Extract<CollectionSlug, "search">
	const syncLocale = (locale || req.locale) as Locale
	const author: Search["author"] = []
	const allowListArr = allowList?.map(r => ({
		id: uuidv7(),
		key: typeof r === "string" ? r : r.id
	}))
	let dataToSave: DocToSync = {
		doc: {
			relationTo: collection,
			value: id,
		}, allowList: allowListArr, authority: typeof authority === "number" ? authority : 0,
		category,
		slug,
		author,
		locked: typeof locked === "boolean" ? locked : false,
		title,
	}
	const docKeyPrefix = `${collection}:${id}`
	const docKey = pluginConfig.locales?.length ? `${docKeyPrefix}:${syncLocale}` : docKeyPrefix
	const syncedDocsSet = (req.context?.syncedDocsSet as Set<string>) || new Set<string>()

	if (syncedDocsSet.has(docKey)) {
		/*
		 * prevents duplicate syncing of documents in the same request
		 * this can happen when hooks call `payload.update` within the create lifecycle
		 * like the nested-docs plugin does
		 */
		return doc
	} else {
		syncedDocsSet.add(docKey)
	}

	req.context.syncedDocsSet = syncedDocsSet

	if (typeof beforeSync === "function") {
		let docToSyncWith = doc
		if (payload.config?.localization) {
			// Check if document is trashed (has deletedAt field)
			const isTrashDocument = !!doc && "deletedAt" in doc && !!doc.deletedAt

			docToSyncWith = await payload.findByID({
				id,
				collection,
				locale: syncLocale,
				req,
				// Include trashed documents when the document being synced is trashed
				trash: isTrashDocument,
			})
		}
		dataToSave = await beforeSync({
			originalDoc: docToSyncWith,
			payload,
			req,
			searchDoc: dataToSave,
		})
	}

	let defaultPriority = 0
	if (defaultPriorities) {
		const priority = defaultPriorities[collection] as ((doc: DataFromCollectionSlug<typeof collection>) => number | Promise<number>) | number

		if (typeof priority === "function") {
			try {
				defaultPriority = await priority(doc)
			} catch (err: unknown) {
				payload.logger.error(err)
				payload.logger.error(
					`Error gathering default priority for ${searchSlug} documents related to ${collection}`,
				)
			}
		} else if (priority !== undefined) {
			defaultPriority = priority
		}
	}

	const doSync = syncDrafts || (!syncDrafts && status !== "draft")

	try {
		if (operation === "create" && doSync) {
			const {id, ...saver} = dataToSave
			await payload.create({
				collection: searchSlug,
				draft: false,
				data: {
					...saver,
				 
					priority: defaultPriority,
				},
				depth: 0,
				locale: syncLocale,
				req,
			})
		}

		if (operation === "update") {
			try {
				// find the correct doc to sync with
				const searchDocQuery = await payload.find({
					collection: searchSlug,
					depth: 0,
					locale: syncLocale,
					req,
					where: {
						"doc.relationTo": {
							equals: collection,
						},
						"doc.value": {
							equals: id,
						},
					},
				})

				const docs: Array<{
					id: string
					priority?: number
				}> = searchDocQuery?.docs.map(r => ({
					id: r.id,
					...(typeof r.priority === "number" && {priority: r.priority})
				})) || []

				const [foundDoc, ...duplicativeDocs] = docs

				// delete all duplicative search docs (docs that reference the same page)
				// to ensure the same, out-of-date result does not appear twice (where only syncing the first found doc)
				if (duplicativeDocs.length > 0) {
					try {
						const duplicativeDocIDs = duplicativeDocs.map(({id}) => id)
						await payload.delete({
							collection: searchSlug,
							depth: 0,
							req,
							where: {id: {in: duplicativeDocIDs}},
						})
					} catch (err: unknown) {
						payload.logger.error({
							err,
							msg: `Error deleting duplicative ${searchSlug} documents.`,
						})
					}
				}

				if (foundDoc) {
					const {id: searchDocID} = foundDoc

					if (doSync) {
						// update the doc normally
						try {
							await payload.update({
								id: searchDocID,
								collection: searchSlug,
								data: {
									...dataToSave,
									priority: foundDoc.priority || defaultPriority,
								},
								depth: 0,
								locale: syncLocale,
								req,
							})
						} catch (err: unknown) {
							payload.logger.error({
								err,
								msg: `Error updating ${searchSlug} document.`
							})
						}
					}

					// Check if document is trashed and delete from search
					const isTrashDocument = doc && "deletedAt" in doc && doc.deletedAt

					if (isTrashDocument) {
						try {
							await payload.delete({
								id: searchDocID,
								collection: searchSlug,
								depth: 0,
								req,
							})
						} catch (err: unknown) {
							payload.logger.error({
								err,
								msg: `Error deleting ${searchSlug} document for trashed doc.`,
							})
						}
					}

					if (deleteDrafts && status === "draft") {
						// Check to see if there's a published version of the doc
						// We don't want to remove the search doc if there is a published version but a new draft has been created
						const {
							docs: [docWithPublish],
						} = await payload.find({
							collection,
							depth: 0,
							draft: false,
							limit: 1,
							locale: syncLocale,
							pagination: false,
							req,
							where: {
								and: [
									{
										_status: {
											equals: "published",
										},
									},
									{
										id: {
											equals: id,
										},
									},
								],
							},
						})

						if (!docWithPublish && !isTrashDocument) {
							// do not include draft docs in search results, so delete the record
							try {
								await payload.delete({
									id: searchDocID,
									collection: searchSlug,
									depth: 0,
									req,
								})
							} catch (err: unknown) {
								payload.logger.error({
									err,
									msg: `Error deleting ${searchSlug} document.`
								})
							}
						}
					}
				} else if (doSync) {
					try {
						await payload.create({
							collection: searchSlug,
							data: {
								...dataToSave,
								priority: defaultPriority,
							},
							depth: 0,
							locale: syncLocale,
							req,
						})
					} catch (err: unknown) {
						payload.logger.error({err, msg: `Error creating ${searchSlug} document.`})
					}
				}
			} catch (err: unknown) {
				payload.logger.error({err, msg: `Error finding ${searchSlug} document.`})
			}
		}
	} catch (err: unknown) {
		payload.logger.error({
			err,
			msg: `Error syncing ${searchSlug} document related to ${collection} with id: '${id}'.`,
		})

		if (onSyncError) {
			onSyncError()
		}
	}

	return doc
}
