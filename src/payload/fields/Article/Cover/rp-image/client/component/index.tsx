"use client"
import {RIGHT_CLICK_IMAGE_COMMAND} from "@/components/editor/editor-ui/image-component";
import {Skeleton} from "@/components/ui/skeleton";
import {EASING} from "@/constants/animations";
import {cn} from "@/lib/utils";
import {
	FrameContextMenu,
	FrameContextMenuHandle,
	FrameMenuItem,
	FrameToolbar
} from "@/payload/fields/Article/Cover/Components/CoverMenu";
import {useDarkRoom} from "@/payload/fields/Article/Cover/ImageNode/DarkRoom";
import {ImageForm, ImageMetadata} from "@/payload/fields/Article/Cover/ImageNode/Forms/schema";
import {
	useRPImageNodeQuery,
	useRPUploadMutation
} from "@/payload/fields/Article/Cover/ImageNode/hooks/useRPImageQuery";
import {ImageResizer} from "@/payload/fields/Article/Cover/rp-image/client/component/ImageResizer";
import {
	$isRPImageNode,
	RP_ImageNode
} from "@/payload/fields/Article/Cover/rp-image/client/node/RP_ImageNode";
import {
	$isRPImageServerNode,
	EmptyImageBlock,
	RenderImageFieldsWithSource,
	RP_ImageData,
	RP_InternalImageNodeData
} from "@/payload/fields/Article/Cover/rp-image/server/node/RP_ImageNode";
import {RPImageFrame} from "@/payload/fields/Article/Cover/RPImageFrame";
import {useCursor} from "@/providers/RP_Pro";
import {useTheme} from "@/providers/Theme";
import {ContextMenu, Dialog} from "@base-ui/react";
import {$getNodeByKey, ElementFormatType, NodeKey} from "@payloadcms/richtext-lexical/lexical";
import {
	useLexicalComposerContext
} from "@payloadcms/richtext-lexical/lexical/react/LexicalComposerContext";
import {useLexicalEditable} from "@payloadcms/richtext-lexical/lexical/react/useLexicalEditable";
import {
	useLexicalNodeSelection
} from "@payloadcms/richtext-lexical/lexical/react/useLexicalNodeSelection";
import {mergeRegister} from "@payloadcms/richtext-lexical/lexical/utils";
import {
	$getSelection,
	$isNodeSelection,
	CLICK_COMMAND,
	COMMAND_PRIORITY_LOW,
	DRAGSTART_COMMAND,
	LexicalEditor,
	SELECTION_CHANGE_COMMAND
} from "lexical";
import {MotionNodeDragHandlers, MotionNodeTapHandlers} from "motion";
import {MotionValue, useMotionValue} from "motion/react";
import * as m from "motion/react-m"
import {
	createContext,
	ReactNode,
	useCallback,
	useContext,
	useEffect,
	useMemo,
	useRef,
	useState
} from "react";

