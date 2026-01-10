"use client"
import {RenderedImage} from "@/blocks/ImageBlock/Comp/client/component/RenderedImage";
import type {RP_InternalImageNodeData} from "@/blocks/ImageBlock/Comp/server/node/RP_ImageNode";
import {Skeleton} from "@/components/ui/skeleton";
import {Spinner} from "@/components/ui/spinner";
import {EASING, springGSAP} from "@/constants/animations";
import {cn} from "@/lib/utils";
import {
	getUnsplashCollection,
	getUnsplashCollectionsList
} from "@/payload/collections/Media/hooks/getFallbackFromUnsplash";
import {MenuPopup, MenuPositioner} from "@/payload/components/Popover";
import {errorToast} from "@/payload/components/sonner";
import {Link} from "@/payload/elements/Link";
import {Tab, TabIndicator, TabPanel, TabsList, TabsRoot} from "@/payload/elements/Tabs";
import {
	FrameContextMenu,
	FrameMenuItem,
} from "@/payload/fields/Article/Cover/Components/CoverMenu";
import {RemoveImageButton} from "@/payload/fields/Article/Cover/Components/ImageMenu";
import {processImageForNode} from "@/payload/fields/Article/Cover/ImageNode/hooks/image-processors";
import {useQueryForImageNode} from "@/payload/fields/Article/Cover/ImageNode/hooks/useRPImageQuery";
import {UploadedImageBlock} from "@/payload/fields/Article/Cover/rp-image/server/node/RP_ImageNode";
import {useOpenState} from "@/payload/providers/Admins";
import {useCursor} from "@/providers/RP_Pro";
import {useTheme} from "@/providers/Theme";
import {
	FetchedImageDoc,
	ImageCollectionSlug,
	ProcessedImageDoc,
	RalueWithRelation,
	RenderImageFields,
	TabNames
} from "@/types/collections/image-collections";
import {ImageMetadata} from "@/types/ImageCollections/schema";
import type {SavedMetadataUnsplash, UnsplashCollectionDoc} from "@/types/ImageCollections/unsplash";
import {getClientSideURL} from "@/utilities/getURL";
import {clamp} from "@/utilities/mathUtilities";
import {delay} from "@/utilities/rp_utils";
import {ContextMenu, Dialog, Menu, Popover} from "@base-ui/react";
import type {Image, User} from "@payload-types";
import {$isBlockNode, useBlockComponentContext} from "@payloadcms/richtext-lexical/client";
import {
	$getNodeByKey,
	$getSelection,
	$isNodeSelection,
	ElementFormatType,
	LexicalEditor,
	NodeKey
} from "@payloadcms/richtext-lexical/lexical";
import {
	useLexicalComposerContext
} from "@payloadcms/richtext-lexical/lexical/react/LexicalComposerContext";
import {useLexicalEditable} from "@payloadcms/richtext-lexical/lexical/react/useLexicalEditable";
import {
	useLexicalNodeSelection
} from "@payloadcms/richtext-lexical/lexical/react/useLexicalNodeSelection";
import type {FieldAction} from "@payloadcms/ui";
import {useAuth, useForm, useFormFields} from "@payloadcms/ui";
import type {DefaultError, UseMutateFunction,} from "@tanstack/react-query";
import {useMutation, useQuery, useQueryClient} from "@tanstack/react-query";
import Lenis from "lenis";
import {useLenis} from "lenis/react";
import {AlignCenter, AlignLeft, AlignRight, Ellipsis, GalleryThumbnails} from "lucide-react";
import type {HTMLMotionProps, MotionValue,} from "motion/react";
import {AnimatePresence, useMotionValue, useSpring} from "motion/react";
import * as m from "motion/react-m"
import NextImage from "next/image";
import type {FieldState, FormState} from "payload";
import {stringify} from "qs-esm";
import {
	ChangeEventHandler,
	ComponentProps,
	ComponentType,
	createContext,
	Dispatch,
	MouseEventHandler,
	ReactNode,
	useCallback,
	useContext,
	useEffect,
	useId,
	useMemo,
	useRef,
	useState
} from "react";
import {mergeRefs} from "react-merge-refs";
import type {RequiredKeys} from "ts-essentials";
import {uuidv7} from "uuidv7";
import {StoreApi, useStore} from "zustand";
import {createStore} from "zustand/vanilla";
import {ImageResizer} from "./ImageResizer";
import "./imageBlock.scss"

export type ElementProps = {
	className?: string
	data: UploadedImageBlock
	format?: ElementFormatType
	nodeKey: string
}
type FrameState = {
	span: number
	uuid: string
	format: ElementFormatType
	pending: boolean
	setSpan: (param: null | { width: number; naturalWidth?: number }) => void
	setPending: (pending: boolean) => void
	setIsResizing: (r: boolean) => void
	updateFormat: (format: ElementFormatType) => void
	isResizing: boolean
	nodeKey: NodeKey
	setImage: (props: RalueWithRelation | null) => void
	activeRelationTo: ImageCollectionSlug
	image: RalueWithRelation | null
}
const RPImageNodeCtx = createContext<FrameState | null>(null)
export const useRPImageNode = <T, >(selector: (store: FrameState) => T) => {
	const ctx = useContext(RPImageNodeCtx);
	if (!ctx) {
		throw new Error("useRPImageFramer must be used within a RPImageNodeCtx.Provider")
	}
	return selector(ctx);
}

