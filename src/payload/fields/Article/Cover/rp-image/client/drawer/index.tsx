import {useDarkRoom} from "@/payload/fields/Article/Cover/ImageNode/DarkRoom";
import {
	INSERT_RP_IMAGE_COMMAND,
	INSERT_RP_IMAGE_WITH_TAB_COMMAND
} from "@/payload/fields/Article/Cover/rp-image/client/drawer/commands";
import {$createRPImageNode} from "@/payload/fields/Article/Cover/rp-image/client/node/RP_ImageNode";
import {
	RP_InternalImageNodeData
} from "@/payload/fields/Article/Cover/rp-image/server/node/RP_ImageNode";
import {ProcessedImageDoc} from "@/types/collections/imageCollections";
import {ImageCollectionSlug} from "@/types/payload-api-helpers";
import {useLexicalListDrawer} from "@payloadcms/richtext-lexical/client";
import {LexicalEditor} from "@payloadcms/richtext-lexical/lexical";
import {
	useLexicalComposerContext
} from "@payloadcms/richtext-lexical/lexical/react/LexicalComposerContext";
import {$getNodeByKey, COMMAND_PRIORITY_EDITOR} from "lexical";
import {useCallback, useEffect} from "react";
import {uuidv7} from "uuidv7";

export const insertRPImage = <T extends ImageCollectionSlug>({
	                                                             editor,
	                                                             relationTo,
	                                                             replaceNodeKey,
	                                                             value, meta
                                                             }: {
	editor: LexicalEditor
	relationTo: T
	replaceNodeKey: null | string
	value?: string;
	meta?: RP_InternalImageNodeData;
}) => {
	if (!replaceNodeKey) {
		if (value && relationTo && !!meta) {
			editor.dispatchCommand(INSERT_RP_IMAGE_COMMAND, {
				...meta, span: 100, width: meta.width || 100, height: meta.height || 100,
				alt: meta.alt || "", caption: meta.caption || "", darkmode: meta.darkmode || false,

				src: meta.src as string,
				relationTo,
				value,
			})
		} else {
			editor.dispatchCommand(INSERT_RP_IMAGE_COMMAND, {
				relationTo,
				pending: {
					formID: uuidv7()
				}
			})
		}
	} else {
		if (value && relationTo && meta) {
			editor.update(() => {
				const node = $getNodeByKey(replaceNodeKey)
				if (node) {
					node.replace($createRPImageNode({
						data: {
							...meta,
							src: meta.src as string
							, relationTo,
							value,
						},
					}))
				}
			})
		} else {
			editor.update(() => {
					const node = $getNodeByKey(replaceNodeKey)
					if (node) {
						node.replace($createRPImageNode({
							data: {
								relationTo: relationTo,
								pending: {
									formID: uuidv7()
								}
							}
						}))
					}
				}
			)
		}
	}
}

export const ImageTab = () => {
	const [editor] = useLexicalComposerContext()

	const replaceNodeKey = useDarkRoom(r => r.replaceNodeKey);
	const setReplaceNodeKey = useDarkRoom(r => r.setReplaceNodeKey);
	const setMenuOpen = useDarkRoom(r => r.setOpen)
	const activeCollection = useDarkRoom(r => r.activeCollection);
	const formID = useDarkRoom(r => r.formID);
	const closeMenu = useCallback(() => {
		setMenuOpen(false)
	}, [setMenuOpen])
	const cancelUpload = useCallback(() => {

	}, [])
	const openMenu = useCallback(({
		                              formID
	                              }: { formID: string; }) => {

	}, [])
	const {closeListDrawer, ListDrawer, openListDrawer} = useLexicalListDrawer({
		collectionSlugs: [],
		uploads: true,
	})

	useEffect(() => {
		return editor.registerCommand<{
			replace: { nodeKey: string } | false
		}>(
			INSERT_RP_IMAGE_WITH_TAB_COMMAND,
			(payload) => {
				setReplaceNodeKey(payload?.replace ? payload?.replace.nodeKey : null)
				openListDrawer()
				return true
			},
			COMMAND_PRIORITY_EDITOR,
		)
	}, [editor, openListDrawer])
//<NonNullable<ListDrawerProps['onSelect']>>
	const onSelect = useCallback(async ({collection, doc}: {
			collection: ImageCollectionSlug;
			doc: ProcessedImageDoc;
		}) => {
			insertRPImage({
				editor,
				relationTo: collection,
				replaceNodeKey,
				value: doc.id,
			})
		},
		[editor, replaceNodeKey],
	)

	return <></>
}