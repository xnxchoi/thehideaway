import {useDarkRoom} from "@/payload/fields/Article/Cover/ImageNode/DarkRoom";
import {ImageForm} from "@/payload/fields/Article/Cover/ImageNode/Forms/schema";
import {
	UploadResult,
	useRPUploadMutation
} from "@/payload/fields/Article/Cover/ImageNode/hooks/useRPImageQuery";
import {
	INSERT_RP_IMAGE_COMMAND,
	RPImagePayload
} from "@/payload/fields/Article/Cover/rp-image/client/drawer/commands";
import {
	$createRPImageNode,
	$isRPImageNode,
	RP_ImageNode
} from "@/payload/fields/Article/Cover/rp-image/client/node/RP_ImageNode";
import {
	Internal_RPImageData
} from "@/payload/fields/Article/Cover/rp-image/server/node/RP_ImageNode";
import {RenderImageFields} from "@/types/collections/imageCollections";
import {ImageCollectionSlug} from "@/types/payload-api-helpers";
import {isHTMLElement} from "@payloadcms/richtext-lexical/client";
import {
	$createRangeSelection,
	$getPreviousSelection,
	$getSelection,
	$isParagraphNode,
	$isRangeSelection,
	$setSelection,
	COMMAND_PRIORITY_EDITOR,
	COMMAND_PRIORITY_LOW,
	createCommand,
	DROP_COMMAND,
	getDOMSelectionFromTarget,
	LexicalCommand,
	PASTE_COMMAND
} from "@payloadcms/richtext-lexical/lexical";
import {
	useLexicalComposerContext
} from "@payloadcms/richtext-lexical/lexical/react/LexicalComposerContext";
import {
	$dfsIterator,
	$insertNodeToNearestRoot,
	mergeRegister
} from "@payloadcms/richtext-lexical/lexical/utils";
import {useCallback, useEffect, useEffectEvent, useMemo} from "react";
import {uuidv7} from "uuidv7";

declare global {
	interface DragEvent {
		rangeOffset?: number
		rangeParent?: Node
	}
}

function canDropImage(event: DragEvent): boolean {
	const target = event.target
	if (!target) return false;
	return !!(
		isHTMLElement(target) &&
		!target.closest("code, span.editor-image") &&
		isHTMLElement(target.parentElement) &&
		target.parentElement.closest("div.ContentEditable__root")
	)
}

function getDragSelection(event: DragEvent): null | Range | undefined {
	// Source: https://github.com/AlessioGr/lexical/blob/main/packages/lexical-playground/src/plugins/ImagesPlugin/index.tsx
	let range
	const domSelection = getDOMSelectionFromTarget(event.target)
	if (document.caretRangeFromPoint) {
		range = document.caretRangeFromPoint(event.clientX, event.clientY)
	} else if (event.rangeParent && domSelection !== null) {
		domSelection.collapse(event.rangeParent, event.rangeOffset || 0)
		range = domSelection.getRangeAt(0)
	} else {
		throw Error(`Cannot get the selection when dragging`)
	}

	return range
}

export const INSERT_UPLOAD_COMMAND: LexicalCommand<RPImagePayload> =
	createCommand("INSERT_UPLOAD_COMMAND")