const RP_CTXER = ({children}: { children: ReactNode }) => {
	const [editor] = useLexicalComposerContext()
	const {nodeKey, errorCount,} = useBlockComponentContext()
	const uuid = useId();
	const {setModified} = useForm()
	const [activeRelationTo, setActiveRelationTo] = useState<ImageCollectionSlug>("assets")
	const activeRelRef = useRef(activeRelationTo)
	useEffect(() => {
		activeRelRef.current = activeRelationTo
	}, [activeRelationTo])
	const [image, setImage] = useFormFields(([fields, dispatch]: ImageFieldsContext) => [fields?.media?.value && ({
		relationTo: fields.media.value.relationTo,
		value: typeof fields.media.value.value === "string" ? fields.media.value.value : fields.media.value.value.id
	}) || null, (props: null | RalueWithRelation) =>
		(dispatch({
			type: "UPDATE",
			path: "media",
			value: props
		}), setModified(true))
	] as [RalueWithRelation | null, (props: null | RalueWithRelation) => void])

	const [pending, _setPending] = useState(false)
	const [format, _setFormat] = useState<ElementFormatType>("start");
	const [isResizing, setIsResizing] = useState(false)
	const [span, _setSpan] = useFormFields(([fields, dispatch]: ImageFieldsContext): [number, (n: number | null) => void] => [fields?.span?.value || 700, (spanValue: number | null) => (dispatch({
		type: "UPDATE",
		path: "span",
		value: clamp(144, spanValue || 700, 700)
	}), setModified(true))])
	const lastChangeTime = useRef(0);
	/**
	 *  @function setSpan
	 *  @description Sets the span of the image block.

	 *  @remarks **important**: passed value should be the numeric value equal to the pixel count of the block width.
	 *  Function assumes param to be the pixel-equivalent number value of the image block's width.
	 *
	 *  @note editor width is represented by --contentWidth
	 *
	 */
	const setSpan = useCallback((props: null | { width: number; naturalWidth?: number }) => {
		const now = performance.now();
		//debounce
		if (now - lastChangeTime.current < 50) {
			return;
		}
		if (!props) {
			_setSpan(700);
			lastChangeTime.current = now;
			return;
		}
		const {width, naturalWidth} = props;
		const maxWidth = clamp(700, naturalWidth || 700, 1440);
		const toBe = clamp(144, width, maxWidth);
		_setSpan(toBe);
		lastChangeTime.current = now;
	}, [_setSpan])
	const lastMediaState = useRef(image)
	const lastPendingState = useRef(pending)
	const setPending = useCallback((pending: boolean) => {
		if (pending !== lastPendingState.current) {
			_setPending(pending);
		}
	}, [])
	useEffect(() => {
		if (!image) {
			const a = !!lastMediaState.current !== !!image
			a && _setPending(false)
		}
		lastMediaState.current = image;
	}, [image])
	useEffect(() => {
		lastPendingState.current = pending;
	}, [pending])
	const updateFormat = useCallback((newAlign: ElementFormatType) => {
		editor.update(() => {
			const node = $getNodeByKey(nodeKey);
			if (node && $isBlockNode(node)) {
				node.setFormat(newAlign);
			}
		});
	}, [editor, nodeKey]);

	return <RPImageNodeCtx value={{
		uuid,
		span, format, pending, setSpan, setPending, setImage, activeRelationTo, image,
		setIsResizing, nodeKey, isResizing, updateFormat
	}}>{children}</RPImageNodeCtx>
}
const RP_CTXSUMER = () => {
	const image = useRPImageNode(r => r.image)
	const [editor] = useLexicalComposerContext();
	const nodeKey = useRPImageNode(r => r.nodeKey)
	const hasImage = useRef(false);
	const hasRun = useRef(false);

	useEffect(() => {
		const boolinage = !!image;
		if (!hasRun.current || hasImage.current !== boolinage) {
			editor.update(() => {
				const node = $getNodeByKey(nodeKey);
				if (node && $isBlockNode(node)) {
					const el = node.getTopLevelElement()
					if (el) {

					}
					console.log("tle:", el)
				}
			})
			hasRun.current = true;
		}
		hasImage.current = boolinage;
	}, [editor, image, nodeKey])
	return !image ? <RP_ImageSlot/> :
		<RP_ImageNodeR/>
}
export const RP_ImageBlock = () => {
	return <RP_CTXER>
		<RP_CTXSUMER/>
	</RP_CTXER>

}
const ReplaceImageHandle = Menu.createHandle()
type FieldSansValues = Omit<FieldState, "initialValue" | "value">
type HMage = Omit<Image, "blockType" | "id" | "blockName">
type ImageFormState = FormState & {
	[x in RequiredKeys<HMage>]: FieldSansValues & {
	initialValue: HMage[x];
	value: HMage[x]
}
} & {
	[y in keyof Omit<HMage, RequiredKeys<HMage>>]?: FieldSansValues & {
	initialValue?: HMage[y];
	value?: HMage[y]
}
}
type ImageFieldsContext = [ImageFormState, Dispatch<FieldAction>]
const RP_ImageNodeR = () => {
	const {value, relationTo} = useRPImageNode(r => r.image as RalueWithRelation)
	const uuid = useRPImageNode(r => r.uuid)
	const {data, isFetching, isError, isSuccess} = useQueryForImageNode({
		value, relationTo, uuid
	})

	return isError ? <></> : isFetching ? <Skeleton className={"rounded-2xl w-full"}/> : data &&
        <FrameImage data={data}/>

}
//just some smol util fns for using inside FrameImage
type BS = {
	menuOpen: boolean;
	setMenuOpen: (open: boolean) => void;
	focusedTab: TabNames | null;
	setFocusedTab: (tab: TabNames | null) => void;
	setUploadImage: (t: NBS["uploadImage"]) => void;
	spanMotion: MotionValue<number>
}
type ImageMeta = {
	alt: string;
	caption?: string | null;
	author?: string | null;
	darkmode?: boolean;
}
type UploadProps = {
	file: File;
	relationTo: Exclude<ImageCollectionSlug, "assets">;
	metaData: ImageMeta
}
type NBS = {
	uploadImage: UseMutateFunction<FetchedImageDoc, DefaultError, UploadProps>
}
type FRM_STT = BS & NBS
const frc = ({motionValue}: {
	motionValue: MotionValue<number>
}) => createStore<FRM_STT>()((set, get) => ({
	setUploadImage: (uploadImage) => set({uploadImage}),
	uploadImage: null!,
	menuOpen: false,
	spanMotion: motionValue,

	setMenuOpen: (open: boolean) => set({menuOpen: open}),
	focusedTab: null,
	setFocusedTab: (tab: TabNames | null) => set({focusedTab: tab}),
}))
type FRPI = StoreApi<FRM_STT>
const FR_CTX = createContext<FRPI | null>(null)
type  FFEMProp = {
	image: RP_InternalImageNodeData & { src: string }
}
const FrameImage = ({data}: {

	data: FFEMProp
}) => {
	const cc = useRef<FRPI>(null!)
	const spanMotion = useMotionValue(600);
	if (!cc.current) {
		cc.current = frc({motionValue: spanMotion});
	}
	return <FR_CTX.Provider value={cc.current}>
		<FrameImageContextWrap data={data}/>
	</FR_CTX.Provider>
}
const useReframe = ({nodeKey, uuid, onSuccess}: {
	nodeKey: string;
	uuid: string;
	onSuccess?: (data: {
		image: RP_InternalImageNodeData & { src: string };
		doc: ProcessedImageDoc
	}) => void | Promise<void>;
}) => {
	const [editor] = useLexicalComposerContext();
	const span = useRPImageNode(r => r.span);
	const spanRef = useRef(span);
	const replacer = useCallback(({
		                              data: {
			                              relationTo,
			                              value
		                              }
	                              }: {
		data: {
			image: RP_InternalImageNodeData & { src: string };
			doc: ProcessedImageDoc
		} & RalueWithRelation
	}) => {

		editor.update(() => {
			const node = $getNodeByKey(nodeKey);
			if (node && $isBlockNode(node)) {
				const curFields = node.getFields();
				node.setFields({
					...curFields,
					media: {
						relationTo,
						value
					},
				});

			}
		})
	}, [editor, nodeKey])
	const serverURL = getClientSideURL()
	const {user} = useAuth();
	if (!user) throw new Error("useReframe? Get outta here!")
	const setImage = useRPImageNode(r => r.setImage);
	const doUpload = useCallback(
		async ({file, metaData, relationTo}: UploadProps) => {
			const formD = new FormData();
			const formFields: Omit<ImageMetadata, "id"> = {
				...metaData,
				caption: metaData.caption || undefined,
				darkmode: metaData.darkmode || false,
				author: (user as User & { collection: "users" }).id
			}
			formD.append("file", file);
			formD.append(
				"_payload",
				JSON.stringify({...formFields})
			);
			try {
				const response = await fetch(`${serverURL}/api/${relationTo}`, {
					method: "POST",
					body: formD,
					credentials: "include"
				});
				if (response.ok) {
					const json = await response.json() as { doc: FetchedImageDoc }
					/*
					 onUploadSuccess([json.doc], fallback);*/
					const {doc} = json;
					return processImageForNode({
						doc,
						relationTo: relationTo,
						value: doc.id
					})
						;
				}
				throw new Error("Failed to upload image");
			} catch (e) {
				console.log(e);
				if (e instanceof Error) {
					throw e
				}
				throw new Error("Failed to upload image");
			}
		},
		[serverURL, user]
	);
	const qc = useQueryClient();
	return useMutation({
		mutationFn: doUpload,
		onSuccess: (data) => {
			qc.invalidateQueries({queryKey: ["rp-image", {uuid}]});
			setImage({
				relationTo: "media",
				value: data.doc.id
			});
			qc.setQueryData(["rp-image", {uuid}], data);
			replacer({
				data
			})
			!!onSuccess && onSuccess(data)

		}
	})
}
export const useFRPI = <T, >(selector: (state: FRM_STT) => T) => {
	const cc = useContext(FR_CTX)
	if (!cc) {
		throw new Error("useFRPI must be used inside FrameImage")
	}
	return useStore(cc, selector)
}
const TabWrap = ({value, children, ref, ...props}: ComponentProps<typeof TabPanel>) => {
	const theme = useTheme(r => r.theme);
	const lenis = useLenis();
	const contentRef = useRef<HTMLDivElement>(null!);
	const wrapperRef = useRef<HTMLDivElement>(null!);
	const isRun = useRef(false);

	useEffect(() => {
		let lnis: Lenis | null = null;

		const wrapper = wrapperRef.current;
		const cleanUps: (() => void)[] = []
		if (!!lenis && !isRun.current) {
			if ((!!wrapper)) {

				lnis = new Lenis({
					wrapper,

					autoRaf: true
				});

				isRun.current = true;
				cleanUps.push(
					() => {

					}
				)
			}
		}
		return () => {
			while (cleanUps.length) cleanUps.pop()!()

			isRun.current = false;
			lnis && lnis.destroy();
			lnis = null;
		};
	}, [lenis]);
	return <TabPanel className={
		"relative flex min-h-32 shrink-0 grow-0 items-center justify-center -outline-offset-1 data-hidden:hidden"
	} value={value} {...props} ref={mergeRefs([wrapperRef, ref])}>

		{children}
	</TabPanel>

}
const FrameImageContextWrap = ({data}: {
	data: {
		image: RP_InternalImageNodeData & { src: string }
	};
}) => {
	const format = useRPImageNode(r => r.format)
	const nodeKey = useRPImageNode(r => r.nodeKey)
	const [editor] = useLexicalComposerContext()
	const span = useFRPI(r => r.spanMotion)
	const spanValue = useRPImageNode(r => r.span);
	useEffect(() => {
		span.set(spanValue)
	}, [spanValue, span])

	const width = useSpring(span, {
		...springGSAP.power2.out,
	})
	const setIsResizing = useRPImageNode(r => r.setIsResizing)
	const isResizing = useRPImageNode(r => r.isResizing)
	const open = useFRPI(r => r.menuOpen)
	const setMenuOpen = useFRPI(r => r.setMenuOpen)
	const onOpenChange = useCallback((r: boolean) => {
		setMenuOpen(r)
	}, [setMenuOpen])
	const theme = useTheme(r => r.theme);
	const isEditable = useLexicalEditable()
	const [isSelected, setSelected, clearSelection] =
		useLexicalNodeSelection(nodeKey);
	const activeEditorRef = useRef<LexicalEditor | null>(null);
	const [darkmode, _setDarkmode] = useState(data?.image?.darkmode || false);
	const imageRef = useRef<HTMLImageElement>(null!);
	const [hovered, setHovered] = useState(false)
	const onEnter = useCallback(() => {
		setHovered(true);
	}, [])
	const onLeave = useCallback(() => {
		setHovered(false)
	}, [])
	const tabContents = useMemo((): {
		[x in TabNames]: (props: Omit<ComponentProps<typeof TabPanel>, "value">) => ReactNode
	} => ({
		gallery: ({...props}) => <TabWrap value={"gallery"} {...props}></TabWrap>,

		upload: ({...props}) => <TabWrap value={"upload"} {...props}><UploadImageButton/></TabWrap>,
		url: ({...props}) => <TabWrap value={"url"} {...props}></TabWrap>,
		unsplash: ({...props}) => <TabWrap value={"unsplash"} {...props}
		><FrameGallery/></TabWrap>
		,
		personal: ({...props}) => <TabWrap value={"personal"} {...props}/>
	}), [])
	const setCursorTheme = useCursor(r => r.setCursorTheme);
	const resetCursorTheme = useCursor(r => r.resetCursorTheme);
	useEffect(() => {
		if (hovered) {
			darkmode && setCursorTheme("dark")
		} else {
			resetCursorTheme()
		}
	}, [darkmode, hovered, resetCursorTheme, setCursorTheme])
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
	const isInNodeSelection = useMemo(
		() =>
			isSelected &&
			editor.getEditorState().read(() => {
				const selection = $getSelection();
				return $isNodeSelection(selection) && selection.has(nodeKey);
			}),
		[editor, isSelected, nodeKey],
	);
	const setSpan = useRPImageNode(r => r.setSpan)
	const onResizeEnd = useCallback((
		event: PointerEvent) => {
		// Delay hiding the resize bars for click case
		setTimeout(() => {
			setIsResizing(false);
		}, 200);
		const naturalWidth = imageRef.current.naturalWidth || 600;
		const wdth = width.get();
		setSpan({
			width: wdth,
			naturalWidth
		})

	}, [setIsResizing, setSpan, width])
	const focusedTab = useFRPI(r => r.focusedTab)
	const setFocusedTab = useFRPI(r => r.setFocusedTab)
	const lastFocus = useRef(focusedTab)
	useEffect(() => {
		lastFocus.current = focusedTab;
	}, [focusedTab])
	const lastOpen = useRef(open)
	useEffect(() => {
		lastOpen.current = open
	}, [open,])
	const onOpenTabChange = useCallback((r: TabNames | null) => {
		if (lastOpen.current) {
			setFocusedTab(r || lastFocus.current || "upload")
		}
	}, [setFocusedTab])
	const onClickRemove: MouseEventHandler = useCallback((e) => {
		e.stopPropagation()
		e.preventDefault()
		editor.update(() => {
			const node = $getNodeByKey(nodeKey);
			if (!node) return;
			if ($isBlockNode(node)) {
				node.remove()
			}
		})
	}, [editor, nodeKey])
	const contextMenuOpenset = useOpenState(r => r.setContextMenuOpen)
	const draggable = isInNodeSelection && !isResizing;
	const isFocused = (isSelected || isResizing) && isEditable;

	return <m.div
		className={cn("max-w-screen p-3.5 rounded-2xl transition-[width] duration-150", darkmode && "dark",
			format === "left" || format === "start" ? "self-start" : format === "right" || format === "end" ?
				"self-end" : "self-center"
		)}
		style={{width}}
		data-align={format}
		onMouseEnter={onEnter}
		data-inserted={true}
		data-theme={darkmode ? "dark" : theme}
		onMouseLeave={onLeave}>
		<ContextMenu.Root handle={ContextMenuHandle}
		                  onOpenChange={(open) => contextMenuOpenset(open)}>
			<div>
				<ContextMenu.Trigger className={"w-full h-full"}>
					<div className={"contents"}>
						<div>
							<div role="figure">
								<div className={cn("flex", !isResizing && "w-fit")}>
									<div className="relative overflow-hidden grow group"
									     contentEditable={false}>
										<RenderedImage darkmode={darkmode} image={{...data.image,}}
										               ref={imageRef} span={span}
										               hover={hovered}/> {isEditable && <>
                                        <FrameToolbar isFocused={isFocused} hover={hovered}/>
                                        <ImageResizer editor={editor} isFocused={isFocused}
                                                      imageRef={imageRef} hovered={hovered}
                                                      motionWidth={span}
                                                      onResizeEnd={onResizeEnd}/></>}
									</div>
								</div>
							</div>
						</div>
					</div>
				</ContextMenu.Trigger>
			</div>
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
					<FrameMenuItem><Menu.Trigger
						data-themed={"border-color, color, background-color"}
						handle={ReplaceImageHandle}
						className={cn(
							"border-r-solid-[.5px]! flex appearance-none items-center justify-center border-none bg-transparent p-0 text-sm! font-normal text-inherit! shadow-none transition-colors duration-200 ease-out-power3 outline-none select-none",
							"flex overflow-hidden leading-[1.2]")
						}
					>
        <span className={"text-sm leading-normal"}>
			Change Image
        </span>
					</Menu.Trigger></FrameMenuItem>
				</FrameContextMenu>
			</ContextMenu.Portal>
		</ContextMenu.Root>
		<m.div
			initial={{
				opacity: 0
			}}
			animate={{
				opacity: 1
			}}
			transition={{
				type: "tween",
				ease: EASING.power3.out,
				duration: 0.2
			}}
			style={{
				height: "100%",
				justifyContent: "flex-start",
				display: "flex",
				alignItems: "flex-end"
			}}
		><Menu.Root handle={ReplaceImageHandle} open={open} onOpenChange={onOpenChange}>

			<Menu.Portal>
				<MenuPositioner
					align={"end"}
				>
					<MenuPopup className="relative max-w-[calc(100vw-24%)] p-0">
						<TabsRoot value={focusedTab}
						          onValueChange={onOpenTabChange}>

							<TabsList

								slots={<RemoveImageButton
									onClick={onClickRemove}/>

								}
							>
								{
									Object.keys(tabContents).map((name, i) => <Tab value={name}
									                                               key={i}>
										{name === "personal" ? "Personal photos" : name === "gallery" ? "Curations" : name === "upload" ? "Upload" : name === "url" ? "Embed Image" : name === "unsplash" ? "Unsplash" : name}
									</Tab>)
								}
								{/*<Tab*/}
								{/*	value="personal"*/}
								{/*>*/}
								{/*	Gallery*/}
								{/*</Tab>*/}
								{/*<Tab value={"gallery"}>*/}
								{/*	Curations*/}
								{/*</Tab>*/}
								{/*<Tab*/}
								{/*	value="upload"*/}
								{/*>*/}
								{/*	Upload*/}
								{/*</Tab>*/}
								{/*<Tab*/}
								{/*	value="url"*/}
								{/*>*/}
								{/*	Embed Image*/}
								{/*</Tab>*/}
								{/*<Tab*/}
								{/*	value="unsplash"*/}
								{/*>*/}
								{/*	Unsplash*/}
								{/*</Tab>*/}
								<TabIndicator/>
							</TabsList>
							{
								Object.values(tabContents).map((TabContent, i) => <TabContent
									key={i}/>)
							}
						</TabsRoot>
					</MenuPopup>
				</MenuPositioner>
			</Menu.Portal>
		</Menu.Root></m.div>
		<Dialog.Root>
			<Dialog.Portal>
				<Dialog.Popup>

				</Dialog.Popup>
			</Dialog.Portal>
		</Dialog.Root>
	</m.div>
}
const UploadImageButton = ({className, ...rest}: HTMLMotionProps<"span">) => {
	const inputRef = useRef<HTMLInputElement>(null!)
	const nodeKey = useRPImageNode(r => r.nodeKey)
	const uuid = useRPImageNode(r => r.uuid)
	const {mutate, isPending, isPaused, isError} = useReframe({
		uuid, nodeKey, onSuccess: async (data) => {
			await delay(100).then(closeMenu);
		}
	})
	const setMenuOpen = useFRPI(r => r.setMenuOpen)
	const closeMenu = useCallback(() => setMenuOpen(false), [setMenuOpen])
	const uploadImage = useCallback(() => {
		const file = inputRef.current.files?.[0];
		if (!!file) {
			mutate({
				file,
				relationTo: "userMedia",
				metaData: {
					alt: `Photo by `
				}
			});
		}
	}, [mutate])
	const onChange: ChangeEventHandler<HTMLInputElement> = useCallback((e) => {
		const fileList = e.target.files;
		if (fileList && fileList.length > 0) {
			const file = fileList[0];
			if (!file) return;
			if (file.type.startsWith("image/")) {
				if (file.size > Number(process.env.NEXT_PUBLIC_IMAGE_MAX_FILE_SIZE)) {
					errorToast("Image is too large, select a file with 1mb or less");
					return;
				}
				const dataTransfer = new DataTransfer();
				dataTransfer.items.add(file);
				inputRef.current.files = dataTransfer.files;
				uploadImage();
			}
		}
	}, [uploadImage])
	return <m.span
		className={cn(
			"relative flex h-14 w-3/4 items-center justify-center rounded-[35px] border border-solid border-muted-faded-foreground/80 p-5 px-3.5 py-1 text-center! leading-normal text-faded-foreground/90 transition-[z-index,opacity,border-color,background-color,color] duration-200 ease-out-power2 hover:border-muted-faded-foreground/30 hover:bg-faded-foreground hover:text-faded-background", className
		)}
		data-themed={"opacity,border-color,background-color,color"}
		role="button"
		{...rest}
	>
		<input
			id={"user_settings_photo_file"}
			name={"user_settings[photo][file]"}
			className={cn(
				"absolute! inset-0 z-10 h-full w-full cursor-none! overflow-hidden opacity-0"
			)}
			ref={inputRef}
			onChange={onChange}
			accept="image/*"
			type={"file"}
		/>
		<label
			className={
				"flex w-fit cursor-none! items-center font-sans!"
			}
			htmlFor="user_settings_photo_file"
		>
			Upload File
			<svg
				className="relative inline-block w-auto cursor-none! border-none! bg-transparent! transition-colors duration-200 ease-out-power2! outline-none!"
				viewBox="0 0 20 20"
				fill="none"
				height="18"
			>
				<path
					xmlns="http://www.w3.org/2000/svg"
					d="M16.3,8.2C15.9,5.3,13.2,3,10,3C7.4,3,5.2,4.5,4.2,6.6C1.8,7.2,0,9.2,0,11.7c0,3,2.5,5.3,5.5,5.3 c0.6,0,1-0.4,1-1c0-0.6-0.4-1-1-1c-2,0-3.5-1.5-3.5-3.3c0-1.6,1.3-3,3-3.2c0.4,0,0.7-0.3,0.8-0.6C6.4,6.2,8,5,10,5 c2.5,0,4.4,1.9,4.4,4.1c0,0.6,0.4,1,1,1c1.5,0,2.6,1.1,2.6,2.4c0,1.3-1.1,2.4-2.6,2.4c-0.6,0-1,0.4-1,1c0,0.6,0.4,1,1,1 c2.5,0,4.6-1.9,4.6-4.4C20,10.4,18.4,8.7,16.3,8.2z"
					fill={"currentColor"}
				/>
			</svg>
		</label>
	</m.span>
}
const URLEmbedInput = ({}: {}) => {
	const urlRegex = useMemo(() => /^(http(s?):\/\/)?(www\.)?(([-a-zA-Z0-9@:%_]{2,256})\.)*([-a-zA-Z0-9@:%_]{2,256})\.([a-z]){2,16}((\/([-a-zA-Z0-9@:%_]+))*)(\?([-a-zA-Z0-9@:%_]+)((=([-a-zA-Z0-9@:%_]*))?)(&([-a-zA-Z0-9@:%_]+)((=([-a-zA-Z0-9@:%_]*))?))*)?((#([-a-zA-Z0-9@:%_]+))?)$/, [])
	const siteUrl = useMemo(() => getClientSideURL(), []);
	const inputRef = useRef<HTMLInputElement>(null!)
	const [isWorking, setIsWorking] = useState(false)
	const uuid = useRPImageNode(r => r.uuid)
	const nodeKey = useRPImageNode(r => r.nodeKey)
	const {mutate, isPending,} = useReframe({uuid, nodeKey})
	const onExternalUrlInput = useCallback(async () => {
		setIsWorking(true);
		try {
			const v = inputRef.current.value;
			const url = new URL(v);
			if (!urlRegex.test(v) || !url.hostname || url.hostname.match(/^localhost$|^\d+\.\d+\.\d+\.\d+$/) || /\s/.test(url.pathname)) {
				inputRef.current.setCustomValidity("Invalid URL")
				throw new Error("Invalid URL");
			}
			// Hard rule: only http or https
			if (url.protocol !== "http" && url.protocol !== "https") {
				inputRef.current.setCustomValidity("Invalid URL")
				throw new Error("Invalid URL; only http and https are allowed");
			}
			const uid = uuidv7();
			const r = await fetch(`${siteUrl}/api/image-courier${stringify({url: v}, {
				addQueryPrefix: true,
			})}`, {method: "GET", credentials: "include"})

			if (r.ok) {

				const blob = await r.blob();
				setIsWorking(false);
				const file = new File([blob], `external-${uid}.jpg`, {type: blob.type || "image/jpeg"});
				mutate({
					file, relationTo: "userMedia", metaData: {
						alt: "An image",

					}
				})
			}
		} catch (e) {
			console.error("Error uploading image:", e);
			if (e instanceof Error) {
				errorToast(e.message)
			} else {
				errorToast("No image found- check if everything's been correctly formatted.")
			}
			setIsWorking(false);
		}
	}, [mutate, siteUrl, urlRegex])

	return <div className={"grow min-h-0 overflow-x-hidden overflow-y-auto"}>
		<div className={"gap-px relative p-[4px] flex flex-col mt-3"}>
			<div
				className={"flex items-center select-none gap-3 leading-[1.2] w-full min-h-11 text-sm px-3.5 py-[4px]"}
			>
				<div className={"mx-0 min-w-0 flex-[1_1_auto]"}>
					<div className="flex">
						<div
							className="flex items-center w-full text-sm leading-[20px] relative rounded-[6px] px-4 h-11 py-1">
							<input placeholder="Paste the image link…" type="url"
							       ref={inputRef}
							       className={"bg-none border-none w-full block resize-none p-0"}
							       style={{
								       unicodeBidi: "plaintext", outline: "none",
							       }}
							/>
						</div>
					</div>
				</div>
			</div>
		</div>
		<div
			className={"gap-px relative p-[4px] flex flex-col"}>
			<div
				className={"flex items-center select-none gap-3 leading-[1.2] w-full min-h-11 text-sm px-3.5 py-[4px]"}>
				<div className={"mx-0 min-w-0 flex-[1_1_auto]"}>
					<div className={"whitespace-nowrap overflow-hidden text-ellipsis"}>
						<div role="button" tabIndex={0} onClick={onExternalUrlInput}
						     className={cn("select-none flex items-center justify-center transition-opacity ease duration-75 w-full max-w-[300px] h-11 px-3 rounded-[6px] whitespace-nowrap m-auto", isWorking && "pointer-events-none opacity-80")}>Embed
							image
						</div>
					</div>
				</div>
			</div>
		</div>
	</div>
}
const FrameGallery = () => {
	const {data: collections, isEnabled, isError, isFetching} = useQuery({
		queryKey: ["unsplashCollections"],
		queryFn: async () => {
			const res = await getUnsplashCollectionsList();
			if (!res) {
				throw new Error("Failed to fetch collections")
			}
			return res;
		},
	})
	return <m.div
		className={"flex flex-col items-start relative justify-center w-full h-full p-2.5 pb-3"}>
		<AnimatePresence mode="popLayout" initial={true}>{isFetching ? (
			<m.div className="absolute inset-0 flex flex-col justify-center items-center" initial={{
				opacity: 0
			}} animate={{opacity: 1}} exit={{
				opacity: 0
			}} transition={{
				type: "tween",
				duration: 0.4,
				ease: EASING.power3.inOut
			}}><Spinner/>
			</m.div>
		) : ((!isEnabled || isError) &&
            <m.div className="absolute inset-0 flex flex-col justify-center items-center" initial={{
				opacity: 0
			}} animate={{opacity: 1}} exit={{
				opacity: 0
			}} transition={{
				type: "tween",
				duration: 0.4,
				ease: EASING.power3.inOut
			}}>
                <div/>
            </m.div> || collections && collections.length > 0 && collections.map((data) => (
				<UnsplashRow key={data.id} collection={data}/>)))}</AnimatePresence></m.div>
};

const UnsplashImage = ({
	                       onClick,
	                       className,
	                       ref,
	                       onSelect,
	                       image,
	                       form,
	                       figureClassName,
	                       ...props
                       }: HTMLMotionProps<"div"> & {
	image: RenderImageFields;
	form: SavedMetadataUnsplash;
	figureClassName?: string;
}) => {
	const [hovered, setHovered] = useState(false)
	const uuid = useRPImageNode(r => r.uuid)

	const {alt, caption, darkmode, src} = image;
	const formRef = useRef({
		alt,
		caption,
		darkmode,

	});
	const link = useMemo(() => form.url, [form])
	const nodeKey = useRPImageNode(r => r.nodeKey)
	const {mutate, isPending, isPaused, isError} = useReframe({
		uuid, nodeKey, onSuccess: async (data) => {
			await delay(100).then(closeMenu);
		}
	})
	const setMenuOpen = useFRPI(r => r.setMenuOpen)
	const closeMenu = useCallback(() => setMenuOpen(false), [setMenuOpen])
	const uploadImage = useCallback(async () => {
			try {
				const re = await fetch(link);
				if (re.ok) {
					const blob = await re.blob();
					const file = new File([blob], `unsplash-${uuidv7()}.${blob.type?.split("/")[1]}`,
						{
							type: blob.type || "image/jpeg"
						}
					);
					mutate({
						file,
						relationTo: "media",
						metaData: {
							...formRef.current
						}
					});

				}
			} catch (e) {
				errorToast("Error uploading image :(");
			}

		}
		,
		[link, mutate]
	)
	const onClickCallback: MouseEventHandler<HTMLDivElement> = useCallback((e) => {
		e.preventDefault();
		e.stopPropagation();
		if (e.currentTarget.ariaDisabled === "true") return;
		uploadImage();
	}, [uploadImage])
	const setCursorTheme = useCursor(r => r.setCursorTheme);
	const resetCursorTheme = useCursor(r => r.resetCursorTheme);
	useEffect(() => {
		if (hovered) {
			darkmode && setCursorTheme("dark")
		} else {
			resetCursorTheme()
		}
	}, [darkmode, hovered, resetCursorTheme, setCursorTheme])
	const onEnter = useCallback(() => setHovered(true), [])
	const onLeave = useCallback(() => setHovered(false), [])
	const [clickable, setClickable] = useState(!isPending && !isPaused)
	useEffect(() => {
		setClickable(!isPending && !isPaused)
	}, [isPending, isPaused])
	return <m.div initial={{

		opacity: 0
	}}
	              animate={{

		              opacity: 1,
		              transition: {
			              duration: 0.3,
			              ease: EASING.power3.in
		              }
	              }}
	              exit={{

		              opacity: 0,
		              transition: {
			              duration: 0.2,
			              ease: EASING.power3.out
		              }
	              }}
	              onMouseEnter={onEnter}
	              onMouseLeave={onLeave}
	              className={cn("w-[25%] p-1.5 relative transition-opacity", className, !clickable ? "pointer-events-none opacity-80 animate-pulse" : "pointer-events-auto opacity-100", {dark: darkmode})}
	              aria-disabled={!clickable}
	              role={clickable ? "button" : "none"}
	              onClick={onClickCallback}
	              {...(darkmode && {"data-dark": true} || {})}
	              {...props}
	>

		<figure
			className={cn("w-full relative m-0 h-[64px] rounded-[4px] overflow-hidden transition-[opacity,background-color] duration-200 ease-out-power2 hover:opacity-85 hover:bg-muted-faded-background", figureClassName)}>
			<picture>
				<NextImage
					unoptimized={true}
					src={src}
					alt={alt || ""}
					fill={true}
					className={
						"position-[center_60%] block w-full absolute inset-0 object-cover"
					}
				/>
			</picture>

		</figure>

	</m.div>
}
const UnsplashRow = ({
	                     collection
                     }: {
	collection: UnsplashCollectionDoc
}) => {
	const {data: images, isFetching, isError} = useQuery({
		queryKey: ["unsplash", {
			collectionId: collection.id
		}],
		queryFn: async ({queryKey}: { queryKey: [string, { collectionId: number }] }) => {
			const {collectionId} = queryKey[1];
			const res = await getUnsplashCollection(collectionId, {
				perPage: 32,
				page: 1
			})
			if (!res) {
				throw new Error("Failed to fetch images")
			}
			return res;
		}
	})
	return <>
		<div
			className={"flex w-full px-3 mt-2.5 mb-3 text-faded-foreground text-sm leading-[120%] select-none"}>
			<div className={"flex self-center"}>
				<Link href={`${collection.links.html}`}
				      target={"_blank"}>{collection.title}</Link>
			</div>
			<div className={"ml-auto"}><AnimatePresence initial={true} mode="sync">{
				isFetching && <m.div initial={{
					opacity: 0,
				}} exit={{
					opacity: 0
				}} animate={{
					opacity: 1,
					transition: {
						type: "tween",
						duration: 0.2,
						ease: EASING.power3.in
					}
				}}><Spinner/></m.div>
			}</AnimatePresence></div>
		</div>
		<div
			className="flex w-full flex-wrap content-start bg-muted-faded-background/30 px-[12px] py-0">
			{isError ? <>Fucl!</> : images && images.length > 0 && images.map((image, i) =>
				<UnsplashImage
					key={"" + collection.id + i} {...image}/>)}
		</div>
	</ >
}
const ContextMenuHandle = Menu.createHandle();
const FrameAligment = () => {
	const nodeKey = useRPImageNode(r => r.nodeKey)
	const format = useRPImageNode(r => r.format)
	const alignment = useMemo(() => {
		switch (format) {
			case "start":
			case "left":
				return "left";
			case "end":
			case "right":
				return "right";
			default:
				return "center";
		}
	}, [format])
	const [editor] = useLexicalComposerContext();
	const setActive = useCallback((r: ElementFormatType) => {
		editor.update(() => {
			const node = $getNodeByKey(nodeKey)
			if ($isBlockNode(node)) {
				node.setFormat(r);
			}
		})

	}, [editor, nodeKey])
	return <div className="flex flex-row items-center">
		{["left", "center", "right"].map((r, k) => <div
			key={r + k}
			role={"button"}
			onClick={() => setActive(r as ElementFormatType)}
			className={cn("select-none transition-colors duration-20 ease-in inline-flex items-center justify-center gap-0 h-9 px-0 rounded-[4px] whitespace-nowrap text-[14px] font-normal leading-[1.2] w-9 text-off-foreground shrink-0 min-w-0", alignment === r && "bg-faded-foreground/10 text-background")}
		>            {
			r === "left" ? <AlignLeft/> : r === "right" ? <AlignRight/> : <AlignCenter/>
		}
		</div>)}
	</div>
}
const FrameImageReplacerMenu = () => {
	const [editor] = useLexicalComposerContext();

	const open = useFRPI(r => r.menuOpen)
	const nodeKey = useRPImageNode(r => r.nodeKey)
	const openCHange = useFRPI(r => r.setMenuOpen)

	const tabs = useMemo(() => {
		const c: {
			[x in TabNames]: {
				name: string;
				content: ReactNode;
			}
		} = {
			gallery: {
				content: <></>,
				name: "Curations"
			},
			upload: {
				content: <UploadImageButton/>,
				name: "Upload"
			},
			url: {
				content: <URLEmbedInput/>,
				name: "Embed URL"
			},
			unsplash: {
				content: <FrameGallery/>,
				name: "Unsplash"
			},
			personal: {
				content: <></>,
				name: "Your photos"
			}
		};

		const tabNames: {
			[x in TabNames]: string
		} = {
			gallery: "Curations",
			upload: "Upload",
			url: "Embed Image",
			unsplash: "Unsplash",
			personal: "Your photos"
		}
		return Object.entries(c).reduce((acc, [value, {name, content}]) => {
			return {
				names: [...acc.names, [value as TabNames, name]] as Array<[TabNames, string]>,
				contents: [...acc.contents, [value as TabNames, content]] as Array<[TabNames, ReactNode]>
			}
		}, {
			names: [],
			contents: []
		} as {
			names: Array<[TabNames, string]>,
			contents: Array<[TabNames, ReactNode]>
		})
	}, [])
	const focusedTab = useFRPI(r => r.focusedTab)
	const setFocusedTab = useFRPI(r => r.setFocusedTab)
	const lastFocus = useRef(focusedTab)
	useEffect(() => {
		lastFocus.current = focusedTab;
	}, [focusedTab])
	const lastOpen = useRef(open)
	const setDialogOpen = useOpenState(r => r.setDialogOpen)
	const onOpenChange = useCallback((open: boolean) => {
		open && setFocusedTab("upload")
		open && setDialogOpen(true)
		openCHange(open)
	}, [openCHange, setFocusedTab, setDialogOpen])
	useEffect(() => {
		lastOpen.current = open
	}, [open,])
	const onOpenTabChange = useCallback((r: TabNames | null) => {
		if (lastOpen.current) {
			setFocusedTab(r || lastFocus.current || "upload")
		}
	}, [setFocusedTab])
	const onClickRemove: MouseEventHandler = useCallback((e) => {
		e.stopPropagation()
		e.preventDefault()
		editor.update(() => {
			const node = $getNodeByKey(nodeKey);
			if (!node) return;
			if ($isBlockNode(node)) {
				node.remove()
			}
		})
	}, [editor, nodeKey])

	return <m.div
		initial={{
			opacity: 0
		}}
		animate={{
			opacity: 1
		}}
		transition={{
			type: "tween",
			ease: EASING.power3.out,
			duration: 0.2
		}}
		style={{
			height: "100%",
			justifyContent: "flex-start",
			display: "flex",
			alignItems: "flex-end"
		}}
	><Menu.Root handle={ReplaceImageHandle} open={open} onOpenChange={onOpenChange}>

		<Menu.Portal>
			<MenuPositioner
				align={"end"}
			>
				<MenuPopup className="relative max-w-[calc(100vw-24%)] p-0">
					<TabsRoot value={focusedTab}
					          onValueChange={onOpenTabChange}>

						<TabsList

							slots={<RemoveImageButton
								onClick={onClickRemove}/>

							}
						>
							{tabs.names.map(([value, caption], i) => <Tab value={value}
							                                              key={i + value}>{caption}</Tab>)}
							{/*<Tab*/}
							{/*	value="personal"*/}
							{/*>*/}
							{/*	Gallery*/}
							{/*</Tab>*/}
							{/*<Tab value={"gallery"}>*/}
							{/*	Curations*/}
							{/*</Tab>*/}
							{/*<Tab*/}
							{/*	value="upload"*/}
							{/*>*/}
							{/*	Upload*/}
							{/*</Tab>*/}
							{/*<Tab*/}
							{/*	value="url"*/}
							{/*>*/}
							{/*	Embed Image*/}
							{/*</Tab>*/}
							{/*<Tab*/}
							{/*	value="unsplash"*/}
							{/*>*/}
							{/*	Unsplash*/}
							{/*</Tab>*/}
							<TabIndicator/>
						</TabsList>
						{
							tabs.contents.map(([value, content], i) => <TabWrap key={i + value}
							                                                    value={value}>{content}</TabWrap>)
						}
						{/*<TabPanel value="upload">*/}

						{/*</TabPanel>*/}
						{/*<TabPanel value="personal">*/}

						{/*</TabPanel>*/}
						{/*<TabPanel value="gallery">*/}

						{/*</TabPanel>*/}
						{/*<TabPanel*/}
						{/*	className={*/}
						{/*		"relative flex h-32 shrink-0 grow-0 items-center justify-center -outline-offset-1 data-hidden:hidden"*/}
						{/*	}*/}
						{/*	value="unsplash"*/}
						{/*>*/}
						{/*	<FrameGallery/>*/}
						{/*</TabPanel>*/}
					</TabsRoot>
				</MenuPopup>
			</MenuPositioner>
		</Menu.Portal>
	</Menu.Root></m.div>

}
const FrameToolbar = ({
	                      hover, isFocused
                      }: {
	hover: boolean;
	isFocused: boolean

}) => {
	const [submenuOpen, setSubmenuOpen] = useState(false)
	const menuOpen = useFRPI(r => r.menuOpen)
	const format = useRPImageNode(r => r.format)
	const isResizing = useRPImageNode(r => r.isResizing)
	const FrameToolbarSubMenuHandle = Popover.createHandle<ComponentType<{
		nodeKey: string;
		format?: ElementFormatType
	}>>()
	const somethingOpen = useOpenState(r => r.open)
	return <m.div
		className={cn(
			"absolute top-1.5 right-1.5 backdrop-blur-xs duration-200 ease-out-power2 transition-opacity z-10", somethingOpen || isFocused || isResizing ? "opacity-100 pointer-events-auto" : "opacity-0 group-hover:opacity-100 pointer-events-none group-hover:pointer-events-auto"
		)}
		variants={{
			animate: {
				zIndex: [null, 0],
				opacity: [0, 0],
				transition: {
					type: "tween",
					ease: EASING.power2.out,
					duration: 0.3
				}
			},
			hover: {
				zIndex: [55, 55],
				opacity: [0, 1],
				transition: {
					type: "tween",
					ease: EASING.power2.out,
					duration: 0.3
				}
			}
		}}
		transition={{type: "tween", duration: 0.3}}
		exit="animate"
		animate={somethingOpen || isFocused || menuOpen || hover ? "hover" : "animate"}
	>
		<m.div
			className={"p-1 flex w-fit items-center rounded-[6px] bg-faded-background/50 shadow-md"
			}
		>

			<Popover.Trigger
				nativeButton={false}
				render={({className, children, ...props}) => <div
					data-themed={"color, background-color, border-color"}
					aria-label="Set Alignment" className={cn(
					"inline-flex size-10 min-w-0 justify-center items-center shrink-0 overflow-hidden rounded-[4px] bg-faded-foreground/0 p-0 gap-0 leading-[1.2] text-foreground/80 transition-colors duration-200 ease-out-power2 select-none hover:bg-faded-foreground/70 hover:text-background/60 [&_svg]:size-6", className,
					submenuOpen
						? "pointer-events-none"
						: "hover:bg-faded-foreground/70 hover:text-background/60"
				)} role="button" {...props}>{children}</div>}

				handle={FrameToolbarSubMenuHandle}
				payload={FrameAligment}
			>
				{
					format === "left" || format === "start" ?
						<AlignLeft/> : format === "end" || format === "right" ?
							<AlignRight/> : <AlignCenter/>
				}
			</Popover.Trigger>
			<div

				data-themed={"color, background-color, border-color"}
				aria-label="Set Alignment" className={cn(
				"inline-flex size-10 min-w-0 justify-center items-center shrink-0 overflow-hidden rounded-[4px] bg-faded-foreground/0 p-0 gap-0 leading-[1.2] text-foreground/80 transition-colors duration-200 ease-out-power2 select-none hover:bg-faded-foreground/70 hover:text-background/60 [&_svg]:size-6",
				submenuOpen
					? "pointer-events-none"
					: "hover:bg-faded-foreground/70 hover:text-background/60"
			)} role="button"
			>
				<GalleryThumbnails/>
			</div>

			<Menu.Trigger
				handle={ContextMenuHandle}
				nativeButton={false}

				render={({className, children, ...props}) => <div
					className={cn("inline-flex size-10 min-w-0 justify-center items-center shrink-0 overflow-hidden rounded-[4px] bg-faded-foreground/0 p-0 gap-0 leading-[1.2] text-foreground/80 transition-colors duration-200 ease-out-power2 select-none hover:bg-faded-foreground/70 hover:text-background/60", className)}

					role="button"
					aria-label="Open the block menu"
					data-themed={"color, background-color, border-color"} {...props}>{children}</div>}
			>
				<Ellipsis className={"size-6 shrink-0"}/>
			</Menu.Trigger>
		</m.div>

	</m.div>
}
const RP_ImageSlot = () => {

	const cc = useRef<FRPI>(null!)
	const spanMotion = useMotionValue(600);
	if (!cc.current) {
		cc.current = frc({motionValue: spanMotion});
	}
	return <FR_CTX.Provider value={cc.current}>
		<div className="contents" data-inserted={false}><ContextMenu.Root
			handle={ContextMenuHandle}>
			<ContextMenu.Trigger data-themed={"border-color, color, background-color"}
			                     className={"select-none grow flex w-full rounded-2xl bg-transparent"}>
				<Menu.Trigger nativeButton={false}
				              handle={ReplaceImageHandle}
				              render={({children, className, ...props}) =>
					              <div role={"button"}
					                   className={cn("flex select-none w-full rounded-2xl bg-transparent overflow-hidden", className)} {...props}>
						              <m.div style={{
							              backgroundColor: "oklch(36.76% 0.003 58.67)"
						              }} transition={{
							              type: "tween",
							              duration: 0.2,
							              ease: EASING.power2.out
						              }}
						                     animate={
							                     {
								                     backgroundColor: "oklch(36.76% 0.003 58.67/0.2)"
							                     }
						                     }
						                     whileHover={{
							                     backgroundColor: "oklch(36.76% 0.003 58.67/0.34)"

						                     }}
						                     className="w-full h-full"
						                     whileTap={{
							                     backgroundColor: "oklch(47.94% 0.003 58.67/0.54)"
						                     }}>
							              {children}
						              </m.div>
					              </div>}>
					<div
						className={"p-[12px] pr-14 flex items-center text-start w-full"}>
						<div
							className={"text-ellipsis whitespace-nowrap overflow-hidden text-[14px]"}>Add
							an
							Image
						</div>
						<div>
							<svg
								className={"size-[21px] block shrink-0 mr-5 fill-faded-foreground"}>
								<path d={"M8.5 9.31a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3"}/>
								<path
									d={"M2.375 6.25c0-1.174.951-2.125 2.125-2.125h11c1.174 0 2.125.951 2.125 2.125v7.5a2.125 2.125 0 0 1-2.125 2.125h-11a2.125 2.125 0 0 1-2.125-2.125zM4.5 5.375a.875.875 0 0 0-.875.875v5.491l1.996-1.995a.625.625 0 0 1 .883 0l1.98 1.98 4.137-4.137a.625.625 0 0 1 .883 0l2.871 2.87V6.25a.875.875 0 0 0-.875-.875zm11.875 6.852-3.312-3.312-4.137 4.136a.625.625 0 0 1-.884 0l-1.98-1.98-2.437 2.438v.241c0 .483.392.875.875.875h11a.875.875 0 0 0 .875-.875z"}/>
							</svg>
						</div>
					</div>
				</Menu.Trigger>

			</ContextMenu.Trigger>

			<ContextMenu.Portal>
				<ContextMenu.Positioner className="outline-none">
					<ContextMenu.Popup
						className={cn("min-w-[180px] max-w-[265px] py-1.5 origin-[var(--transform-origin)] rounded-md bg-[canvas] outline outline-1 transition-[transform,scale,opacity] data-[ending-style]:scale-90 data-[ending-style]:opacity-0 data-[starting-style]:scale-90 data-[starting-style]:opacity-0",)}>

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

						</FrameMenuItem><Menu.Trigger nativeButton={false}
						                              handle={ReplaceImageHandle}

						                              render={({className, children, ...props}) =>
							                              <div
								                              role="button"
								                              data-themed={"border-color, color, background-color"}
								                              className={cn(
									                              "border-r-solid-[.5px]! flex appearance-none items-center justify-center border-none bg-transparent p-0 text-sm! font-normal text-inherit! shadow-none transition-colors duration-200 ease-out-power3 outline-none select-none", className,
									                              "flex overflow-hidden leading-[1.2]")
								                              } {...props}  >{children}</div>}
					>
        <span className={"text-sm leading-normal"}>
			Change Image
        </span>
					</Menu.Trigger> </ContextMenu.Popup>
				</ContextMenu.Positioner>

			</ContextMenu.Portal>
		</ContextMenu.Root>
			<FrameImageReplacerMenu/>
		</div>
	</FR_CTX.Provider>
}