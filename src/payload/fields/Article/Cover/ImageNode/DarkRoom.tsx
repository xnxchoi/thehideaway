import {
	ImageSaveParams,
	useRPUploadMutation
} from "@/payload/fields/Article/Cover/ImageNode/hooks/useRPImageQuery";
import {
	ImageCollectionSlug,
	ProcessedImageDoc,
	TabNames
} from "@/types/collections/image-collections";
import {ImageMetadata} from "@/types/ImageCollections/schema";
import {MutationStatus} from "@tanstack/react-query";
import {
	createContext,
	ReactNode,
	useCallback,
	useContext,
	useEffect,
	useRef,
	useState
} from "react";

export type ImageProcessForm = {
	file: File;
	formID: string;
	meta: Omit<ImageMetadata, "id" | "src"> & Partial<{
		src: string
	}>;
}
type ImageFieldState = {
	open: boolean;
	activeCollection: ImageCollectionSlug;
	imageForm: ImageProcessForm[] | null;
	focusedTab: TabNames | null;
	onCancel: ((formID: string, error?: Error | null) => void) | null;
	onSuccess: ((props: {
		relationTo: ImageCollectionSlug
		value: ProcessedImageDoc
		nodeKey: string
	}) => void) | null;
	status: MutationStatus
	success: boolean
	onSelect: (params: ImageSaveParams) => void
}
type ImageFieldActions = {
	setOpen: (open: boolean, tab?: TabNames) => void
	setActiveCollection: (collection: ImageCollectionSlug | null) => void
	setOnSuccess: (onSuccess: ImageFieldState["onSuccess"]) => void
	setOnCancel: (onCancel: ImageFieldState["onCancel"]) => void
	setImageForm: (processForm: ImageProcessForm[] | null) => void;
	setFocusedTab: (tab: TabNames | null) => void
}
// const createRPUploadStore = () => createStore<RPImageUploader>()((set, get) => ({
// 	activeCollection: "assets",
// 	open: false,
// 	focusedTab: null,
// 	imageForm: null,
// 	setOpen: (open, tab) =>
// 		set({open, focusedTab: tab || null}),
// 	onSuccess: null,
// 	onCancel: null,
// 	success: false,
// 	setSuccess: (success) => set({success}),
// 	setOnSuccess: (onSuccess) => set({onSuccess}),
// 	setOnCancel: (onCancel) => set({onCancel}),
// 	setImageForm: (imageForm) => set({imageForm}),
// 	setActiveCollection: (collection) => set({activeCollection: collection || "assets"}),
// 	uploaderStatus: "idle",
// 	setFocusedTab: (focusedTab) => set({focusedTab})
// 	,
// 	setUploaderStatus: (status) => set({uploaderStatus: status})
// }))
// type RPDarkRoomAPI = ReturnType<typeof createRPUploadStore>

// const DarkRoomContext = createContext<RPDarkRoomAPI | undefined>(undefined)
type RPImageUploader = ImageFieldActions & ImageFieldState;
const DarkRoomContext = createContext<RPImageUploader | undefined>(undefined)
export const useDarkRoom = <T, >(selector: (store: RPImageUploader) => T) => {
	const ctx = useContext(DarkRoomContext);
	if (!ctx) throw new Error("useRPImager must be used within DarkRoomProvider.")
	return selector(ctx);
}
const DarkRoom = (props: { children: ReactNode }) => {
	const {
		mutate,
		status,
		setOnCancel,
		isSuccess,
		setOnSuccess,
		reset,
		onSuccess,
		onCancel
	} = useRPUploadMutation();
	const [imageForm, setImageForm] = useState<ImageProcessForm[] | null>(null);
	const [focusedTab, setFocusedTab] = useState<TabNames | null>(null);
	const isSuccessRef = useRef(isSuccess);
	useEffect(() => {
		isSuccessRef.current = isSuccess
	}, [isSuccess])
	const [open, _setOpen] = useState<boolean>(false);
	const openRef = useRef(open);
	useEffect(
		() => {
			openRef.current = open
		}, [open]
	)
	const setOpen = useCallback((open: boolean, tab?: TabNames) => {
		if (openRef.current === open) return;
		reset();

		if (open) {
			setFocusedTab(tab || null)
			_setOpen(true)
		} else {
			_setOpen(false)
			setFocusedTab(null)
		}
	}, [reset])
	const [activeCollection, _setActiveCollection] = useState<ImageCollectionSlug>("userMedia");
	const setActiveCollection = useCallback((collection: ImageCollectionSlug | null) => {
		setActiveCollection(collection || "userMedia")
	}, [])
	const onSelect = useCallback(({
		                              meta,
		                              relationTo,
		                              file,
		                              nodeKey,
	                              }: ImageSaveParams) => {
		mutate(
			{
				meta,
				relationTo,
				file,
				nodeKey
			}
		)
	}, [mutate])
	return (
		<DarkRoomContext.Provider value={{
			imageForm,
			open,
			setOpen,
			setImageForm,
			status,
			focusedTab,
			setFocusedTab,
			success: isSuccess,
			setOnSuccess, activeCollection, setActiveCollection,
			setOnCancel, onCancel, onSuccess, onSelect
		}}>
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