export type ElementProps = {
	className?: string
	data: RenderImageFieldsWithSource
	format?: ElementFormatType
	nodeKey: string
}
type FrameState = {

	span: MotionValue<number>
	format: ElementFormatType


	setIsResizing: (r: boolean) => void
	isResizing: boolean
	nodeKey: NodeKey

}
const RPImageNodeCtx = createContext<FrameState | null>(null)
export const useRPImageNode = <T, >(selector: (store: FrameState) => T) => {
	const ctx = useContext(RPImageNodeCtx);
	if (!ctx) {
		throw new Error("useRPImageFramer must be used within a RPImageNodeCtx.Provider")
	}
	return selector(ctx);
}
export const FrameStoreProvider = ({
	                                   children, nodeKey,
	                                   width, span: spanFromProps,
                                   }: {
	children: ReactNode;
	nodeKey: NodeKey;
} & RP_InternalImageNodeData) => {
	const setShowCaption = useCallback(() => {
	}, [])
	const [editor] = useLexicalComposerContext();
	const [format, _setFormat] = useState<ElementFormatType>("start");
	useEffect(() => {
		const unsub = editor.registerMutationListener(RP_ImageNode, (mutatedNodes, {}) => {
			for (const [nodeKey, mutation] of mutatedNodes) {
				switch (mutation) {
					case "created":
					case "updated":
						const node = $getNodeByKey(nodeKey);
						if (node && $isRPImageNode(node)) {
							_setFormat(node.__format);
						}
				}
			}
		})
	}, [])
	const [isResizing, setIsResizing] = useState(false)
	const span = useMotionValue(spanFromProps || width || 640);
	return <RPImageNodeCtx.Provider value={{
		span, format,
		setIsResizing, nodeKey, isResizing
	}}>{children}</RPImageNodeCtx.Provider>

}
export const RP_ImageBlock = ({
	                              format,
	                              data: {
		                              value,
		                              caption,
		                              src,
		                              sizes, alt: altFromMeta,
		                              showCaption,
		                              height,
		                              width,
		                              darkmode: darkmodeFromMeta
		                              , relationTo, id,
	                              },
	                              nodeKey
                              }: ElementProps) => {
	if (typeof value === "object") {
		throw new Error(
			"Upload value should be a string. The Lexical Upload component should not receive the populated value object.",
		)
	}
	const span = useRPImageNode(r => r.span)

	const {data, isError, isFetching,} = useRPImageNodeQuery({
		doc: {value, relationTo},
		initialData: {
			alt: altFromMeta,
			darkmode: darkmodeFromMeta || false,
			caption: caption,
			height: height,
			width: width,

			source: {identifier: value, provider: relationTo === "exMedia" ? "external" : "local"},
			id: value
		},
		nodeKey
	})
	const isResizing = useRPImageNode(r => r.isResizing)
	const theme = useTheme(r => r.theme);
	const [editor] = useLexicalComposerContext()
	const isEditable = useLexicalEditable()
	const [isSelected, setSelected, clearSelection] =
		useLexicalNodeSelection(nodeKey);
	const activeEditorRef = useRef<LexicalEditor | null>(null);
	const [darkmode, _setDarkmode] = useState(data?.darkmode || false);
	const setDarkmode = useCallback((r: boolean) => {
		editor.update(() => {
			const node = $getNodeByKey(nodeKey);
			if (node && $isRPImageServerNode(node)) {
				const lastData = node.getData();
				node.setData({
					...lastData,
					darkmode: r
				})

			}
		});
	}, [editor, nodeKey])
	const [hovered, setHovered] = useState(false)
	const onEnter = useCallback(() => {
		setHovered(true);
	}, [])
	const onLeave = useCallback(() => {
		setHovered(false)
	}, [])
	const setCursorTheme = useCursor(r => r.setCursorTheme);
	const resetCursorTheme = useCursor(r => r.resetCursorTheme);
	useEffect(() => {
		if (hovered) {
			darkmode && setCursorTheme("dark")
		} else {
			resetCursorTheme()
		}
	}, [darkmode, hovered, resetCursorTheme, setCursorTheme])
	const imageRef = useRef<HTMLImageElement>(null!);
	const isInNodeSelection = useMemo(
		() =>
			isSelected &&
			editor.getEditorState().read(() => {
				const selection = $getSelection();
				return $isNodeSelection(selection) && selection.has(nodeKey);
			}),
		[editor, isSelected, nodeKey],
	);

	const onClick = useCallback(
		(payload: MouseEvent) => {
			const event = payload;

			if (isResizing) {
				return true;
			}
			if (event.target === imageRef.current) {
				if (event.shiftKey) {
					setSelected(!isSelected);
				} else {
					clearSelection();
					setSelected(true);
				}
				return true;
			}

			return false;
		},
		[isResizing, isSelected, setSelected, clearSelection],
	);

	useEffect(() => {
		return mergeRegister(
			editor.registerCommand(
				SELECTION_CHANGE_COMMAND,
				(_, activeEditor) => {
					activeEditorRef.current = activeEditor;
					return false;
				},
				COMMAND_PRIORITY_LOW,
			),
			editor.registerCommand(
				DRAGSTART_COMMAND,
				(event) => {
					if (event.target === imageRef.current) {
						// TODO This is just a temporary workaround for FF to behave like other browsers.
						// Ideally, this handles drag & drop too (and all browsers).
						event.preventDefault();
						return true;
					}
					return false;
				},
				COMMAND_PRIORITY_LOW,
			),
		);
	}, [editor]);
	useEffect(() => {
		let rootCleanup = () => {
		};
		return mergeRegister(
			editor.registerCommand<MouseEvent>(
				CLICK_COMMAND,
				onClick,
				COMMAND_PRIORITY_LOW,
			),
			editor.registerCommand<MouseEvent>(
				RIGHT_CLICK_IMAGE_COMMAND,
				onClick,
				COMMAND_PRIORITY_LOW,
			),

			editor.registerRootListener((rootElement) => {
				rootCleanup();
				rootCleanup = () => {
				};

			}),
			() => rootCleanup(),
		);
	}, [editor, onClick,]);
	const setIsResizing = useRPImageNode(r => r.setIsResizing)

	const onResizeEnd: NonNullable<MotionNodeDragHandlers["onDragEnd"]> = useCallback((
		event, info) => {
		// Delay hiding the resize bars for click case
		setTimeout(() => {
			setIsResizing(false);
		}, 200);

		editor.update(() => {
			const node = $getNodeByKey(nodeKey);
			if ($isRPImageNode(node)) {
				span.get()
			}
		});
	}, [editor, nodeKey, setIsResizing, span])

	const onResizeStart = useCallback(() => {
		setIsResizing(true);
	}, [setIsResizing]);
	return isError ? <></> : isFetching ? <Skeleton className={"rounded-2xl w-full"}/> : data &&
        <FrameStoreProvider nodeKey={nodeKey} {...{...data, id, relationTo, value}}
        >
            <m.div
                className={cn("w-full max-w-(--content-width) p-3.5 transition-[width] duration-150", darkmode && "dark",
					format === "left" || format === "start" ? "self-start" : format === "right" || format === "end" ?
						"self-end" : "self-center"
				)}
                style={{width: span}}
                onMouseEnter={onEnter}
                data-theme={darkmode ? "dark" : theme}
                onMouseLeave={onLeave}>
                <ContextMenu.Root handle={FrameContextMenuHandle}>
                    <ContextMenu.Trigger>
                        <div className={"contents"}>
                            <div role={"figure"}>
                                <div className={"w-fit flex"}>
                                    <div className={"relative overflow-hidden grow group"}>
                                        <RPImageFrame darkmode={darkmode} image={data}
                                                      imageRef={imageRef}
                                                      hover={hovered}/> {isEditable && <>
                                        <FrameToolbar hover={hovered}/>
                                        <ImageResizer editor={editor} imageRef={imageRef}
                                                      motionWidth={span}
                                                      onResizeStart={onResizeStart}
                                                      onResizeEnd={onResizeEnd}/></>}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </ContextMenu.Trigger>
                    <ContextMenu.Portal>
                        <FrameContextMenu>
                            <FrameMenuItem onClick={() => {
							}}>
                                <div
                                    className="flex items-center justify-center min-w-8 min-h-8">
                                    <div
                                        className={"justify-center items-center flex fill-faded-foreground text-faded-foreground"}>
                                        <svg viewBox="0 0 20 20" className="size-8 block shrink-0">
                                            <path
                                                d={"M5.5 2.375A2.125 2.125 0 0 0 3.375 4.5v5.25c0 1.174.951 2.125 2.125 2.125H13a2.125 2.125 0 0 0 2.125-2.125V4.5A2.125 2.125 0 0 0 13 2.375zM4.625 4.5c0-.483.392-.875.875-.875H13c.483 0 .875.392.875.875v5.25a.875.875 0 0 1-.875.875H5.5a.875.875 0 0 1-.875-.875zm-1.25 9.62c0-.345.28-.625.625-.625h12a.625.625 0 1 1 0 1.25H4a.625.625 0 0 1-.625-.625m0 2.88c0-.345.28-.625.625-.625h8.55a.625.625 0 1 1 0 1.25H4A.625.625 0 0 1 3.375 17"}/>

                                        </svg>
                                    </div>
                                </div>
                                <div className="mx-0 min-w-0 flex-[1_1_auto]">
                                    <div
                                        className={"text-ellipsis overflow-hidden whitespace-nowrap"}>Caption
                                    </div>
                                </div>
                            </FrameMenuItem>
                        </FrameContextMenu>
                    </ContextMenu.Portal>
                </ContextMenu.Root>
                <Dialog.Root>
                    <Dialog.Portal>
                        <Dialog.Popup>

                        </Dialog.Popup>
                    </Dialog.Portal>
                </Dialog.Root>
            </m.div>
        </FrameStoreProvider>
}
export const RP_InsertImagePlaceholder = (props: {
	formID: string;
	data: EmptyImageBlock
} & Omit<ElementProps, "data">) => {
	const {nodeKey} = props;
	const onOpen = useCallback(() => {
	}, [])
	const setFormID = useDarkRoom(r => r.setFormId);
	const setOpen = useDarkRoom(r => r.setOpen)

	const onOpenCommand: NonNullable<MotionNodeTapHandlers["onTap"]> = useCallback((e, info) => {
		e.preventDefault();
		e.stopPropagation();
		onOpen();
		const d = (e.currentTarget as HTMLDivElement).getAttribute("data-disabled");
		if (d === "true") {
			return;
		}

		setOpen(true);
	}, [onOpen, setOpen])
	return <div>
		<div className={"select-none flex w-full rounded-2xl bg-transparent"}>
			<m.div style={{
				backgroundColor: "oklch(36.76% 0.3% 58.67)"
			}} transition={{
				type: "tween",
				duration: 0.2,
				ease: EASING.power2.out
			}}
			       onTap={onOpenCommand}
			       whileTap={{
				       backgroundColor: "oklch(77.94% 0.3% 58.67)"
			       }} role={"button"} className={"flex select-none w-full"}>
				<div
					className={"p-[12px] pr-14 flex items-center text-start w-full rounded-2xl overflow-hidden"}>
					<div className={"text-ellipsis whitespace-nowrap overflow-hidden"}>Add an Image
					</div>
					<div>
						<svg className={"size-10 block shrink-0 mr-5 fill-faded-foreground"}>
							<path d={"M8.5 9.31a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3"}/>
							<path
								d={"M2.375 6.25c0-1.174.951-2.125 2.125-2.125h11c1.174 0 2.125.951 2.125 2.125v7.5a2.125 2.125 0 0 1-2.125 2.125h-11a2.125 2.125 0 0 1-2.125-2.125zM4.5 5.375a.875.875 0 0 0-.875.875v5.491l1.996-1.995a.625.625 0 0 1 .883 0l1.98 1.98 4.137-4.137a.625.625 0 0 1 .883 0l2.871 2.87V6.25a.875.875 0 0 0-.875-.875zm11.875 6.852-3.312-3.312-4.137 4.136a.625.625 0 0 1-.884 0l-1.98-1.98-2.437 2.438v.241c0 .483.392.875.875.875h11a.875.875 0 0 0 .875-.875z"}/>
						</svg>
					</div>
				</div>
			</m.div>
		</div>
	</div>
}
const ImageNodeBLock = ({
	                        data: {
		                        relationTo,
		                        value: v,
		                        darkmode: darkmodeFromMeta,
		                        caption, showCaption, span, height, width, alt: altFromMeta,
	                        }, nodeKey
                        }: ElementProps) => {
	const value = v as string;
	const [editor] = useLexicalComposerContext()

	const setOpen = useDarkRoom(r => r.setOpen);

	const [darkmode, setDarkmode] = useState(darkmodeFromMeta || false);

	const {mutateAsync, setOnSuccess} = useRPUploadMutation()

	const removeUpload = useCallback(() => {
		editor.update(() => {
			const node = $getNodeByKey(nodeKey)
			if (node) {
				node.remove()
			}
		})
	}, [editor, nodeKey])
	const doUpload = useCallback(async ({form, formID}: {
		form: ImageMetadata & ImageForm
		formID: string;
	}) => {
		const res = await mutateAsync({payload: form, formID});
		editor.update(() => {
			const imageNode = $getNodeByKey(nodeKey)
			if ($isRPImageNode(imageNode)) {
				const {
					blurDataUrl, src,
					caption, alt, height, width, sizes, darkmode,
				} = res.processed
				const newData = {
					...imageNode.getData(),

					alt, darkmode, sizes, height, blurDataUrl, caption, width, src,
				} as RP_ImageData
				imageNode.setData(newData)
			}
		})
		return setTimeout(() => setOpen(false), 150)

	}, [editor, mutateAsync, nodeKey, setOpen])

	return

}