export const RPDarkRoomPlugin = () => {
	const enabledCollectionSlugs = useMemo(() => ["exMedia", "userMedia"] as Exclude<ImageCollectionSlug, "assets">[], [])
	const setActiveCollection = useDarkRoom(r => r.setActiveCollection)
	const [editor] = useLexicalComposerContext();
	const {mutateAsync, setOnSuccess} = useRPUploadMutation();
	const onOpen = useCallback(() => {

	}, [])
	const onUpload = useCallback((data: UploadResult, formID: string) => {
		const {
			alt,
			src,
			sizes,
			caption,
			blurDataUrl,
			source, darkmode, height, width,
		} = data.processed satisfies RenderImageFields;
		editor.update(() => {
			for (const dfsNode of $dfsIterator()) {
				const node = dfsNode.node
				if ($isRPImageNode(node)) {
					const nodeData: Internal_RPImageData = node.getData()

					if (nodeData?.pending) {
						const f = nodeData.pending.formID
						if (f === formID && data) {
							node.replace(
								$createRPImageNode({
									data: {
										id: uuidv7(),
										height: height || undefined,
										width: width || undefined,
										blurDataUrl: blurDataUrl || undefined,
										alt,
										caption: caption || undefined,
										src,
										darkmode,
										relationTo: data.relationTo,
										value: data.value.id,
									}
								}),
							)
						}
					}
				}
			}
		})
	}, [editor])

	const doUpload = useEffectEvent(async (items: Array<ImageForm & {
		alt: string;
		caption?: string;
		formID: string; author: string;
	}>) => {
		const r = items.map(async item => mutateAsync({
			formID: item.formID, payload: {
				file: item.file,
				collection: item.collection,
				alt: item.alt,
				caption: item.caption,
				author: item.author,
				darkmode: false,
				source: {
					identifier: "",
					provider: item.collection === "exMedia" ? "external" : "local"
				}
			}
		}))
		const v = await Promise.allSettled(r)
		v.flatMap(r => r.status === "fulfilled" ? r.value : []).forEach(r => onUpload(r, r.formID))
	})
	useEffect(() => {
		if (!editor.hasNodes([RP_ImageNode])) {
			throw new Error("RP_ImageNode not registered")
		}
		return mergeRegister(editor.registerCommand(INSERT_RP_IMAGE_COMMAND, (payload) => {
				editor.update(() => {
					const selection = $getSelection() || $getPreviousSelection()
					if ($isRangeSelection(selection)) {

						const {relationTo, id} = payload;

						const node = $createRPImageNode({data: payload})
						// we need to get the focus node before inserting the block node, as $insertNodeToNearestRoot can change the focus node
						const {focus} = selection
						const focusNode = focus.getNode()
						// Insert blocks node BEFORE potentially removing focusNode, as $insertNodeToNearestRoot errors if the focusNode doesn't exist
						$insertNodeToNearestRoot(node)

						// Delete the node it it's an empty paragraph
						if ($isParagraphNode(focusNode) && !focusNode.__first) {
							focusNode.remove()
						}

					}
				})
				return true
			}, COMMAND_PRIORITY_EDITOR), editor.registerCommand(
				PASTE_COMMAND,
				(event) => {
					// Pending UploadNodes are automatically created when importDOM is called. However, if you paste a file from your computer
					// directly, importDOM won't be called, as it's not a HTML dom element. So we need to handle that case here.

					if (!(event instanceof ClipboardEvent)) {
						return false
					}
					const clipboardData = event.clipboardData

					if (!clipboardData?.types?.length || clipboardData?.types?.includes("text/html")) {
						// HTML is handled through importDOM => registerNodeTransform for pending UploadNode
						return false
					}

					const files: { formID: string; file: File; alt: string }[] = []
					if (clipboardData?.files?.length) {
						Array.from(clipboardData.files).flatMap(r => r.type.startsWith("image/") ? r : []).forEach((file) => {
							files.push({
								alt: "",
								file,
								formID: uuidv7()
							})
						})
					}

					if (files.length) {
						// Insert a pending UploadNode for each image
						editor.update(() => {
							const selection = $getSelection() || $getPreviousSelection()

							if ($isRangeSelection(selection)) {
								for (const file of files) {
									const pendingUploadNode = $createRPImageNode({
										data: {
											pending: {
												formID: file.formID,
												src: URL.createObjectURL(file.file),
											},
										} as Internal_RPImageData,
									})
									// we need to get the focus node before inserting the upload node, as $insertNodeToNearestRoot can change the focus node
									const {focus} = selection
									const focusNode = focus.getNode()
									// Insert upload node BEFORE potentially removing focusNode, as $insertNodeToNearestRoot errors if the focusNode doesn't exist
									$insertNodeToNearestRoot(pendingUploadNode)

									// Delete the node it it's an empty paragraph
									if ($isParagraphNode(focusNode) && !focusNode.__first) {
										focusNode.remove()
									}
								}
							}
						})

						// Open the bulk drawer - the node transform will not open it for us, as it does not handle blob/file uploads

						return true
					}

					return false
				},
				COMMAND_PRIORITY_LOW,
			),
			// Handle drag & drop of files from the desktop into the editor
			editor.registerCommand(
				DROP_COMMAND,
				(event) => {
					if (!(event instanceof DragEvent)) {
						return false
					}

					const dt = event.dataTransfer

					if (!dt?.types?.length) {
						return false
					}

					const files: { file: File; alt: string; formID: string }[] = []
					if (dt?.files?.length) {
						Array.from(dt.files).flatMap(r => r.type.startsWith("image/") ? r : []).forEach((file) => {
							files.push({
								alt: "",
								file,
								formID: uuidv7(),
							})
						})
					}

					if (files.length) {
						// Prevent the default browser drop handling, which would open the file in the browser
						event.preventDefault()
						event.stopPropagation()

						// Insert a PendingUploadNode for each image
						editor.update(() => {
							if (canDropImage(event)) {
								const range = getDragSelection(event)
								const selection = $createRangeSelection()
								if (range !== null && range !== undefined) {
									selection.applyDOMRange(range)
								}
								$setSelection(selection)

								for (const file of files) {
									const pendingUploadNode = $createRPImageNode({
										data: {
											pending: {
												formID: file.formID,
												src: URL.createObjectURL(file.file),
											},
										} as Internal_RPImageData,
									})
									// we need to get the focus node before inserting the upload node, as $insertNodeToNearestRoot can change the focus node
									const {focus} = selection
									const focusNode = focus.getNode()
									// Insert upload node BEFORE potentially removing focusNode, as $insertNodeToNearestRoot errors if the focusNode doesn't exist
									$insertNodeToNearestRoot(pendingUploadNode)

									// Delete the node it it's an empty paragraph
									if ($isParagraphNode(focusNode) && !focusNode.__first) {
										focusNode.remove()
									}
								}
							}
						})

						// Open the bulk drawer - the node transform will not open it for us, as it does not handle blob/file uploads

						return true
					}

					return false
				},
				COMMAND_PRIORITY_LOW,
			),)
	}, [])
}