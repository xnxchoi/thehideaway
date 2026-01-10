"use client"
import {ImageProcessForm, useDarkRoom} from "@/payload/fields/Article/Cover/ImageNode/DarkRoom";
import {
	INSERT_RP_IMAGE_COMMAND
} from "@/payload/fields/Article/Cover/rp-image/client/drawer/commands";
import {
	$createRPImageNode,
	$isRPImageNode,
	RP_ImageNode
} from "@/payload/fields/Article/Cover/rp-image/client/node/RP_ImageNode";
import {
	Internal_RPImageData,
	RP_ImageData
} from "@/payload/fields/Article/Cover/rp-image/server/node/RP_ImageNode";
import {ImageCollectionSlug} from "@/types/ImageCollections";
import {imageSelect} from "@/types/payload-api-selects";
import {getClientSideURL} from "@/utilities/getURL";
import {PluginComponent} from "@payloadcms/richtext-lexical";
import {
	$createRangeSelection,
	$getPreviousSelection,
	$getSelection,
	$isParagraphNode,
	$isRangeSelection,
	$setSelection,
	COMMAND_PRIORITY_EDITOR,
	COMMAND_PRIORITY_LOW,
	DROP_COMMAND,
	getDOMSelectionFromTarget,
	isHTMLElement,
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
import {useAuth, useEffectEvent} from "@payloadcms/ui";
import {$getNodeByKey} from "lexical";
import {stringify} from "qs-esm";
import {useEffect, useMemo} from "react";
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

export const DarkRoomPlugin: PluginComponent = () => {
	const enabledCollectionSlugs = useMemo(() => ["media", "userMedia"] as Exclude<ImageCollectionSlug, "assets">[], [])

	const setActiveCollection = useDarkRoom(r => r.setActiveCollection)
	const setOnCancel = useDarkRoom(r => r.setOnCancel)
	const setOnSuccess = useDarkRoom(r => r.setOnSuccess)
	const setImageForm = useDarkRoom(r => r.setImageForm)

	const [editor] = useLexicalComposerContext();
	const {user} = useAuth()
	const queryString = useMemo(() => stringify({select: imageSelect()}, {addQueryPrefix: true}), [])
	const openUploadTab = useEffectEvent((forms: ImageProcessForm[]) => {
		if (forms.length < 1) return;
		setImageForm(forms)
		setOnCancel(() => {
			editor.update(() => {
				for (const dfsNode of $dfsIterator()) {
					const node = dfsNode.node
					if ($isRPImageNode(node)) {
						const nodeData = node.getData()
						if (nodeData?.pending) {
							const f = nodeData.pending.formID
							for (const form of forms) {
								if (f === form.formID) {
									node.remove()
								}
							}
						}
					}
				}
			})
		})

	})
	const serverURL = getClientSideURL();
	useEffect(() => {
		if (!editor.hasNodes([RP_ImageNode])) {
			throw new Error("RP_ImageNode not registered")
		}
		if (!user) return;
		return mergeRegister(
			editor.registerNodeTransform(RP_ImageNode, (node) => {
				const nodeData = node.getData();
				if (!(nodeData?.pending)) {
					return;
				}

				async function upload() {
					let transformedImage: ImageProcessForm | null = null
					if (!(nodeData?.pending)) {
						return;
					}
					const src = nodeData.pending.src
					const formID = nodeData?.pending?.formID as string
					const meta = {
						alt: "",
						author: user?.id + "",
						source: {

							provider: "local" as const
						},
						darkmode: false,
					}
					if (src?.startsWith("data:")) {
						// It's a base64-encoded image
						const mimeMatch = src.match(/data:(image\/[a-zA-Z]+);base64,/)
						const mimeType = mimeMatch ? mimeMatch[1] : "image/png" // Default to PNG if MIME type not found
						const base64Data = src.replace(/^data:image\/[a-zA-Z]+;base64,/, "")
						const byteCharacters = atob(base64Data)
						const byteNumbers = new Array(byteCharacters.length)
						for (let i = 0; i < byteCharacters.length; i++) {
							byteNumbers[i] = byteCharacters.charCodeAt(i)
						}
						const byteArray = new Uint8Array(byteNumbers)
						const file = new File([byteArray], "pasted-image." + mimeType?.split("/", 2)[1], {
							type: mimeType,
						})
						transformedImage = {
							meta, file, formID
						}
					} else if (src?.startsWith("http") || src?.startsWith("https")) {
						// It's an image URL
						const res = await fetch(src)
						const blob = await res.blob()
						const inferredFileName =
							src.split("/").pop() || "pasted-image" + blob.type.split("/", 2)[1]
						const file = new File([blob], inferredFileName, {
							type: blob.type,
						})

						transformedImage = {meta, file, formID}
					}

					if (!transformedImage) {
						return
					}

					openUploadTab([transformedImage])
				}

				void upload()
			}),
			editor.registerCommand(INSERT_RP_IMAGE_COMMAND, (payload) => {
				editor.update(async () => {
					const selection = $getSelection() || $getPreviousSelection()
					if ($isRangeSelection(selection)) {

						// const {relationTo, pending,} = payload;
						// let meta: RP_InternalImageNodeData | undefined;
						// if ("value" in payload) {
						// 	const {value} = payload;
						// 	const res = await fetch(`${serverURL}/api/${relationTo}/${value}${queryString}`, {
						// 		method: "GET",
						// 		headers: {
						// 			"Content-Type": "application/json"
						// 		}, cache: "force-cache",
						// 		credentials: "include"
						// 	})
						// 	if (res.ok) {
						// 		const ress = await res.json() as RenderImageFields
						// 		const {
						// 			width,
						// 			height,
						// 			src,
						// 			alt,
						// 			caption,
						// 			darkmode,
						// 			blurDataUrl,
						//
						// 		} = ress;
						// 		meta = {
						// 			width: width || undefined,
						// 			height: height || undefined,
						// 			src: typeof src === "string" ? src : src.src,
						// 			alt,
						// 			caption,
						// 			darkmode,
						// 			blurDataUrl: blurDataUrl || undefined,
						// 		}
						// 	} else {
						// 		console.error(res.statusText)
						// 	}
						// }
						const node = $createRPImageNode({data: ({...payload,})})
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

					const files: ImageProcessForm[] = []
					if (clipboardData?.files?.length) {
						for (const r of Array.from(clipboardData.files).flatMap(r => r.type.startsWith("image/") ? r : [])) {

							r && files.push({
								file: r,
								formID: uuidv7(),
								meta: {
									alt: "",
									darkmode: false,

									author: user.id + "",
								}
							})
						}
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
											placeholder: false,

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
						openUploadTab(files)
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

					const files: ImageProcessForm[] = []
					if (dt?.files?.length) {
						Array.from(dt.files).flatMap(r => r.type.startsWith("image/") ? r : []).forEach((file) => {
							files.push({
								file,
								formID: uuidv7(), meta: {
									alt: "",
									darkmode: false,

									author: user.id + "",
								}
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
						openUploadTab(files)
						return true
					}

					return false
				},
				COMMAND_PRIORITY_LOW,
			),)
	}, [editor, user])
	return <></>
}