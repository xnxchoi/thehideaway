import {DeepKeys, revalidateLogic, useForm, ValidationError} from '@tanstack/react-form';

import {
    FetchedImageDoc,
    ImageProvider,
    ImageSizeNames,
    ProcessedImage,
    ProcessedImageDoc,
    RalueAsDataWithRelation,
    RalueWithRelation,
    RenderImageFields,
    ResizedImageProps,
    TabNames
} from "@/types/collections/imageCollections";
import {
    ComponentProps,
    createContext,
    FocusEventHandler,
    MouseEventHandler,
    ReactNode,
    useCallback,
    useContext,
    useEffect,
    useEffectEvent,
    useMemo,
    useRef,
    useState
} from "react";
import {toast, useAuth, useBulkUpload} from "@payloadcms/ui";
import {errorToast} from "@/payload/components/sonner";
import {uuidv7} from "uuidv7";
import {getClientSideURL} from "@/utilities/getURL";
import {stringify} from "qs-esm";
import {imageSelect} from "@/types/payload-api-selects";
import {QueryStatus, useInfiniteQuery, useMutation, useQuery} from "@tanstack/react-query";
import {ImageCollectionSlug} from "@/types/payload-api-helpers";
import {DateTime} from "luxon";
import NextImage from "next/image";
import {User} from "@payload-types";
import {Where} from "payload";
import {cn} from "@/lib/utils";
import {Skeleton} from "@/components/ui/skeleton";
import {Field} from "@base-ui/react"
import {FileTrigger} from "@/components/ui/file-trigger";
import {Button} from "@/components/ui/button";
import {ImageIcon} from "lucide-react";
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
    NodeKey,
    PASTE_COMMAND
} from "@payloadcms/richtext-lexical/lexical";
import {isHTMLElement, UploadNode} from "@payloadcms/richtext-lexical/client";
import {useLexicalComposerContext} from "@payloadcms/richtext-lexical/lexical/react/LexicalComposerContext";
import ObjectID from "bson-objectid";
import {FetchedUnsplashImage, UnsplashImageDoc} from "@/payload/collections/Media/hooks/types";
import {ImageForm, ImageMetadata} from "@/payload/fields/Article/Cover/ImageNode/Forms/schema";
import {createStore} from "zustand/vanilla";
import {useStore} from "zustand";

import {
    $isRPImageServerNode,
    Internal_RPImageData,
    RP_ImageData
} from "@/payload/fields/Article/Cover/rp-image/server/node/RPImageNode";
import {INSERT_RP_IMAGE_COMMAND, RPImagePayload} from "@/payload/fields/Article/Cover/rp-image/client/drawer/commands";
import {$dfsIterator, $insertNodeToNearestRoot, mergeRegister} from "@payloadcms/richtext-lexical/lexical/utils";
import {
    $createRPImageNode,
    $isRPImageNode,
    RP_ImageNode
} from "@/payload/fields/Article/Cover/rp-image/client/node/RP_ImageNode";

type InsertCallbackParams = {
    value: string;
    processed: ProcessedImageDoc;
    relationTo: ImageCollectionSlug;
}
type InsertCallback = (params: InsertCallbackParams) => void
type RPQueryStatus = QueryStatus | 'disabled';
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
    enabledCollections: ['assets','exMedia','userMedia'],
    setEnabledCollections: (collections: ImageCollectionSlug[] | null) => set({enabledCollections: collections ?? ['assets']}),
    onInsert: ({relationTo, processed: image, value}) => set({
        value: {
            relationTo, value
        }, image, activeCollection: relationTo
    }),
    replaceNodeKey: null,
    setOpen: (open, tab) =>
        set({open, openedTab: tab||null})
            ,
    setActiveCollection: (collection) => {
        if (collection) {
            if (get().enabledCollections.indexOf(collection) > -1) {
                set({activeCollection: collection})
            } else {
                set({activeCollection: "assets"})
            }
        } else {
            set({activeCollection: 'assets'})
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
    image: null,
    setOpenedTab: (openedTab) => set({openedTab})
}))
type RPDarkRoomAPI = ReturnType<typeof createRPUploadStore>
const DarkRoomContext = createContext<RPDarkRoomAPI | undefined>(undefined)
export const useDarkRoom = <T, >(selector: (store: RPImageUploader) => T) => {
    const ctx = useContext(DarkRoomContext);
    if (!ctx) throw new Error('useRPImager must be used within a RPImageProvider')
    return useStore(ctx, selector)
}
type CurationName = "repaire" | "naturale" | "tropic" | "fuzzy" | "neons" | "cityscape"
type SaveImageFields = ImageMetadata & ImageForm & {
    src: string
}
type NodeImageForm = SaveImageFields & {
    formID: string;
}
type FileToUpload = Pick<NodeImageForm, "file" | "alt" | "formID">;
type InsertionSourceTypes = "local" | "unsplash" | "external" | "gallery" | "personal";

