import {
	ProcessedImageDoc,
	RalueAsDataWithRelation,
	RalueWithRelation,
	RenderImageFields,
	TabNames
} from "@/types/collections/imageCollections";
import {createContext, ReactNode, useCallback, useContext, useMemo, useRef, useState} from "react";
import {useAuth} from "@payloadcms/ui";
import {getClientSideURL} from "@/utilities/getURL";
import {MutationStatus, QueryStatus} from "@tanstack/react-query";
import {ImageCollectionSlug} from "@/types/payload-api-helpers";
import {NodeKey} from "@payloadcms/richtext-lexical/lexical";
import {FetchedUnsplashImage} from "@/payload/collections/Media/hooks/types";
import {createStore} from "zustand/vanilla";
import {useStore} from "zustand";

type InsertCallbackParams = {
	value: string;
	processed: ProcessedImageDoc;
	relationTo: ImageCollectionSlug;
}
type InsertCallback = (params: InsertCallbackParams) => void
type RPQueryStatus = QueryStatus | "disabled";
type ImageFieldState = {
	open: boolean;
	value: RalueWithRelation | null;
	onInsert: InsertCallback;
	image: ProcessedImageDoc | null;
	activeCollection: ImageCollectionSlug;
	replaceNodeKey: NodeKey | null
	formID: string | null;
	openedTab: TabNames | null;
	enabled: boolean;
	uploaderStatus: MutationStatus
	enabledCollections: ImageCollectionSlug[]
}
type ImageFieldActions = {
	setEnabledCollections: (collections: ImageCollectionSlug[] | null) => void
	setReplaceNodeKey: (key: NodeKey | null) => void
	setOpen: (open: boolean, tab?: TabNames) => void
	setActiveCollection: (collection: ImageCollectionSlug | null) => void
	setEnabled: (enabled: boolean) => void
	setFormId: (FormID: string | null) => void
	setImage: (image: ProcessedImageDoc | null) => void
	setOpenedTab: (tab: TabNames | null) => void
}
type RPImageUploader = ImageFieldActions & ImageFieldState;
const createRPUploadStore = () => createStore<RPImageUploader>()((set, get) => ({
	activeCollection: "assets",
	open: false,
	openedTab: null, enabled: false,
	formID: null,
	value: null,
	enabledCollections: ["assets", "exMedia", "userMedia"],
	setEnabledCollections: (collections: ImageCollectionSlug[] | null) => set({enabledCollections: collections ?? ["assets"]}),
	onInsert: ({relationTo, processed: image, value}) => set({
		value: {
			relationTo, value
		}, image, activeCollection: relationTo
	}),
	replaceNodeKey: null,
	setOpen: (open, tab) =>
		set({open, openedTab: tab || null})
	,
	setActiveCollection: (collection) => {
		if (collection) {
			if (get().enabledCollections.indexOf(collection) > -1) {
				set({activeCollection: collection})
			} else {
				set({activeCollection: "assets"})
			}
		} else {
			set({activeCollection: "assets"})
		}
	},
	setReplaceNodeKey: (key) => {
		set({replaceNodeKey: key})
	},
	setFormId: (formID) => {
		set({formID})
	}, setEnabled: (enabled) => {
		set({enabled})
	}, setImage: (image) =>
		set({image})
	,
	uploaderStatus: "idle",
	image: null,
	setOpenedTab: (openedTab) => set({openedTab})
}))
type RPDarkRoomAPI = ReturnType<typeof createRPUploadStore>

const DarkRoomContext = createContext<RPDarkRoomAPI | undefined>(undefined)
export const useDarkRoom = <T, >(selector: (store: RPImageUploader) => T) => {
	const ctx = useContext(DarkRoomContext);
	if (!ctx) throw new Error("useRPImager must be used within DarkRoomProvider.")
	return useStore(ctx, selector)
}
const DarkRoom = (props: { children: ReactNode }) => {
	const storeRef = useRef<RPDarkRoomAPI>(null!)
	if (!storeRef.current) storeRef.current = createRPUploadStore()
	return (
		<DarkRoomContext.Provider value={storeRef.current}>
			{props.children}
		</DarkRoomContext.Provider>
	)
}
const DarkRoomInternal = ({children}: { children: ReactNode }) => {

	return <>{children}</>
}
export const DarkRoomProvider = ({children}: { children: ReactNode }) => {
	return <DarkRoom><DarkRoomInternal> {children}</DarkRoomInternal></DarkRoom>
}

// export const D = (props: {
//     children: ReactNode;
//     fallback?: FetchedUnsplashImage
//     value?: RalueAsDataWithRelation | null
//     enabled?: boolean;
// }) => {
//     const {fallback: _fallback, value: _initValue, children, enabled: __enabled} = props;
//     const [open, _setOpen] = useState<boolean>(false)
//     const openRef = useRef<boolean>(open)
//     const [activeCollection, _setActiveCollection] = useState<ImageCollectionSlug>(_initValue?.relationTo || _fallback ? 'exMedia' : 'userMedia')
//     const activeCollectionRef = useRef<ImageCollectionSlug>(activeCollection)
//     const setActiveCollection = useCallback((collection: ImageCollectionSlug | null) => {
//         const target = collection || 'userMedia';
//         activeCollectionRef.current = target;
//         _setActiveCollection(target)
//     }, [])
//
//     const siteUrl = getClientSideURL();
//
//
//     const [image, _setImage] = useState<RenderImageFields | null>(_initValue?.value && _initValue.value.src && {
//         src: _initValue.value.src,
//         width: _initValue.value.width,
//         height: _initValue.value.height,
//         darkmode: _initValue.value.darkmode || false,
//         caption: _initValue.value.caption,
//         alt: _initValue.value.alt
//     } || null)
//     const imageRef = useRef<RenderImageFields | null>(image)
//     const setImage = useCallback((image: RenderImageFields | null) => {
//         _setImage(image)
//         imageRef.current = image;
//     }, [])
//     const {user: userInfo} = useAuth();
//     const userId = useMemo(() => userInfo ? `${userInfo.id}` : null, [userInfo])
//     const userName = useMemo(() => userInfo?.name as string || null, [userInfo])
//     const [saved, setSaved] = useState<boolean>(false)
//
//     const [enabled, setEnabled] = useState<boolean>(userId ? __enabled === undefined ? true : __enabled : false)

/**
 *  { userId: string; } & ({
 *         collection: "userMedia";
 *         data: Omit<SaveImageFields, 'metadata' | 'src' | 'source'> & {
 *             source: {
 *                 provider: "local";
 *                 link?: string | null;
 *                 identifier: string;
 *             }
 *         }
 *     } | {
 *         collection: "exMedia";
 *         data: Omit<SaveImageFields, 'metadata' | 'src' | 'source'> & {
 *             metadata?: { width?: number; height?: number } | null;
 *             source: {
 *                 provider: "external" | "unsplash";
 *                 link?: string | null;
 *                 identifier: string;
 *             }
 *         }
 *     })
 */
//
//     return <></>
// }
