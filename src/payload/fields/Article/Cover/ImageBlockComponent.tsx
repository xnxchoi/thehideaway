"use client";
import {Menu, Tabs} from "@base-ui/react";
import {
	type ListDrawerProps,
	useAuth,
	useDocumentForm,
	useDocumentInfo,
	useField,
	useListDrawer
} from "@payloadcms/ui";
import {useLenis} from "lenis/react";
import {AnimatePresence, useMotionValue} from "motion/react";
import * as m from "motion/react-m";
import Image from "next/image";
import type {
	CollectionSlug,
	DataFromCollectionSlug,
	FilterOptionsResult,
	PaginatedDocs,
	UploadFieldClientProps,
	Where
} from "payload";
import {stringify} from "qs-esm";
import type {
	ChangeEvent,
	ClipboardEventHandler,
	DragEventHandler,
	PointerEventHandler
} from "react";
import {useCallback, useEffect, useMemo, useRef, useState} from "react";

import {uuidv7} from "uuidv7";
import {useShallow} from "zustand/shallow";

import {EASING} from "@/constants/animations";
import {cn} from "@/lib/utils";
import {MenuPopup} from "@/payload/components/Popover";
import {errorToast} from "@/payload/components/sonner";
import {useCourier} from "@/payload/elements/DocumentFields/RP_CourierProvider";
import {useAltDocCtrls} from "@/payload/providers/Admins";
import {useCursor} from "@/providers/RP_Pro";
import type {UserOverview} from "@/types/collections/posts";
import type {ImageCollection, ImageCollectionSlug} from "@/types/payload-api-helpers";
import {clamp} from "@/utilities/mathUtilities";

import {useGalleryFetch} from "./useGalleryFetch";
import type {
	FetchedImage,
	FetchedImageDoc,
	PopulatedDocs,
	RalueAsDataWithRelation,
	TabNames
} from "@/types/collections/imageCollections"
import {UnsplashFetchResult} from "@/payload/collections/Media/hooks/types";

const NextImage = m.create(Image);