function isEmpty(object: Partial<Record<DeepKeys<SaveImageFields>, ValidationError>>) {  // eslint-disable-next-line
    for (const _ in object) {
        return false;
    }
    return true;
}

const ImageUploadForm = ({
                             userId, userName
                         }: {
    userId: string;
    userName: string;
}) => {

    const defaultValues: ImageForm & ImageMetadata = {
        caption: `Uploaded by @${userName}`,

        alt: `Uploaded by @${userName}`,
        file: null!,
        source: {
            identifier: "",
            provider: "local",
        },
        collection: "userMedia",
        author: userId,
        darkmode: false,

    }
    const fileRef = useRef<HTMLInputElement>(null!);
    const form = useForm({
        defaultValues,
        onSubmit: async ({value: formValues}) => {
            const a: ImageForm & ImageMetadata = {
                source: {
                    identifier: userId,
                    provider: "local",
                },
                file: formValues.file,
                collection: "userMedia",
                author: userId,
                darkmode: false, alt: formValues.alt, caption: formValues.caption
            }

        },
        validationLogic: revalidateLogic({
            mode: 'submit',
            modeAfterSubmission: 'change',
        }),
        validators: {
            onDynamic: ({value: formValues}) => {
                const errors: Partial<Record<DeepKeys<SaveImageFields>, ValidationError>> = {};

                (
                    ["file",] as const
                ).forEach((requiredField) => {
                    if (!formValues[requiredField]) {
                        switch (requiredField) {

                            case "file":
                                errors.file = "Please select a file to upload."
                                break;
                        }
                    }
                });
                return isEmpty(errors) ? undefined : {form: errors, fields: errors};
            },
        },
    });
    const handleSubmit = form.handleSubmit(async (data: ImageForm) => {
        toast(
            'Form submitted',
        );
    })

    /* eslint-disable react/no-children-prop */
    return (
        <form
            aria-label="Upload image"
            className="flex w-full max-w-3xs sm:max-w-[20rem] flex-col gap-5"
            noValidate
            onSubmit={(event) => {
                event.preventDefault();
                form.handleSubmit();
            }}
        >

            <form.Field name={'file'}
                        children={
                            (field) => {
                                const {state, name} = field;
                                const {value, meta} = state;
                                const {isValid, isTouched, isDirty} = meta;
                                return (
                                    <Field.Root name={name} invalid={!isValid} dirty={isDirty} touched={isTouched}
                                                className={'flex flex-col gap-6'}>
                                        <Field.Control onValueChange={(newValue) => {

                                        }} render={(fieldProps, state) => <FileTrigger
                                            acceptedFileTypes={['image/webp', 'image/jpg', 'image/jpeg', 'image/png', 'image/gif']}
                                            // Do NOT bind the `value` or `checked` attribute for file inputs in this way
                                            onSelect={(files) => {
                                                // Pass the FileList object to handleChange
                                                if (files && files.length > 0) {
                                                    field.handleChange(files.item(0)!);
                                                }
                                            }}>
                                            <Button variant={'outline'}>
                                                <ImageIcon/>
                                                Choose a file</Button>
                                        </FileTrigger>}/>
                                    </Field.Root>
                                )
                            }
                        }/>

        </form>)
}
export const ImageContext = createContext<RPDarkRoomAPI | undefined>(undefined)
export const DarkRoomProvider = (props: {
    children: ReactNode;
    fallback?: FetchedUnsplashImage
    value?: RalueAsDataWithRelation | null
    enabled?: boolean;
}) => {
    const {fallback: _fallback, value: _initValue, children, enabled: __enabled} = props;
    const [open, _setOpen] = useState<boolean>(false)
    const openRef = useRef<boolean>(open)
    const [activeCollection, _setActiveCollection] = useState<ImageCollectionSlug>(_initValue?.relationTo || _fallback ? 'exMedia' : 'userMedia')
    const activeCollectionRef = useRef<ImageCollectionSlug>(activeCollection)
    const setActiveCollection = useCallback((collection: ImageCollectionSlug | null) => {
        const target = collection || 'userMedia';
        activeCollectionRef.current = target;
        _setActiveCollection(target)
    }, [])

    const siteUrl = getClientSideURL();


    const [image, _setImage] = useState<RenderImageFields | null>(_initValue?.value && _initValue.value.src && {
        src: _initValue.value.src,
        width: _initValue.value.width,
        height: _initValue.value.height,
        darkmode: _initValue.value.darkmode || false,
        caption: _initValue.value.caption,
        alt: _initValue.value.alt
    } || null)
    const imageRef = useRef<RenderImageFields | null>(image)
    const setImage = useCallback((image: RenderImageFields | null) => {
        _setImage(image)
        imageRef.current = image;
    }, [])
    const {user: userInfo} = useAuth();
    const userId = useMemo(() => userInfo ? `${userInfo.id}` : null, [userInfo])
    const userName = useMemo(() => userInfo?.name as string || null, [userInfo])
    const [saved, setSaved] = useState<boolean>(false)

    const [enabled, setEnabled] = useState<boolean>(userId ? __enabled === undefined ? true : __enabled : false)


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
    const select = useMemo(() => imageSelect(), []);
    const {data, isLoading, refetch} = useQuery({
        queryKey: ['image', {
            value: value!.value,
            relationTo: value!.relationTo,
        }],
        queryFn: async ({queryKey}: { queryKey: [string, RalueWithRelation] }) => {
            const [_, {value, relationTo}] = queryKey;
            const res = await fetch(`${siteUrl}/api/${relationTo}/${value}${stringify({select}, {addQueryPrefix: true})}`, {
                credentials: "include",
                headers: {Accept: "application/json"}
            })
            if (res.ok) {
                const newValue = await res.json() as FetchedImageDoc;
                if (!newValue.url) {
                    throw new Error("Failed to fetch image")
                }
                const newFields: RenderImageFields = {
                    ...newValue,
                    src: newValue.url as string,
                }

                return newFields;
            }
            await new Promise((resolve) => setTimeout(resolve, 1000))
        }, retry: 3,
        enabled: !!value
    })


    const saveImage = useCallback(async (args: {
        collection: 'userMedia' | 'exMedia';
        data: ImageForm & ImageMetadata;
        userId: string;
    }) => {
        const {
            userId,
            collection,
            data: initForm
        } = args;
        const suffix = `${stringify({
            select
        }, {addQueryPrefix: true})}`
        const formD = new FormData();
        let returnVal: {
            doc: RalueWithRelation;
            image: RenderImageFields
        } | null = null;
        try {
            formD.append("_payload", JSON.stringify(initForm));
            const res = await fetch(`${siteUrl}/api/${collection}${suffix}`, {
                method: "POST",
                body: formD,
                headers: {
                    "Content-Type": "multipart/form-data"
                }, credentials: "include"
            });
            if (res.ok) {
                const newValue = await res.json() as FetchedImageDoc;
                const {id, blurDataUrl, width, alt, height, caption, darkmode, sizes, src} = newValue;
                if (!!src) {
                    returnVal = {
                        doc: {
                            value: id,
                            relationTo: collection,
                        }, image: {
                            caption,
                            alt, sizes,
                            src,
                            darkmode,
                            blurDataUrl, width, height

                        }
                    }
                } else {
                    const secondTry = await fetch(`${siteUrl}/api/${collection}/${id}${suffix}`, {
                        method: "GET",
                        credentials: "include",
                        headers: {
                            Accept: "application/json"
                        }
                    });
                    if (secondTry.ok) {
                        const secondValue = await secondTry.json() as FetchedImageDoc
                        const {id, blurDataUrl, width, alt, height, caption, darkmode, sizes, src} = secondValue;
                        if (!!src) {
                            returnVal = {
                                doc: {
                                    value: id,
                                    relationTo: collection,
                                }, image: {
                                    caption,
                                    alt, sizes,
                                    src,
                                    darkmode,
                                    blurDataUrl, width, height

                                }
                            }

                        }
                    }
                }
                if (!returnVal) {
                    throw new Error("Failed to upload image")
                }
                return returnVal;
            }
        } catch (e) {
            console.error(e)
            throw e
        }
    }, [siteUrl])
    const {mutateAsync: _uploadImage, status: uploadStatus} = useMutation({
        mutationFn: saveImage,
        onSettled: (data, error, variables,) => {
            if (data) {

                setSaved(true);
            } else {
                setActiveCollection(null)
                setValue(null);
                setImage(null);
                setSaved(false);
            }
            if (error) {
                errorToast(error.message)
            }
        }
    })
    const fileInputRef = useRef<HTMLInputElement | null>(null);
    const getFileInput = useCallback(() => fileInputRef.current, []);
    const setFileInput = useCallback((ref: HTMLInputElement | null) => {
        fileInputRef.current = ref;
    }, []);

    const uploadImage = useCallback((args: null | {
            file?: File;
            data?: Partial<Omit<SaveImageFields, 'locked' | 'authority' | 'allowList'>>
            collection: Exclude<ImageCollectionSlug, 'assets'>
            provider: ImageProvider

        }) => {

            if (args) {
                const {file, provider, collection, data: initForm} = args;
                let fileListToUse: FileList | null = null;
                try {
                    if (!userInfo) {
                        throw new Error("You must be logged in to upload images.")
                    }
                    if (!file) {
                        throw new Error('No file to upload, please select a file to upload')
                    }
                    if (!file.type.startsWith("image/")) {
                        throw new Error("Invalid file type, please select an image file");
                    }
                    if (!['webp', 'png', 'jpg', 'jpeg'].includes(file.type)) {
                        throw new Error("Unsupported image format. Please select a jpg, png, or webp image file");
                    }
                    if (file.size > Number(process.env.NEXT_PUBLIC_IMAGE_MAX_FILE_SIZE)) {
                        throw new Error("Image is too large, select a file with 3mb or less");
                    }
                    const dataTransfer = new DataTransfer();
                    dataTransfer.items.add(file);
                    fileListToUse = dataTransfer.files;
                    const finale = fileListToUse[0];
                    if (!finale) throw new Error("Failed to upload image")
                    const imageurl = URL.createObjectURL(finale);
                    const baseData: Partial<SaveImageFields> = {
                        ...(initForm || {})
                    }
                    const darkmode = baseData.darkmode || false;
                    const src = baseData.src || imageurl;
                    const alt = baseData.alt || "";
                    const caption = baseData.caption || `Image by @${userInfo.name}`;
                    const dataForm: Omit<SaveImageFields, 'file'> = {
                        ...baseData,
                        author: userInfo.id + "",
                        collection,
                        darkmode,
                        source: {
                            ...baseData.source,
                            provider,
                            identifier: baseData.source?.identifier || uuidv7(),
                            link: baseData.source?.link
                        }, src, alt, caption

                    }
                    setImage({
                        src,
                        darkmode,
                        alt,
                        caption,
                    })
                    return;
                } catch (e) {
                    e instanceof Error && errorToast(e.message)
                }
            }
            setImage(null);

        },
        [setImage, userInfo]
    )
    const [inserted, _setInserted] = useState<boolean>(false)

    // const processImage = useCallback(({blob, userName}: { blob: Blob; userName: string }) => {
    //     if (blob) {
    //         const mimeType = blob.type;
    //         if (!mimeType.startsWith('image/')) {
    //             throw new Error("Invalid file type, please select an image file")
    //         }
    //         const r = mimeType.split('/')[1];
    //         const fileType = r.toLowerCase();
    //         if (!['webp', 'png', 'jpg', 'jpeg'].includes(fileType)) {
    //             throw new Error("Unsupported image format. Please select a jpg, png, or webp image file");
    //         }
    //         return new File([blob], `${userName}-${DateTime.now().toFormat('yyyymmdd:hhmmss')}.${fileType}`, {type: blob.type})
    //     }
    //     throw new Error("Invalid file.")
    // }, [])
    const setOpen = useCallback((open: boolean) => {
        if (!open) {
        }
        _setOpen(open)
        openRef.current = open

    }, [])


    const onLocalDocSelect = useCallback((fileList?: FileList) => {
        if (!userId || !userName) throw new Error("You must be logged in to upload images.")
        const file = fileList?.[0]
        uploadImage({
            file, data: {
                caption: "Image by @" + userName,
            }, collection: 'userMedia', provider: 'local'
        })

    }, [uploadImage, userId, userName])

    // const onChange = useCallback(async (data: FetchedImageDocs | null) => {
    //     if (data) {
    //         const {
    //             alt,
    //             darkmode,
    //             src,
    //             url,
    //             caption,
    //             source,
    //             sizes,
    //             thumbnailURL,
    //             blurDataUrl,
    //             width,
    //             height
    //         } = data;
    //         const newFields: ProcessedImage = {
    //             darkmode,
    //             alt,
    //             caption,
    //             width,
    //             height,
    //             blurDataUrl,
    //             thumbnailURL,
    //             src: src || "",
    //             url: url || "",
    //         }
    //         if (!url) {
    //             const newOnes = await fetch(`${siteUrl}/api/userMedia/${data.id}${stringify({
    //                 select: {
    //                     url: true,
    //                     filename: true,
    //                 }
    //             })}`, {
    //                 method: "GET",
    //                 credentials: "include",
    //                 headers: {Accept: "application/json"}
    //             }).then(async (r) => await r.json() as {
    //                 id: string;
    //                 url?: string | null;
    //                 filename?: string | null
    //             }).then(v => {
    //                 if (typeof v.url === 'string') return v.url;
    //                 return null;
    //             }).catch(e => {
    //                 console.error(e);
    //                 return null;
    //             })
    //             if (newOnes) {
    //                 newFields.url = newOnes;
    //                 newFields.src = newOnes;
    //             }
    //         }
    //         if (!newFields.url) {
    //             errorToast('Upload may have completed; error fetching the saved image url')
    //
    //         } else {
    //             setImage({
    //                 ...newFields,
    //             })
    //             setFile(null);
    //             setValue({
    //                 relationTo: 'userMedia',
    //                 value: data.id
    //             });
    //             return;
    //         }
    //
    //     }
    //     setImage(null);
    //     setFile(null);
    //     setValue(null);
    // }, [setFile, setImage, setValue, siteUrl])

    // const doUpload = useCallback(async () => {
    //     const file = fileRef.current;
    //     if (!file) {
    //         throw new Error("No file to upload, please select a file to upload")
    //     }
    //     const docFields = imageFormRef.current;
    //     const collection = activeCollectionRef.current
    //     const isLocal = collection === 'userMedia'
    //     if (!userId) throw new Error("You must be logged in to upload images.")
    //     if (!docFields) throw new Error('No image to upload')
    //     const formFields: SaveImageFields = {
    //         ...docFields,
    //         source: {
    //             identifier: "",
    //             provider: isLocal ? 'local' : 'external'
    //         }
    //     }
    //     const formD = new FormData();
    //
    //     formD.append("file", file);
    //     if (isLocal) {
    //
    //         formD.append(
    //             "_payload",
    //             JSON.stringify({
    //                 ...formFields,
    //                 locked: false
    //             } satisfies SaveUMFields)
    //         );
    //     } else {
    //         const metadata = width && height ? {width, height} : {};
    //         formD.append(
    //             "_payload",
    //             JSON.stringify({
    //                 ...formFields,
    //                 src: externalUrlInput.current,
    //                 metadata
    //             } satisfies SaveExFields)
    //         )
    //     }
    //
    //     const select = imageSelect();
    //
    //     const res = await fetch(`${siteUrl}/api/${collection}${stringify({
    //             select: select
    //         }, {addQueryPrefix: true})}`
    //         , {
    //             method: "POST",
    //             body: formD,
    //             headers: {
    //                 "Content-Type": "multipart/form-data"
    //             }, credentials: "include"
    //         })
    //     if (res.ok) {
    //
    //         return await res.json() as FetchedImageDocs
    //     }
    //     throw new Error('Failed to upload image')
    // }, [siteUrl, userId])

    //
    // return <ImageContext.Provider value={{
    //     open,
    //     setOpen,
    //     setValue,
    //     setActiveCollection, activeCollection,
    //     inserted, uploadStatus,
    //     value, saved,
    //     image,
    // }}>
    //     {children}
    // </ImageContext.Provider>
    return <></>
}
export const ExternalLinkInput = ({user:{
    name:userName,
    id:userId,

},siteUrl}:{
    user:{
        name:string;
        id:string;
    }
    siteUrl:string;
}) => {
    const urlRegex = useMemo(() => /^(http(s?):\/\/)?(www\.)?(([-a-zA-Z0-9@:%_]{2,256})\.)*([-a-zA-Z0-9@:%_]{2,256})\.([a-z]){2,16}((\/([-a-zA-Z0-9@:%_]+))*)(\?([-a-zA-Z0-9@:%_]+)((=([-a-zA-Z0-9@:%_]*))?)(&([-a-zA-Z0-9@:%_]+)((=([-a-zA-Z0-9@:%_]*))?))*)?((#([-a-zA-Z0-9@:%_]+))?)$/, [])
    const onExternalUrlInput = useCallback(async (v: string) => {
        if (!userId || !userName) throw new Error("You must be logged in to upload images.")

        if (!v.match(/^http(s?):\/\//)) {
            v = "https://" + v;
        }
        const input = v.trim();
        // Trim to avoid hidden whitespace tricks
        const value = encodeURI(input);
        if (!urlRegex.test(value)) throw new Error("Invalid URL");
        const url = new URL(value);
        // Hard rule: only http or https
        if (url.protocol !== 'http' && url.protocol !== 'https') throw new Error("URL must start with http or https, or no protocol specified.");
        // Reject empty hostname or localhost-ish attempts
        if (!url.hostname || url.hostname.match(/^localhost$|^\d+\.\d+\.\d+\.\d+$/)) throw new Error("Invalid host; localhost is not allowed.");
        // Reject obviously malformed paths (browser won't reject these)
        if (/\s/.test(url.pathname)) throw new Error('Space cannot be used in the path.')

        try {
            const uid = uuidv7();
            const r = await fetch(`${siteUrl}/api/image-courier${stringify({url: value}, {
                addQueryPrefix: true,
            })}`, {method: "GET", credentials: "include"})

            if (r.ok) {
                const blob = await r.blob();
                const file = new File([blob], `external-${uid}.jpg`, {type: blob.type || "image/jpeg"})

                const alt = "An image from " + url.hostname;
                const caption = "Image via " + url.hostname + " , uploaded by @" + userName;

            }
        } catch (error) {
            console.error("Error uploading image:", error);
            throw new Error("Failed to upload the url image. Please try again.");
        }
    }, [siteUrl, urlRegex, userId, userName])

    const onFocusChange: FocusEventHandler<HTMLInputElement> = useCallback((e) => {
        const v = e.currentTarget.value;
        if (!urlRegex.test(v)) return;

        onExternalUrlInput(v).catch((e) => {
            if (e instanceof Error) {
                errorToast(e.message)
            }
        })

    }, [onExternalUrlInput, urlRegex])
    return <div>
        <div>
            <input onBlur={onFocusChange} type={'url'}/>
        </div>
        <div role={"button"}>
            Upload
        </div>
    </div>
}
export const AssetsGallery = () => {
    const {user} = useAuth();
    const userId = useMemo(() => (user ? (user as User & { collection: "users" }).id : null), [user]);
    const userName = useMemo(() => (user ? (user as User & { collection: "users" }).name : null), [user]);
    const siteUrl = getClientSideURL()
    const setImage = useDarkRoom(r => r.setImage);
    const setActiveCollection = useDarkRoom(r => r.setActiveCollection);
    const select = useMemo(() => imageSelect(), [])
    const {data: entries} = useQuery({
        queryKey: ['assetsGallery'],
        queryFn: async () => {
            const where: Where & {
                [x in 'or' | 'and']?: Where[]
            } = {
                and: [
                    {}
                ]
            }
            const res = await fetch(`${siteUrl}/api/assets${stringify({select}, {addQueryPrefix: true})}`, {
                method: "GET",
                credentials: "include"
            })
            if (res.ok) {
                return await res.json() as RalueWithRelation[]
            }
            throw new Error("Failed to fetch assets gallery")
        },
        enabled: Boolean(userId)
    })
    const onGallerySelect = useCallback(async (entry: RalueWithRelation) => {
        if (!userId) throw new Error("You must be logged in to upload images from gallery.")
        const r = await fetch(`${siteUrl}/api/assets/${entry.value}${stringify({select}, {addQueryPrefix: true})}`, {
            method: "GET",
            credentials: "include"
        });
        if (r.ok) {
            const data = await r.json().then(f => f as FetchedImageDoc).then((v) => {
                const {
                    alt,
                    src,
                    url,
                    caption,
                    blurDataUrl,
                    thumbnailURL,
                    source,
                    sizes,
                    darkmode,
                    mimeType,
                    filename,
                    width,
                    id,
                    height
                } = v;
                if (typeof url === 'string' && typeof src === 'string') {
                    return {
                        id,
                        url: url,
                        src: src,
                        alt,
                        width,
                        height,
                        blurDataUrl,
                        thumbnailURL,
                        caption,
                        darkmode,
                        mimeType,
                        filename,
                        source, sizes,

                    } satisfies ProcessedImageDoc
                }
                return null;
            })
            if (!data) throw new Error("Failed to fetch image from gallery")
            setImage(data);
            setActiveCollection('assets');
        } else {
            errorToast("Failed to fetch image from gallery")
        }
    }, [select, setActiveCollection, setImage, siteUrl, userId])

}
export const UnsplashGallery = (props: {
    curation: CurationName;
    expanded: boolean;
    onExpand: (state: boolean) => void
}) => {
    const curationName = props.curation;
    const [totalCount, setTotalCount] = useState(0);
    // const getUnsplashCollections = useCallback(async ({}) => {
    //     try {
    //         const res = await fetch(`https://api.unsplash.com/users/inxcess/collections/`, {
    //             headers: {Authorization: `Client-ID PmprbTtYGRK6RvmubJroUAF0SWqJjvgs0UuTaeFoHiA`}
    //         });
    //         if (res.ok) {
    //         }
    //         throw new Error("No collections found")
    //     } catch (e) {
    //         console.error("Error while fetching unsplash collections:", e);
    //         throw new Error("No collections found")
    //     }
    // }, [])
    // const {data: collectionsData} = useQuery({
    //     queryKey: ['unsplashCollections', {curationName}],
    //     queryFn: getUnsplashCollections
    // })
    // const collections = collectionsData?.map(c => ({
    //     id: c.id,
    //     title: c.title,
    //     description: c.description,
    //     total_photos: c.total_photos
    //
    // })) || null;
    // return <div
    //     className="flex w-full flex-nowrap items-center overflow-x-auto overflow-y-hidden content-start bg-muted-faded-background/30 px-[12px] py-0">{collections ? collections.map(c =>
    //     <UnsplashGalleryRow collection={c} key={c.id}/>) : null}</div>;
}
const UnsplashGalleryRow = ({collection}: {
    collection: {
        id: number,
        title: string,
        description: string,
        total_photos: number
    }
}) => {
    const collectionId = collection.id;
    const maxItems = useMemo(() => collection.total_photos, [collection])
    const getUnsplashCollection = useCallback(async ({queryKey}: {
        queryKey: [string, { curation: number }]
    }) => {
        const [_, {curation}] = queryKey;
        try {
            const photosFetchRes = await fetch(`https://api.unsplash.com/collections/${curation}/photos`, {
                method: "GET", headers: {
                    Authorization: `Client-ID PmprbTtYGRK6RvmubJroUAF0SWqJjvgs0UuTaeFoHiA`
                }
            });
            if (photosFetchRes.ok) {
                const r = await photosFetchRes.json() as UnsplashImageDoc[];
                return r.map((pic): Omit<ProcessedImageDoc, 'id' | 'url'> => {
                    let processedUnsplash: Omit<ProcessedImageDoc, 'id' | 'url'> = {
                        src: pic.urls.regular,
                        height: pic.height,
                        width: pic.width,
                        caption: `By ${pic.user.name} on Unsplash`,
                        blurDataUrl: pic.blur_hash,
                        alt: pic.description,
                        darkmode: false,
                        source: {
                            identifier: pic.id, provider: "unsplash", link: pic.links.self,
                        }
                    }
                    if (!!pic.urls) {
                        let basePath: string | undefined;
                        const urs = pic.urls;
                        if (typeof urs === 'object') {
                            if ('raw' in urs && !!urs.raw && typeof urs.raw === 'string') {
                                //example url: https://images.unsplash.com/face-springmorning.jpg"
                                const bp = urs.raw.split('/').pop();
                                //we should have gotten "face-springmorning.jpg"
                                if (!!bp) {
                                    basePath = bp;
                                }
                            }
                        }
                        if (typeof basePath === 'string') {
                            const sizes = Object.entries(pic.urls).reduce((previousValue, [curKey, curUrl]) => {
                                const kk = curKey as keyof typeof pic.urls;
                                if (kk === 'raw') return previousValue;
                                const ck: ImageSizeNames = kk === 'regular' ? 'content' : kk === 'thumb' ? kk : kk === 'small' ? 'card' : kk === 'full' ? 'content_wide' : 'content';
                                const params = new URL(curUrl).searchParams;
                                let ww: string | null | number = params.get('w');
                                let hh: string | null | number = params.get('h');
                                ww = ww && (parseInt(ww, 10)) || null;
                                hh = hh && (parseInt(hh, 10)) || null;
                                const setUpSizes: ResizedImageProps = {
                                    width: ww as null | number,
                                    height: hh as number | null,
                                    filename: basePath,
                                    url: curUrl,
                                };
                                return {
                                    ...previousValue,
                                    [ck]: setUpSizes
                                };
                            }, {
                                hero: {
                                    filename: basePath,
                                    width: pic.width,
                                    height: pic.height,
                                    url: pic.urls.raw,
                                }
                            }) || undefined;
                            sizes && (processedUnsplash = {...processedUnsplash, sizes});
                        }
                    }
                    return processedUnsplash;
                })
            }
            // noinspection ExceptionCaughtLocallyJS
            throw new Error("No collection found");
        } catch (e) {
            console.error("Error while fetching unsplash collection:", e);
            throw new Error("No collection found");
        }
    }, [])

    const {data: pgotos, isFetching, isLoading, isSuccess} = useQuery({
        queryKey: ['unsplashCollectionPics', {curation: collectionId}],
        queryFn: getUnsplashCollection,
    })
    const [isClear, setIsClear] = useState(!isLoading && !isFetching && pgotos)
    useEffect(() => {
        setIsClear(!isLoading && !isFetching && isSuccess && pgotos)
    }, [pgotos, isLoading, isFetching, isSuccess])

    return <div className={'flex flex-col gap-px'}>
        <div className={'flex flex-col justify-start gap-2'}>
            <span>{
                collection.title
            }</span>
            <span>
                {
                    collection.description
                }
            </span>
        </div>
        <div className={"relative w-full p-2"}>
            <div className={"flex w-full overflow-x-auto overflow-y-hidden content-start gap-2"}>
                {isClear && pgotos && pgotos.length && pgotos.map((r, i) => (
                    <UnsplashPhoto doc={r}
                                   key={`item-${i}`}/>
                ))
                }</div>
        </div>
    </div>
}
const FocusedRow = ({collection}: {
    collection: {
        id: number,
        title: string,
        description: string,
        total_photos: number
    }
}) => {
    const collectionId = collection.id;
    const maxItems = collection.total_photos;
    const fetchCurationItems = useCallback(async ({queryKey, pageParam}: {
        queryKey: [string, { collection: number }],
        pageParam: number | null
    }) => {
        const [_, {collection}] = queryKey;
        const photoFetchRes = await fetch(
            `https://api.unsplash.com/collections/${collection}/photos?page=${pageParam}&per_page=8`, {
                method: "GET", headers: {
                    Authorization: `Client-ID PmprbTtYGRK6RvmubJroUAF0SWqJjvgs0UuTaeFoHiA`
                }
            });
        if (photoFetchRes.ok) {
            const photoRes = (await photoFetchRes.json()) as Array<UnsplashImageDoc>;
            const pic = photoRes[0];
            if (!pic) {
                throw new Error("No photos found");
            }
            return photoRes.map(pic => {
                const image = {
                    src: pic.urls.raw + "&w=500&q=85",
                    height: pic.height * 500 / pic.width,
                    width: 500,
                    caption: `By ${pic.user.name} on Unsplash`,
                    blurDataUrl: pic.blur_hash,
                    alt: pic.description,
                    darkmode: false,

                } satisfies RenderImageFields;
                const doc = {
                    source: {
                        identifier: pic.id, provider: "unsplash", link: pic.urls.raw,

                    },

                    alt: pic.description,
                    caption: `By ${pic.user.name} on Unsplash`,
                    darkmode: false,
                    attribution: {
                        name: pic.user.name,
                        link: pic.links.self
                    }
                } satisfies Omit<ImageMetadata, 'author'>
                return {image, doc}
            });
        }
        throw new Error("Failed to fetch collection items")
    }, [])
    const {data, hasNextPage, status} = useInfiniteQuery({
        queryKey: ['unsplashCollection', {collection: collectionId}] as [string, { collection: number }],
        queryFn: fetchCurationItems,
        initialPageParam: 1,
        enabled: !!collectionId && !!maxItems, getNextPageParam: (lastPage, allPages, lastPageParam) => {
            if (lastPage.length === 0) {
                return undefined
            }
            return lastPageParam + 1
        },
        getPreviousPageParam: (firstPage, allPages, firstPageParam) => {
            if (firstPageParam <= 1) {
                return undefined
            }
            return firstPageParam - 1
        },
        staleTime: Infinity
    })
    return <>

    </>
}
const UnsplashPhoto = ({doc, className, children, ...rest}: ComponentProps<'div'> & {
    doc: Omit<ProcessedImage, 'id' | 'url'>;
}) => {
    const onInsert = (props: {
        file: File;
        collection: ImageCollectionSlug;
        data?: Partial<SaveImageFields>;
        provider?: ImageProvider;
    }) => {
    }

    const {user} = useAuth()
    const [disabled, setDisabled] = useState(false)

    const unsplashInsertCallback = useCallback(async () => {

            if (!user) throw new Error("You must be logged in to upload images.")
            const userName = user.name as string;
            const userId = user.id;
            try {
                const newSrc = doc.src + "&w=400&q=70"
                const imageResponse = await fetch(newSrc);

                const blob = await imageResponse.blob();
                if (!blob) throw new Error("Invalid file.")
                const mimeType = blob.type;
                if (!mimeType.startsWith('image/')) {
                    throw new Error("Invalid file type, please select an image file")
                }
                const r = mimeType.split('/')[1];
                const fileType = r.toLowerCase();
                if (!['webp', 'png', 'jpg', 'jpeg'].includes(fileType)) {
                    throw new Error("Unsupported image format. Please select a jpg, png, or webp image file");
                }
                const file = new File([blob], `${userName}-${DateTime.now().toFormat('yyyymmdd:hhmmss')}.${fileType}`, {type: blob.type})

                // onInsert(
                //     {
                //         file,
                //         data: {
                //             ...doc,
                //             author: userId + "",
                //             src: newSrc
                //         },
                //         collection: "exMedia",
                //         provider: "unsplash"
                //     }
                // )

            } catch (e) {
                console.error("Error in fetching Unsplash image:", e)
                throw new Error("Failed to fetch image from Unsplash")
            }
        }, [doc, onInsert, user]
    );
    const onClickCallback: MouseEventHandler<HTMLDivElement> = useCallback(async (e) => {
        e.preventDefault();
        const ddstate = e.currentTarget.getAttribute('data-disabled')
        if (!ddstate || ddstate === 'true') {
            return;
        }
        await unsplashInsertCallback();
    }, [unsplashInsertCallback])
    return <div
        className={cn("h-full p-1.5 relative", className, disabled && "pointer-events-none")}
        role="button"
        data-disabled={disabled}
        onClick={onClickCallback}
        {...rest}
    >
        {doc ?
            <figure
                className={cn("w-full relative m-0 h-[64px] rounded-[4px] overflow-hidden transition-[opacity,background-color] duration-200 ease-out-power2 hover:opacity-85 hover:bg-muted-faded-background")}>
                <NextImage
                    unoptimized={true}
                    preload={false}
                    src={doc.src}
                    alt={doc.alt}
                    blurDataURL={doc.blurDataUrl || undefined}
                    fill={true}
                    className={
                        "position-[center_60%] block w-full absolute inset-0 object-cover"
                    }
                />
                {doc.caption && <figcaption
                    className={"right-[.5em] bottom-[.05em] flex h-[1em] w-full items-center justify-end bg-transparent p-[1.5em] underline"}>{doc.caption}</figcaption>}
            </figure> : <Skeleton className={'rounded-[4px] h-[64px] aspect-[4/3] w-auto'}/>}
    </div>
}