export type ArticleCoverProps = UploadFieldClientProps & {
	readonly allowCreate?: boolean;
	readonly filterOptions?: FilterOptionsResult;
	readonly path: string;
	readonly readOnly?: boolean;
	readonly user: UserOverview;
	readonly relationTo: ImageCollectionSlug;
	readonly required?: boolean;
	readonly serverURL?: string;
} & {
	readonly value?: null | RalueAsDataWithRelation;
	readonly fallback?: null | UnsplashFetchResult;
};
export const CoverImageClient = (props: ArticleCoverProps) => {
	const {
		allowCreate = false,
		filterOptions: filterOptionsFromProps,
		relationTo,
		path,
		validate,
		readOnly,
		required,
		fallback,
		value: initValue,
		serverURL,
		user
	} = props;

	const attemptCount = useRef(0);
	const {value, setValue} = useField<string>({
		path
	});
	const userName = useMemo(() => user.name, [user]);
	const unsplashFallback = useRef<UnsplashFetchResult>(fallback || null);
	const [wantInsert, setWantInsert] = useState(false);
	const {value: positionY, setValue: setPositionY} = useField<number>({
		path: "coverPosition"
	});
	const translateY = useMotionValue(positionY);
	const transformPosition = useMotionValue(`center ${translateY.get()}%`);
	const imageRef = useRef<HTMLDivElement>(null!);
	const [insertedFile, setInsertedFile] = useState<File | null>(null);
	const docIsSaving = useCourier((r) => r.savingState);
	const {submit} = useDocumentForm();
	const restRef = useRef<Pick<
		ImageCollection,
		"alt" | "caption" | "source"
	> | null>(null);
	const [openedTab, setOpenedTab] = useState<TabNames | null>(null);
	const onOpenTabChange = (tab: null | TabNames) => {
		setOpenedTab(tab);
	};
	const altDocShown = useAltDocCtrls(useShallow((r) => r.peeked));
	const [populatedDocs, setPopulatedDocs] = useState<PopulatedDocs>();
	const {permissions} = useAuth();
	const initURLValue = initValue?.value?.url || null;
	const initIdValue = initValue?.value?.id || null;
	const [image, setImage] = useState<
		| string
		| FetchedImage
		| null
	>(initValue?.value || null);
	const [dragging, setDragging] = useState(false);
	const [inserted, setInserted] = useState<boolean>(Boolean(initURLValue));
	const [repositioning, setRepositioning] = useState(false);
	const lastConfirmedYPosition = useMotionValue(positionY);
	useEffect(() => {
		lastConfirmedYPosition.set(positionY);
	}, [lastConfirmedYPosition, positionY]);
	const onRepositionClick: PointerEventHandler = useCallback((e) => {
		e.preventDefault();
		e.stopPropagation();
		setRepositioning(true);
	}, []);
	const {setUploadStatus} = useDocumentInfo();
	const finishRepositionClick = useCallback(
		(e: PointerEvent) => {
			const imageEL = imageRef.current;
			e.stopPropagation();
			e.preventDefault();
			setDragging(false);
			if (!imageEL) {
				setRepositioning(false);
				return;
			}
			if (e.target) {
				const t = e.target as HTMLElement;
				if (!(imageEL.contains(t) || t === imageEL)) {
					setRepositioning(false);
				}
				setPositionY(translateY.get());
			}
		},
		[setPositionY, translateY]
	);

	const saveButton = useCourier((r) => r.buttonRef);
	const [visible, setVisible] = useState(false);
	const visiTO = useRef<ReturnType<typeof setTimeout> | null>(null);
	const [hover, setHover] = useState<boolean>(false);
	useEffect(() => {
		const doShow = hover || altDocShown;
		if (visiTO.current) {
			clearTimeout(visiTO.current);
			visiTO.current = null;
		}
		if (doShow) {
			setVisible(true);
		} else {
			visiTO.current = setTimeout(() => setVisible(false), 100);
		}
	}, [hover, altDocShown]);

	const [activeRelationTo, setActiveRelationTo] =
		useState<ImageCollectionSlug>(relationTo);
	const filterOptions: FilterOptionsResult = useMemo(() => {
		return {
			...filterOptionsFromProps,
			[activeRelationTo]: {
				...((filterOptionsFromProps?.[activeRelationTo] as any) || {}),
				id: {
					...((filterOptionsFromProps?.[activeRelationTo] as any)?.id || {}),
					not_in: (
						(filterOptionsFromProps?.[activeRelationTo] as any)?.id?.not_in ||
						[]
					).concat(...(Array.isArray(value) || value ? [value] : []))
				}
			}
		};
	}, [value, activeRelationTo, filterOptionsFromProps]);
	const loadedValueDocsRef = useRef<boolean>(false);
	const setStatus = useCourier((r) => r.setStatus);
	const lenis = useLenis();

	const [menuOpen, setMenuOpen] = useState(false);
	const leaveSetup = useCallback(() => {
		lenis?.start();
	}, [lenis]);
	const enterSetup = useCallback(() => {
		lenis?.stop();
	}, [lenis]);
	const onChange = useCallback(
		async (
			newValue: FetchedImageDoc | null,
			fallback?: string,
			shouldSave?: boolean
		) => {
			attemptCount.current = newValue ? 0 : attemptCount.current + 1;
			if (!newValue) {
				setInserted(false);

				setImage(null);
				setValue(null);
				if (shouldSave) {
					if (attemptCount.current > 3) {
						setInsertedFile(null);

						attemptCount.current = 0;
						restRef.current = null;
						setStatus("idle");
						errorToast("Something's wrong with the image... Removed the file");
					}
				}
			} else {
				setInserted(true);
				setValue(newValue.id);
				setImage(newValue);
				setInsertedFile(null);
			}
		},
		[setValue, setStatus]
	);

	const canCreate = useMemo(() => {
		if (!allowCreate) {
			return false;
		}
		if (typeof activeRelationTo === "string") {
			if (
				permissions?.collections &&
				permissions.collections?.[activeRelationTo]?.create
			) {
				return true;
			}
		}

		return false;
	}, [activeRelationTo, permissions, allowCreate]);
	const [
		ListDrawer,
		,
		{closeDrawer: closeListDrawer, openDrawer: openListDrawer}
	] = useListDrawer({
		collectionSlugs: [relationTo],
		filterOptions
	});
	const valueIdRef = useRef<null | string>(value || null);
	useEffect(() => {
		valueIdRef.current = value || null;
	}, [value]);
	const [removeImage, setRemoveImage] = useState<boolean>(false);
	const populateDocs = useCallback(
		async (
			ids: string[],
			relatedCollectionSlug: string
		): Promise<PaginatedDocs<FetchedImageDoc> | null> => {
			if (!ids.length) {
				return null;
			}

			const query: {
				[key: string]: unknown;
				where: Where;
			} = {
				draft: true,
				limit: ids.length,
				override: true,
				where: {
					and: [
						{
							id: {
								in: ids
							}
						}
					]
				},
				depth: 1
			};

			const response = await fetch(
				`${serverURL}/api/${relatedCollectionSlug}`,
				{
					body: stringify(query),
					credentials: "include",
					headers: {
						"Content-Type": "application/x-www-form-urlencoded",
						"X-HTTP-Method-Override": "GET"
					},
					method: "POST"
				}
			);
			if (response.ok) {
				const json = (await response.json()) as PaginatedDocs<FetchedImageDoc>;
				const sortedDocs = ids.flatMap(
					(id) =>
						json.docs.find((doc) => {
							return String(doc.id) === String(id);
						}) || []
				);

				return {...json, docs: sortedDocs};
			}

			return null;
		},
		[serverURL]
	);
	const onUploadSuccess = useCallback(
		(newDocs: FetchedImageDoc[], fallback: string) => {
			const firstDoc = newDocs[0];
			if (firstDoc) {
				onChange(firstDoc, fallback);

				setPopulatedDocs([
					{
						relationTo: activeRelationTo,
						value: firstDoc
					}
				]);
			}
		},
		[onChange, activeRelationTo, setPopulatedDocs]
	);
	const doUpload = useCallback(
		async (file: File, fallback: string) => {
			const formD = new FormData();
			formD.append("file", file);
			formD.append(
				"_payload",
				JSON.stringify({
					...restRef.current,
					source: {
						identifier: restRef.current?.source.identifier || uuidv7(),
						provider: restRef.current?.source.provider || "local",
						link: restRef.current?.source.link || ""
					}
				})
			);
			setStatus("uploading");
			try {
				const response = await fetch(`${serverURL}/api/${relationTo}`, {
					method: "POST",
					body: formD,
					credentials: "include"
				});
				if (response.ok) {
					const json = await response.json();
					/*
					 onUploadSuccess([json.doc], fallback);*/
					setStatus("idle");
					return json.doc as FetchedImageDoc;
				}
				throw new Error("Failed to upload image");
			} catch (e) {
				errorToast("Welp, something went wrong. Try again?");
				console.log(e);
				setStatus("failed");
				return null;
			}
		},
		[relationTo, serverURL, setStatus]
	);
	const onLocalFileSelection = useCallback(
		(fileList?: FileList, fallback?: string) => {
			let fileListToUse = fileList;
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
					fileListToUse = dataTransfer.files;

					setInsertedFile(file);
					setImage(URL.createObjectURL(file));
					restRef.current = {
						caption: `Image by @${userName}`,
						alt: "An image for a content",
						source: {
							identifier: uuidv7(),
							provider: "local",
							link: ""
						}
					};
					setMenuOpen(false);
					setInserted(true);
				} else {
					errorToast("File is not an image");
				}
			}
		},
		[userName]
	);

	useEffect(() => {
		if (insertedFile) {
			doUpload(insertedFile, "").then((r) => {
				onChange(r, "", true);
			});
		}
	}, [doUpload, insertedFile, onChange]);
	/*
	 *   const onDocCreate = useCallback(
	 *     (data: { doc?: ImageBaseSelect }) => {
	 *       if (data.doc && data.doc !== undefined) {
	 *         const d = data.doc;
	 *         setPopulatedDocs((currentDocs) => [
	 *           ...(currentDocs || []),
	 *           {
	 *             relationTo: activeRelationTo,
	 *             value: d
	 *           }
	 *         ]);

	 *         onChange(d, urlValue);
	 *       }
	 *     },
	 *     [activeRelationTo, onChange, urlValue]
	 *   );*/
	const insertCallback = useCallback(async () => {
		try {
			const us = unsplashFallback.current;
			if (!us) {
				errorToast("Failed to fetch image from Unsplash");
				return;
			}
			const imageResponse = await fetch(us.form.url);
			if (!imageResponse.ok) {
				errorToast("Failed to fetch image from Unsplash");
				return;
			}
			const blob = await imageResponse.blob();
			const file = new File(
				[blob],
				`unsplash-${us.form.source.identifier}.jpg`,
				{
					type: blob.type || "image/jpeg"
				}
			);
			if (file.size > Number(process.env.NEXT_PUBLIC_IMAGE_MAX_FILE_SIZE)) {
				errorToast("Image is too large, please try again");
				return;
			}
			setInsertedFile(file);
			setImage({
				height: us.fallback.height,
				width: us.fallback.width,
				url: us.fallback.url,
				alt: us.form.alt,
				src: us.fallback.src,
				blurDataUrl: us.fallback.blurDataUrl,
				darkmode: false,
			});
			restRef.current = {
				caption: us.form.caption,
				alt: us.form.alt,
				source: us.form.source
			};
			setInserted(true);
		} catch (error) {
			console.error("Error uploading random Unsplash image:", error);
			errorToast("Failed to upload random image. Please try again.");
		}
	}, []);
	const onListSelect = useCallback<NonNullable<ListDrawerProps["onSelect"]>>(
		async ({collectionSlug, doc}) => {
			console.log("onListSelect: ", collectionSlug, doc);

			setPopulatedDocs((currentDocs) => {
				if (doc) {
					return [
						{
							relationTo: activeRelationTo,
							value: doc as FetchedImageDoc
						}
					];
				}
				return currentDocs;
			});
			if (doc) {
				onChange(doc as FetchedImageDoc);
			}
			closeListDrawer();
		},
		[closeListDrawer, onChange, activeRelationTo]
	);
	const reloadDoc = useCallback(
		async (docID: string, collectionSlug: ImageCollectionSlug) => {
			const docs = await populateDocs([docID], "media").then((r) => {
				if (r) {
					return r.docs;
				} else {
					return [] as PaginatedDocs["docs"];
				}
			});

			if (docs[0]) {
				setPopulatedDocs((currentDocs) => {
					const existingDocIndex =
						(
							currentDocs as Array<{
								relationTo: CollectionSlug;
								value:
									| string
									| DataFromCollectionSlug<CollectionSlug>
									| ({
									isPlaceHolder?: boolean;
								} & any);
							}>
						)?.findIndex((doc) => {
							const hasExisting =
								doc.value?.id === docs[0].id || doc.value?.isPlaceholder;
							return hasExisting && doc.relationTo === collectionSlug;
						}) ?? -1;
					if (existingDocIndex > -1) {
						const updatedDocs = [...(currentDocs || [])];
						updatedDocs[existingDocIndex] = {
							relationTo: collectionSlug as ImageCollectionSlug,
							value: docs[0] as FetchedImageDoc
						};

						return updatedDocs;
					}
				});
			}
		},
		[populateDocs]
	);
	/*
	 * const onRemove = useCallback(
	 *   (newValue?: PopulatedDocs) => {
	 *     const newValueIDs = newValue
	 *       ? newValue.map(({ value }) => value.id)
	 *       : null;
	 *     onChange(newValueIDs ? newValueIDs[0] : null, "");
	 *     setPopulatedDocs(newValue ? newValue : []);
	 *   },
	 *   [onChange]
	 * );*/
	const imageRemove = useCallback(
		async (id?: string | null) => {
			if (!id) {
				onChange(null);
				return;
			}
			await fetch(`${serverURL}/api/${relationTo}/${id}`, {
				method: "DELETE",
				credentials: "include"
			})
				.then((r) => {
					if (r.ok) {
						onChange(null);
					}
				})
				.catch((r) => {
					console.log(r);
					errorToast("Failed to remove image");
				});
		},
		[onChange, relationTo, serverURL]
	);
	const onClickRemove = useCallback(() => {
		onChange(null);
		setMenuOpen(false);
	}, [onChange]);
	useEffect(() => {
		async function loadInitialDocs() {
			if (initIdValue) {
				loadedValueDocsRef.current = true;
				const loadedDocs = await populateDocs(
					Array.isArray(initIdValue) ? initIdValue : [initIdValue],
					"userMedia"
				);
				if (loadedDocs) {
					setPopulatedDocs(
						loadedDocs.docs.map((doc) => ({
							relationTo: activeRelationTo,
							value: doc as FetchedImageDoc
						}))
					);
				}
			}
		}

		if (!loadedValueDocsRef.current) {
			void loadInitialDocs();
		}
	}, [populateDocs, activeRelationTo, initIdValue]);
	/* setWantInsert((r) => !r);*/
	const handleDragEnter: DragEventHandler<HTMLDivElement> = useCallback((e) => {
		e.preventDefault();
		e.stopPropagation();
		setDragging(true);
	}, []);

	const handleDragLeave: DragEventHandler<HTMLDivElement> = useCallback((e) => {
		e.preventDefault();
		e.stopPropagation();
		setDragging(false);
	}, []);
	const handleDrop: DragEventHandler<HTMLDivElement> = useCallback(
		(e) => {
			e.preventDefault();
			e.stopPropagation();
			setDragging(false);
			if (e.dataTransfer) {
				if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
					onLocalFileSelection(
						e.dataTransfer.files,
						(image && (typeof image === "string" ? image : image.url)) || ""
					);
					setDragging(false);

					e.dataTransfer.clearData();
				}
			}
		},
		[onLocalFileSelection, image]
	);
	const setCursor = useCursor((r) => r.setCursorState);
	const lastPosition = useRef<number>(0);

	const onDrag = useCallback(
		(e: PointerEvent) => {
			const yP = e.clientY;
			const distance =
				((yP - lastPosition.current) / window.innerHeight / 2) * 100;
			const yD = clamp(0, translateY.get() + distance, 100);
			translateY.set(yD);
			transformPosition.set(`center ${yD}%`);
			lastPosition.current = yP;
		},
		[transformPosition, translateY]
	);
	const endDrag = useCallback(
		(e: PointerEvent) => {
			e.preventDefault();
			document.documentElement.removeAttribute("data-dragging");
			setDragging(false);
			setCursor(null);
		},
		[setCursor]
	);

	const startDrag: PointerEventHandler = useCallback(
		(event) => {
			event.preventDefault();
			setDragging(true);
			const pY = event.clientY;
			lastPosition.current = pY;
			document.body.addEventListener("pointermove", onDrag);
			document.body.addEventListener("pointerup", endDrag, {once: true});
			document.documentElement.setAttribute("data-dragging", "true");
		},
		[endDrag, onDrag]
	);
	const resetPositions = useCallback(
		(position = 35) => {
			setPositionY(position);
			setRepositioning(false);
			translateY.set(position);
			transformPosition.set(`center ${position}%`);
			document.body.removeEventListener("pointerup", finishRepositionClick);
		},
		[finishRepositionClick, setPositionY, transformPosition, translateY]
	);

	const [imageIsReady, setImageIsReady] = useState(
		Boolean(image && typeof image === "object" && image.width && image.height)
	);
	const [galleryFetchEnabled, setGalleryFetchEnabled] = useState(false);
	useEffect(() => {
		setGalleryFetchEnabled(
			menuOpen && !repositioning && openedTab === "gallery"
		);
		return () => {
			setGalleryFetchEnabled(false);
		};
	}, [menuOpen, openedTab, repositioning]);
	const {
		fetchNextPage,
		isEnabled,
		isError,
		isFetching,
		isFetchingNextPage,
		data
	} = useGalleryFetch(galleryFetchEnabled);
	const finishReposition: PointerEventHandler = useCallback(
		(e) => {
			const imageEL = imageRef.current;
			e.stopPropagation();
			e.preventDefault();
			setDragging(false);
			if (!imageEL) {
				setRepositioning(false);
				return;
			}

			setRepositioning(false);
			setPositionY(translateY.get());
		},
		[setPositionY, translateY]
	);
	const revertReposition: PointerEventHandler = useCallback(
		(e) => {
			const imageEL = imageRef.current;
			e.stopPropagation();
			e.preventDefault();
			setDragging(false);
			if (!imageEL) {
				setRepositioning(false);
				return;
			}
			setRepositioning(false);
			resetPositions(lastConfirmedYPosition.get());
		},
		[lastConfirmedYPosition, resetPositions]
	);
	useEffect(() => {
		setImageIsReady(
			Boolean(image && typeof image === "object" && image.width && image.height)
		);
		!image && resetPositions();
	}, [image, resetPositions]);
	const isDragging = useRef(dragging);
	useEffect(() => {
		isDragging.current = dragging;

		if (!dragging) {
			document.body.addEventListener("pointerup", finishRepositionClick, {
				once: true
			});
			document.body.removeEventListener("pointermove", onDrag);

			lastPosition.current = (window.innerHeight * translateY.get()) / 100;
		}
	}, [dragging, endDrag, finishRepositionClick, onDrag, translateY]);

	const handleDragOver: DragEventHandler<HTMLDivElement> = useCallback((e) => {
		e.preventDefault();
		e.stopPropagation();
	}, []);

	const handlePaste: ClipboardEventHandler<HTMLDivElement> = useCallback(
		(e) => {
			e.preventDefault();
			e.stopPropagation();

			if (e.clipboardData?.files && e.clipboardData.files.length > 0) {
				onLocalFileSelection(
					e.clipboardData.files,
					(image && (typeof image === "string" ? image : image.url)) || ""
				);
			}
		},
		[onLocalFileSelection, image]
	);
	const imageFilePaste = useCallback(
		(e: ChangeEvent<HTMLInputElement>) => {
			if (e.target.files) {
				onLocalFileSelection(
					e.target.files,
					(image && (typeof image === "string" ? image : image.url)) || ""
				);
			}
		},
		[image, onLocalFileSelection]
	);
	return (
		<m.div
			className={cn(
				"relative flex min-h-14 w-full shrink-0 grow-0 flex-col items-center bg-transparent",
				hover ? "z-140" : "z-10"
			)}
			ref={imageRef}
			style={{
				paddingTop: "1rem",
				transform: "translateY(0px)",
				isolation: "isolate",
				marginBottom: inserted ? "1rem" : 0
			}}
			onMouseEnter={() => setHover(true)}
			onMouseLeave={() => setHover(false)}
			data-inserted={inserted}
		>
			<AnimatePresence mode="popLayout" initial={false}>
				{inserted ? (
					<m.div
						className={
							"relative mb-[1em] flex h-[30vh] max-h-[280px] w-full items-center justify-center overflow-hidden bg-faded-background/10 transition-all duration-200 ease-out-power2"
						}
					>
						{imageIsReady && (
							<m.div
								initial={{
									visibility: "hidden",

									opacity: 0
								}}
								animate={{
									visibility: "visible",

									opacity: 1,
									transition: {
										duration: 0.2,
										ease: EASING.power3.in
									}
								}}
								exit={{
									visibility: "hidden",

									opacity: 0,
									transition: {
										duration: 0.2,
										ease: EASING.power3.out
									}
								}}
								className={cn(
									"relative min-h-full w-full overflow-hidden rounded-[6px]"
								)}
							>
								<div
									className={cn(
										"absolute inset-0 z-10 transition-[backdrop-filter] delay-50 duration-200 ease-out-power4",
										!repositioning &&
										hover &&
										"backdrop-blur-sm backdrop-brightness-80"
									)}
									style={{
										objectFit: "cover"
									}}
								/>
								<m.figure className={"m-0"}>
									<picture>
										<NextImage
											alt={""}
											className={
												"absolute inset-0 block max-h-[200px] min-h-[30vh] w-full object-cover"
											}
											dragListener={false}
											width={(image as FetchedImage)!.width!}
											height={(image as FetchedImage)!.height!}
											priority={false}
											quality={100}
											unoptimized={true}
											src={(image as FetchedImage).url!}
											style={{
												objectPosition: transformPosition
											}}
										/>
									</picture>

									{image &&
										typeof image === "object" &&
										"alt" in image &&
										typeof image.alt === "string" && (
											<figcaption
												data-dark={typeof image.darkmode === "boolean"
													? image.darkmode : false}
												className={cn(
													"right-[.5em] bottom-[.05em] flex h-[1em] w-full items-center justify-end bg-transparent p-[1.5em] underline",
													"text-foreground"
												)}
											>
												{image.alt}
											</figcaption>
										)}
								</m.figure>
							</m.div>
						)}
						<AnimatePresence mode="sync" initial={false}>
							{repositioning ? (
								<>
									<m.div
										key={"repositioningButton"}
										onPointerDown={startDrag}
										className={cn(
											"absolute inset-0 flex items-center justify-center gap-[8px] bg-transparent"
										)}
										initial={{
											opacity: 0,
											zIndex: -1
										}}
										exit={{
											opacity: [0, 0],
											zIndex: [null, -1],
											transition: {
												type: "tween",
												ease: EASING.power2.out,
												duration: 0.3
											}
										}}
										animate={{
											opacity: [0, 1],
											zIndex: [100, 100],
											transition: {
												type: "tween",
												ease: EASING.power2.out,
												duration: 0.3
											}
										}}
										transition={{
											type: "tween",
											duration: 0.3,
											ease: EASING.power2.out
										}}
									>
										<m.div
											className={
												"flex w-fit items-center rounded-[6px] bg-button-background px-1 shadow-sm/30"
											}
											data-themed="background-color, box-shadow"
										>
											<div
												className={cn(
													"flex h-10 min-w-0 shrink-0 items-center bg-transparent px-[6px] py-[4px] text-sm leading-[1.2] whitespace-nowrap text-muted-faded-background/80 transition-colors duration-200 ease-out-power2 select-none"
												)}
												aria-label="Reposition cover"
											>
												Reposition cover image
											</div>
										</m.div>
									</m.div>
									<m.div
										key={"confirmOrCancel"}
										className={cn(
											"absolute top-3 right-4 flex items-center justify-center gap-[8px] bg-transparent"
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
												zIndex: [155, 155],
												opacity: [0, 1],
												transition: {
													type: "tween",
													ease: EASING.power2.out,
													duration: 0.3
												}
											}
										}}
										initial={{
											zIndex: 0,
											opacity: 0
										}}
										exit="animate"
										animate={"hover"}
									>
										<m.div
											className={
												"flex w-fit items-center rounded-[6px] bg-faded-background/30 shadow-md"
											}
										>
											<div
												className={cn(
													"flex h-10 min-w-0 shrink-0 items-center overflow-hidden rounded-l-sm rounded-r-[2px] bg-faded-foreground/10 px-[8px] py-[4px] leading-[1.2] text-foreground/80 transition-colors duration-200 ease-out-power3 select-none hover:bg-faded-foreground/70 hover:text-background/60"
												)}
												onPointerDown={revertReposition}
												data-themed={"color, background-color, border-color"}
												role="button"
												aria-label="Cancel update"
											>
												Cancel
											</div>
											<div
												onPointerDown={finishReposition}
												role="button"
												aria-label="Confirm reposition"
												data-themed={"color, background-color, border-color"}
												style={{
													flexShrink: 0,
													lineHeight: "1.2",
													minWidth: "0px"
												}}
												className="flex h-10 min-w-0 shrink-0 overflow-hidden rounded-l-[2px] rounded-r-sm bg-faded-foreground/10 px-[8px] py-[4px] leading-[1.2] text-foreground/80 transition-colors duration-200 ease-out-power3 select-none hover:bg-faded-foreground/70 hover:text-background/60"
											>
												<div className={"text-sm leading-normal"}>
													Save position
												</div>
											</div>
										</m.div>
									</m.div>
								</>
							) : (
								<m.div
									key={"changeCoverButton"}
									className={cn(
										"absolute top-3 right-4 flex items-center justify-center gap-[8px] bg-transparent"
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
									animate={hover ? "hover" : "animate"}
								>
									<m.div
										className={
											"flex w-fit items-center rounded-[6px] bg-faded-background/30 shadow-md"
										}
									>
										<div
											className={cn(
												"flex h-10 min-w-0 shrink-0 overflow-hidden rounded-l-sm rounded-r-[2px] bg-faded-foreground/10 px-[8px] py-[4px] leading-[1.2] text-foreground/80 transition-colors duration-200 ease-out-power3 select-none",
												menuOpen
													? "pointer-events-none"
													: "hover:bg-faded-foreground/70 hover:text-background/60"
											)}
											data-themed={"color, background-color, border-color"}
											role="button"
											aria-label="Update the image"
										>
											<Menu.Root open={menuOpen} onOpenChange={setMenuOpen}>
												<Menu.Trigger
													data-themed={"border-color, color, background-color"}
													disabled={repositioning}
													className={
														"border-r-solid-[.5px]! flex appearance-none items-center justify-center border-none bg-transparent p-0 text-sm! leading-[1.3] font-normal text-inherit! shadow-none transition-colors duration-200 ease-out-power3 outline-none select-none"
													}
												>
													Change cover
												</Menu.Trigger>
												<Menu.Portal>
													<Menu.Positioner
														className="outline-none"
														sideOffset={14}
														align={"end"}
														alignOffset={-78}
													>
														<MenuPopup
															className="relative max-w-[calc(100vw-24%)] p-0">
															<Tabs.Root
																value={openedTab}
																onValueChange={onOpenTabChange}
																data-themed={
																	"border-color, color, background-color"
																}
																className={
																	"relative w-[540px] max-w-[calc(100vw-24%)] rounded-lg bg-muted-faded-background/10 px-1 pt-0 pb-4 outline outline-muted-faded-foreground/20 backdrop-blur-sm dark:outline-muted-faded-foreground/40!"
																}
																defaultValue={"gallery"}
															>
																<div
																	className={
																		"flex w-full items-center justify-between px-4 shadow-[inset_0_-1px] shadow-muted-faded-foreground/20"
																	}
																	data-themed={
																		"border-color, color, background-color,box-shadow"
																	}
																>
																	<Tabs.List
																		className={
																			"rounded-0 rounded-0 relative flex shrink-0 grow items-center gap-1 px-1 py-2 text-sm!"
																		}
																	>
																		<Tabs.Tab
																			className={
																				"appearance-none border-none bg-transparent px-[8px] py-[4px] break-keep whitespace-nowrap text-muted-faded-foreground/50 transition-colors duration-250 ease-out-power3 outline-none before:inset-x-0 before:inset-y-1 before:rounded-sm before:-outline-offset-1 hover:text-muted-faded-foreground focus-visible:relative focus-visible:before:absolute focus-visible:before:outline-1 data-selected:text-foreground"
																			}
																			data-themed={
																				"color, background-color, border-color, outline-color"
																			}
																			value="gallery"
																		>
																			Gallery
																		</Tabs.Tab>
																		<Tabs.Tab
																			className={
																				"appearance-none border-none bg-transparent px-[8px] py-[4px] break-keep whitespace-nowrap text-muted-faded-foreground/40 transition-colors duration-250 ease-out-power3 outline-none before:inset-x-0 before:inset-y-1 before:rounded-sm before:-outline-offset-1 hover:text-muted-faded-foreground focus-visible:relative focus-visible:before:absolute focus-visible:before:outline-1 data-selected:text-foreground"
																			}
																			data-themed={
																				"color, background-color, border-color, outline-color"
																			}
																			value="upload"
																		>
																			Upload
																		</Tabs.Tab>
																		<Tabs.Tab
																			className={
																				"appearance-none border-none bg-transparent px-[8px] py-[4px] break-keep whitespace-nowrap text-muted-faded-foreground/40 transition-colors duration-250 ease-out-power3 outline-none before:inset-x-0 before:inset-y-1 before:rounded-sm before:-outline-offset-1 hover:text-muted-faded-foreground focus-visible:relative focus-visible:before:absolute focus-visible:before:outline-1 data-selected:text-foreground"
																			}
																			data-themed={
																				"color, background-color, border-color, outline-color"
																			}
																			value="unsplash"
																		>
																			Unsplash
																		</Tabs.Tab>
																		<Tabs.Indicator
																			className="absolute -bottom-px left-0 z-[-1] h-px w-(--active-tab-width) translate-x-(--active-tab-left) -translate-y-1/2 overflow-hidden rounded-[0.25px] bg-radial/oklch from-foreground from-87% via-foreground/85 via-95% to-foreground/10 to-100% transition-all duration-200 ease-in-out"
																			data-themed={
																				"color, background-color, border-color, outline-color"
																			}
																		/>
																	</Tabs.List>
																	<button
																		onClick={onClickRemove}
																		className="relative h-fit w-22 appearance-none rounded-md border! border-muted-faded-foreground/0 bg-transparent px-2 py-0 break-keep whitespace-nowrap text-muted-faded-foreground/60 transition-colors duration-300 ease-out-power2! before:inset-x-0 hover:border-muted-faded-foreground/80 hover:text-muted-faded-foreground"
																	>
																		Remove
																	</button>
																</div>
																<Tabs.Panel
																	className={
																		"relative flex h-32 items-center justify-center -outline-offset-1 data-hidden:hidden"
																	}
																	value="gallery"
																>
																	<div className={""}>
																		{isFetching ? (
																			<div>Loading...</div>
																		) : (
																			(isError &&
                                                                                <div>WTF?</div>) || <></>
																		)}
																	</div>
																</Tabs.Panel>
																<Tabs.Panel
																	className={
																		"relative flex h-32 items-center justify-center -outline-offset-1 data-hidden:hidden"
																	}
																	value="upload"
																>
																	<m.span
																		className={cn(
																			"relative flex h-14 w-3/4 items-center justify-center rounded-[35px] border border-solid border-muted-faded-foreground/80 p-5 px-3.5 py-1 text-center! leading-normal text-faded-foreground/90 transition-[z-index,opacity,border-color,background-color,color] duration-200 ease-out-power2 hover:border-muted-faded-foreground/30 hover:bg-faded-foreground hover:text-faded-background"
																		)}
																		data-themed={
																			"opacity,border-color,background-color,color"
																		}
																		role="button"
																	>
																		<input
																			id={"user_settings_photo_file"}
																			name={"user_settings[photo][file]"}
																			className={cn(
																				"absolute! inset-0 z-10 h-full w-full cursor-none! overflow-hidden opacity-0"
																			)}
																			onChange={imageFilePaste}
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
																</Tabs.Panel>
																<Tabs.Panel
																	className={
																		"relative flex h-32 shrink-0 grow-0 items-center justify-center -outline-offset-1 data-hidden:hidden"
																	}
																	value="unsplash"
																></Tabs.Panel>
															</Tabs.Root>
														</MenuPopup>
													</Menu.Positioner>
												</Menu.Portal>
											</Menu.Root>
										</div>
										<div
											onPointerDown={onRepositionClick}
											role="button"
											aria-label="Change image alignment"
											data-themed={"color, background-color, border-color"}
											className="flex h-10 min-w-0 shrink-0 items-center overflow-hidden rounded-l-[2px] rounded-r-sm bg-faded-foreground/10 px-[8px] py-[4px] text-sm! leading-normal text-foreground/80 transition-colors duration-200 ease-out-power3 select-none hover:bg-faded-foreground/70 hover:text-background/60"
										>
											Reposition
										</div>
									</m.div>
								</m.div>
							)}
						</AnimatePresence>
					</m.div>
				) : (
					<m.div
						onDragEnter={handleDragEnter}
						onDragOver={handleDragOver}
						onDragLeave={handleDragLeave}
						onDrop={handleDrop}
						onMouseEnter={() => setHover(true)}
						onMouseLeave={() => setHover(false)}
						onPaste={handlePaste}
						className={
							"field-type cover-image image-cover-insert__wrap relative mb-[1em] flex h-[4vh] max-h-[280px] items-center justify-center overflow-hidden transition-all duration-200 ease-out-power3"
						}
						style={{
							marginBottom: 0,

							backgroundColor: "transparent"
						}}
					>
						<m.div
							style={{
								gridColumn: "content",

								margin: 0,
								height: "100%",

								maxHeight: "5vh"
							}}
							variants={{
								animate: {
									opacity: 1
								},
								idle: {
									opacity: 0
								}
							}}
							initial={"idle"}
							animate={visible ? "animate" : "idle"}
							transition={{
								type: "tween",
								ease: EASING.power3.out
							}}
						>
							<AnimatePresence mode="popLayout">
								{wantInsert ? (
									<m.div
										style={{
											height: "100%",
											justifyContent: "flex-start",
											display: "flex",
											alignItems: "flex-end"
										}}
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
									>
										<m.span>/</m.span>
										<m.span
											className={`upload__listToggler ease rounded-xl border border-solid border-[currentColor] px-3.5 py-1 text-sm! leading-normal transition-colors duration-200 ease-out-power2 hover:border-off-background hover:bg-off-foreground hover:text-off-background`}
											onClick={openListDrawer}
											role="button"
										>
											Choose from library
										</m.span>
									</m.div>
								) : (
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
									>
										<m.span
											className={cn(
												"ease relative rounded-xl border border-solid border-[currentColor] p-5 px-3.5 py-1 text-center text-sm! leading-normal! transition-[z-index,opacity,border-color,background-color,color] duration-200 ease-out-power2 hover:border-off-background hover:bg-off-foreground hover:text-off-background"
											)}
											role="button"
											onClick={insertCallback}
										>
											Add Cover
										</m.span>
									</m.div>
								)}
							</AnimatePresence>
						</m.div>
					</m.div>
				)}
			</AnimatePresence>

			<ListDrawer
				allowCreate={true}
				enableRowSelections={false}
				onSelect={onListSelect}
			/>
		</m.div>
	);
};
