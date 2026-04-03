"use client";
import type { ImageCollectionOverview } from "@/components/core/Media/types";

import { EASING } from "@/constants/animations";
import useImageDarkmode from "@/hooks/useImageDarkmode";
import { cn } from "@/lib/utils";
import {
  FetchedUnsplashImage,
  UnsplashFetchResult
} from "@/types/ImageCollections/unsplash";
import { errorToast } from "@/payload/components/sonner";
import { useCourier } from "@/payload/elements/DocumentFields/RP_CourierProvider";
import { useAltDocCtrls } from "@/payload/providers/Admins";
import { useCursor } from "@/providers/RP_Pro";
import { useTheme } from "@/providers/Theme";
import {
  ArticleCoverProps,
  FetchedImage,
  FetchedImageDoc,
  ImageCollectionSlug,
  ProcessedImage,
  RalueAsDataWithRelation,
  RalueWithRelation
} from "@/types/collections/image-collections";
import type { DocWithId, PayloadFindFetch } from "@/types/payload-api-helpers";
import { clamp } from "@/utilities/mathUtilities";
import {
  type ListDrawerProps,
  useAuth,
  useBulkUpload,
  useDocumentDrawer,
  useField,
  useListDrawer,
  useLocale,
  useTranslation
} from "@payloadcms/ui";
import type { BulkUploadContext } from "@payloadcms/ui/elements/BulkUpload";
import { normalizeRelationshipValue } from "@payloadcms/ui/utilities/normalizeRelationshipValue";
import {
  AnimatePresence,
  type MotionValue,
  useMotionValue
} from "motion/react";
import * as m from "motion/react-m";
import Image from "next/image";
import type { FilterOptionsResult, ValueWithRelation } from "payload";
import { stringify } from "qs-esm";
import type {
  ChangeEvent,
  ChangeEventHandler,
  ClipboardEventHandler,
  DragEventHandler,
  MouseEventHandler,
  PointerEventHandler
} from "react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { uuidv7 } from "uuidv7";
import { useShallow } from "zustand/shallow";
import { CoverMenu } from "./Components/CoverMenu";
import { RepositionButton } from "./RepositionButton";

const NextImage = m.create(Image);

export const CoverImageClient = (props: ArticleCoverProps) => {
  const {
    allowCreate = false,
    filterOptions: filterOptionsFromProps,
    relationTo,
    path,
    validate,
    readOnly,
    required,
    hasMany,
    fallback,
    value: initValue,
    serverURL,
    user
  } = props;

  const attemptCount = useRef(0);
  const { value, setValue } = useField<{
    relationTo: ImageCollectionSlug;
    value: string;
  }>({
    path
  });
  const {
    drawerSlug,
    setCollectionSlug,
    setInitialFiles,
    setMaxFiles,
    setOnSuccess,
    setSelectableCollections
  } = useBulkUpload();
  const userName = useMemo(() => user.name, [user]);
  const unsplashFallback = useRef<UnsplashFetchResult>(fallback || null);
  const [wantInsert, setWantInsert] = useState(false);
  const { value: positionY, setValue: setPositionY } = useField<number>({
    path: "coverPosition"
  });
  const translateY = useMotionValue(positionY);
  const transformPosition = useMotionValue(`center ${translateY.get()}%`);
  const imageRef = useRef<HTMLDivElement>(null!);
  const [insertedFile, setInsertedFile] = useState<File | null>(null);
  // const insertedFile = useDarkRoom(r => r.file)

  const [enabled, setEnabled] = useState(true);
  const altDocShown = useAltDocCtrls(useShallow((r) => r.peeked));

  const { permissions } = useAuth();
  const [image, setImage] = useState<string | ProcessedImage | null>(
    (initValue?.value &&
      typeof initValue.value?.url === "string" && {
        alt: initValue.value.alt,
        darkmode: initValue.value.darkmode,
        height: initValue.value.height,
        width: initValue.value.width,

        src: initValue.value.src || (initValue.value.url as string),
        url: initValue.value.url as string
      }) ||
      null
  );
  const [dragging, setDragging] = useState(false);
  const [inserted, setInserted] = useState<boolean>(Boolean(!!image));
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

  const [activeRelationTo] = useState<ImageCollectionSlug>(
    Array.isArray(relationTo) ? relationTo[0] : relationTo
  );

  // This will be used by the bulk upload to allow you to select only collections you have create permissions for
  const collectionSlugsWithCreatePermission = useMemo(() => {
    if (Array.isArray(relationTo)) {
      return relationTo.filter(
        (relation) =>
          permissions?.collections &&
          permissions.collections?.[relation]?.create
      );
    }
    return [];
  }, [relationTo, permissions]);

  const filterOptions: FilterOptionsResult = useMemo(() => {
    const isPoly = Array.isArray(relationTo);

    if (!value) {
      return filterOptionsFromProps || {};
    }

    // Group existing IDs by relation
    const existingIdsByRelation: Record<string, (number | string)[]> = {};

    const values = Array.isArray(value) ? value : [value];

    for (const val of values) {
      if (isPoly && typeof val === "object" && "relationTo" in val) {
        // Poly upload - group by relationTo
        if (!existingIdsByRelation[val.relationTo]) {
          existingIdsByRelation[val.relationTo] = [];
        }
        existingIdsByRelation[val.relationTo].push(val.value);
      } else if (!isPoly) {
        // Non-poly upload - all IDs belong to the single collection
        const collection = relationTo;
        if (!existingIdsByRelation[collection]) {
          existingIdsByRelation[collection] = [];
        }
        const id = typeof val === "object" && "value" in val ? val.value : val;
        if (typeof id === "string" || typeof id === "number") {
          existingIdsByRelation[collection].push(id);
        }
      }
    }

    // Build filter options for each collection
    const newFilterOptions = { ...filterOptionsFromProps };
    const relations = isPoly ? relationTo : [relationTo];

    relations.forEach((relation) => {
      const existingIds = existingIdsByRelation[relation] || [];

      newFilterOptions[relation] = {
        ...((filterOptionsFromProps?.[relation] as any) || {}),
        id: {
          ...((filterOptionsFromProps?.[relation] as any)?.id || {}),
          not_in: (
            (filterOptionsFromProps?.[relation] as any)?.id?.not_in || []
          ).concat(existingIds)
        }
      };
    });

    return newFilterOptions;
  }, [value, filterOptionsFromProps, relationTo]);

  const setStatus = useCourier((r) => r.setStatus);
  const { code } = useLocale();
  const { i18n, t } = useTranslation();
  const [menuOpen, setMenuOpen] = useState(false);

  const onChange = useCallback(
    async (newValue: RalueAsDataWithRelation | null) => {
      attemptCount.current = attemptCount.current + 1;
      const v = newValue?.value;
      if (!newValue || !v || !v.url || typeof v.url !== "string") {
        setInserted(false);

        setImage(null);
        setValue(null);
        if (attemptCount.current > 3) {
          attemptCount.current = 0;
          setStatus("idle");
          errorToast("Something's wrong with the image... Removed the file");
        }
      } else {
        setInserted(true);
        attemptCount.current = 0;
        setValue({
          relationTo: newValue.relationTo,
          value: newValue.value.id
        });
        const darkmode = v.darkmode || false,
          alt = v.alt || "";
        setImage({
          ...v,
          darkmode,
          alt,
          url: v.url as string
        });
      }
    },
    [setValue, setStatus]
  );
  const [
    ListDrawer,
    ,
    { closeDrawer: closeListDrawer, openDrawer: openListDrawer }
  ] = useListDrawer({
    collectionSlugs: Array.isArray(relationTo) ? relationTo : [relationTo],
    filterOptions
  });
  const [
    CreateDocDrawer,
    ,
    { closeDrawer: closeCreateDocDrawer, openDrawer: openCreateDocDrawer }
  ] = useDocumentDrawer({
    collectionSlug: activeRelationTo
  });
  /**
   * Track the last loaded value to prevent unnecessary reloads
   */
  const loadedValueRef = useRef<
    | (number | string)[]
    | null
    | number
    | string
    | ValueWithRelation
    | ValueWithRelation[]
  >(null);
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
  const valueIdRef = useRef<null | string>(value?.value || null);
  useEffect(() => {
    valueIdRef.current = value?.value || null;
  }, [value]);
  const populateDocs = useCallback(
    async (items: RalueWithRelation[]): Promise<RalueAsDataWithRelation[]> => {
      if (!items?.length) {
        return [];
      }
      // 1. Group IDs by collection
      const grouped: Record<string, (number | string)[]> = {};
      items.forEach(({ relationTo, value }) => {
        if (!grouped[relationTo]) {
          grouped[relationTo] = [];
        }
        // Ensure we extract the actual ID value, not an object
        let idValue: number | string = value;

        if (value && typeof value === "object" && "value" in (value as any)) {
          idValue = (value as any).value;
        }

        grouped[relationTo].push(idValue);
      });

      // 2. Fetch per collection
      const fetches = Object.entries(grouped).map(async ([collection, ids]) => {
        const query = {
          depth: 0,
          draft: true,
          limit: ids.length,
          locale: code,
          where: {
            and: [
              {
                id: {
                  in: ids
                }
              }
            ]
          }
        };
        const response = await fetch(`${serverURL}/api/${collection}`, {
          body: stringify(query),
          credentials: "include",
          headers: {
            "Accept-Language": i18n.language,
            "Content-Type": "application/x-www-form-urlencoded",
            "X-Payload-HTTP-Method-Override": "GET"
          },
          method: "POST"
        });
        let docs: DocWithId[] = [];
        if (response.ok) {
          const data = (await response.json()) as PayloadFindFetch<DocWithId>;
          docs = data.docs;
        }
        // Map docs by ID for fast lookup
        const docsById = docs.reduce(
          (acc, doc) => {
            acc[doc.id] = doc;
            return acc;
          },
          {} as { [k: string]: DocWithId }
        );
        return { collection, docsById };
      });

      const results = await Promise.all(fetches);

      // 3. Build lookup
      const lookup: Record<string, Record<string, any>> = {};
      results.forEach(({ collection, docsById }) => {
        lookup[collection] = docsById;
      });

      // 4. Reconstruct in input order, add placeholders if missing
      const sortedDocs = items.map(({ relationTo, value }) => {
        const doc = lookup[relationTo]?.[value] || {
          id: value,
          filename: `${t("general:untitled")} - ID: ${value}`,
          isPlaceholder: true
        };
        return { relationTo, value: doc };
      });

      return sortedDocs;
    },
    [serverURL, code, i18n.language, t]
  );

  const normalizeValue = useCallback(
    (
      value: FetchedImageDoc
    ): {
      relationTo: ImageCollectionSlug;
      value: string;
    } => normalizeRelationshipValue(value, relationTo),
    [relationTo]
  );
  const doUpload = useCallback(
    async (file: File, fallback: string) => {
      const formD = new FormData();
      formD.append("file", file);
      // formD.append(
      //     "_payload",
      //     JSON.stringify({
      //         ...restRef.current,
      //         source: {
      //             provider: restRef.current?.source.provider || "local",
      //             link: restRef.current?.source.link || ""
      //         }
      //     })
      // );
      setStatus("uploading");
      try {
        const response = await fetch(`${serverURL}/api/${activeRelationTo}`, {
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
    [activeRelationTo, serverURL, setStatus]
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
        }
      }
      if (fileListToUse) {
        setInitialFiles(fileListToUse);
        setImage(URL.createObjectURL(fileListToUse[0]));
        // restRef.current = {
        //     caption: `Image by @${userName}`,
        //     alt: "An image for a content",
        //     source: {
        //         provider: "local",
        //         link: ""
        //     }
        // };
        setMenuOpen(false);
        setInserted(true);
      } else {
        errorToast("File is not an image");
      }
      // Use activeRelationTo for poly uploads, or relationTo as string for single collection
      const collectionToUse = Array.isArray(relationTo)
        ? activeRelationTo
        : relationTo;

      setCollectionSlug(collectionToUse);
      if (Array.isArray(collectionSlugsWithCreatePermission)) {
        setSelectableCollections(collectionSlugsWithCreatePermission);
      }
    },
    [
      relationTo,
      activeRelationTo,
      setCollectionSlug,
      collectionSlugsWithCreatePermission,
      setInitialFiles,
      userName,
      setSelectableCollections
    ]
  );

  // useEffect(() => {
  //     if (insertedFile) {
  //         doUpload(insertedFile, "").then(v => {
  //             if (v) {
  //                 if (typeof v.url === 'string') {
  //                     return {
  //                         ...v,
  //                         url: v.url as string,
  //                         src: v.url as string,
  //                     }
  //                 }
  //             }
  //             return null;
  //         }).then((r) => {
  //             r && onChange({relationTo: activeRelationTo, value: r},) || onChange(null)
  //         });
  //     }
  // }, [doUpload, insertedFile, onChange, activeRelationTo]);
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
      const file = new File([blob], `unsplash-${uuidv7()}.jpg`, {
        type: blob.type || "image/jpeg"
      });
      if (file.size > Number(process.env.NEXT_PUBLIC_IMAGE_MAX_FILE_SIZE)) {
        errorToast("Image is too large, please try again");
        return;
      }
    } catch (error) {
      console.error("Error uploading random Unsplash image:", error);
      errorToast("Failed to upload random image. Please try again.");
    }
  }, []);
  const onFetch = useCallback(
    ({
      file,
      unsplashMeta
    }: {
      file: File;
      unsplashMeta: FetchedUnsplashImage;
    }) => {
      setImage(unsplashMeta.fallback);
      // restRef.current = {
      //     caption: unsplashMeta.form.caption,
      //     alt: unsplashMeta.form.alt,
      //     source: unsplashMeta.form.source
      // };
      setInserted(true);
    },
    []
  );
  const onListSelect = useCallback<NonNullable<ListDrawerProps["onSelect"]>>(
    async ({ collectionSlug: b, doc: c }) => {
      const collectionSlug = b as ImageCollectionSlug;
      const doc = c as ImageCollectionOverview;
      const value = typeof doc.value === "string" ? doc.value : doc.value.id;
      const loadedDocs = await populateDocs([
        { relationTo: collectionSlug, value }
      ]);
      const selectedDoc = loadedDocs?.[0] || null;

      // setPopulatedDocs((currentDocs) => {
      //     if (selectedDoc) {
      //         return [
      //             selectedDoc
      //         ];
      //     }
      //     return currentDocs;
      // });
      // const {id, url, thumbnailURL} = doc;
      // onChange({relationTo: collectionSlug, value: {id, url, thumbnailURL, alt: doc.alt, source: doc.source}});
      closeListDrawer();
    },
    [closeListDrawer, onChange, populateDocs]
  );
  const onUploadSuccess: BulkUploadContext["onSuccess"] = useCallback(
    (uploadedForms) => {
      const isPoly = Array.isArray(relationTo);

      if (hasMany) {
        // const newValues = uploadedForms.map((form) =>
        //   isPoly ? { relationTo: form.collectionSlug, value: form.doc.id } : form.doc.id,
        // )
        // // Normalize existing values before merging
        // const normalizedExisting = Array.isArray(value) ? value.map(normalizeValue) : []
        // const mergedValue = [...normalizedExisting, ...newValues]
        // onChange(mergedValue)
        // setPopulatedDocs((currentDocs) => [
        //   ...(currentDocs || []),
        //   ...uploadedForms.map((form) => ({
        //     relationTo: form.collectionSlug as ImageCollectionSlug,
        //     value: form.doc as ImageBaseSelect,
        //   })),
        // ])
      } else {
        const firstDoc = uploadedForms[0];
        const newValue = isPoly
          ? { relationTo: firstDoc.collectionSlug, value: firstDoc.doc.id }
          : firstDoc.doc.id;
        onChange(newValue);
        // setPopulatedDocs([
        //     {
        //         relationTo: firstDoc.collectionSlug as ImageCollectionSlug,
        //         value: firstDoc.doc as FetchedImage,
        //     },
        // ])
      }
    },
    [onChange, hasMany, relationTo]
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
      if (value) {
        let itemsToLoad: RalueWithRelation[] = [];
        if (
          Array.isArray(relationTo) &&
          typeof value === "object" &&
          "relationTo" in value
        ) {
          // For poly uploads, value should already be in the format { relationTo, value }
          const values = Array.isArray(value) ? value : [value];
          itemsToLoad = values
            .filter(
              (v): v is RalueWithRelation =>
                typeof v === "object" && "relationTo" in v
            )
            .map((v) => {
              // Ensure the value property is a simple ID, not nested
              let idValue: any = v.value;
              while (
                idValue &&
                typeof idValue === "object" &&
                idValue !== null &&
                "value" in idValue
              ) {
                idValue = idValue.value as string;
              }
              return {
                relationTo: v.relationTo,
                value: idValue as string
              };
            });
        } else {
          // This check is here to satisfy TypeScript that relationTo is a string
          if (!Array.isArray(relationTo)) {
            // For single collection uploads, we need to wrap the IDs
            const values = Array.isArray(value) ? value : [value];
            itemsToLoad = (values as (FetchedImage | string)[]).map(
              (value): RalueWithRelation => {
                // Extract the actual ID, handling nested objects
                let idValue: any = value;
                while (
                  idValue &&
                  typeof idValue === "object" &&
                  idValue !== null &&
                  "value" in idValue
                ) {
                  idValue = idValue.value;
                }
                return {
                  relationTo,
                  value: idValue as string
                };
              }
            );
          }
        }

        if (itemsToLoad.length > 0) {
          const loadedDocs = await populateDocs(itemsToLoad);

          if (loadedDocs) {
            // setPopulatedDocs(loadedDocs.map(r => ({
            //     relationTo: r.relationTo as ImageCollectionSlug,
            //     value: r.value as FetchedImage
            // })))
            loadedValueRef.current = value;
          }
        }
      } else {
        // Clear populated docs when value is cleared
        // setPopulatedDocs([])
        loadedValueRef.current = null;
      }
    }

    // Only load if value has changed from what we last loaded
    const valueChanged = loadedValueRef.current !== value;
    if (valueChanged) {
      void loadInitialDocs();
    }
  }, [populateDocs, value, relationTo]);
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
      const yD = clamp(translateY.get() + distance, 0, 100);
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
      document.body.addEventListener("pointerup", endDrag, { once: true });
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
        {image ? (
          <CoverImage
            image={image}
            setImage={setImage}
            imageIsReady={imageIsReady}
            hover={hover}
            repositioning={repositioning}
            transformPosition={transformPosition}
            finishReposition={finishReposition}
            revertReposition={revertReposition}
            onClickRemove={onClickRemove}
            setEnabled={setEnabled}
            onRepositionClick={onRepositionClick}
            imageFilePaste={imageFilePaste}
            startDrag={startDrag}
            enabled={enabled}
          />
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
                  <ListDrawerOpener openListDrawer={openListDrawer} />
                ) : (
                  <></>
                  // <InsertFallbackImage
                  //     onFetch={onFetch}
                  //     unsplash={unsplashFallback.current}
                  // />
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
const ListDrawerOpener = ({
  openListDrawer
}: {
  openListDrawer: () => void;
}) => {
  return (
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
  );
};
const CoverImage = ({
  imageIsReady,
  repositioning,
  hover,
  image,
  transformPosition,
  onClickRemove,
  onRepositionClick,
  imageFilePaste,
  startDrag,
  revertReposition,
  finishReposition,
  setEnabled,
  enabled,
  setImage
}: {
  setEnabled: (r: boolean) => void;
  enabled: boolean;
  setImage: (r: string | ProcessedImage | null) => void;
  image: ProcessedImage | string;
  imageIsReady: boolean;
  hover: boolean;
  repositioning: boolean;
  transformPosition: MotionValue<string>;
  onClickRemove: () => void;
  onRepositionClick: MouseEventHandler;
  imageFilePaste: ChangeEventHandler;
  startDrag: PointerEventHandler;
  revertReposition: PointerEventHandler;
  finishReposition: PointerEventHandler;
}) => {
  const theme = useTheme((r) => r.theme);
  const darkmode = useImageDarkmode({
    src: typeof image === "string" ? image : image.url,
    objectPosition: "50% 50%"
  });
  const setCursorTheme = useCursor((r) => r.setCursorTheme);
  const resetCursorTheme = useCursor((r) => r.resetCursorTheme);
  const [hovered, setHovered] = useState(false);
  const onEnter = useCallback(() => {
    setHovered(true);
  }, []);
  const onLeave = useCallback(() => {
    setHovered(false);
  }, []);
  useEffect(() => {
    if (hovered) {
      darkmode && setCursorTheme("dark");
    } else {
      resetCursorTheme();
    }
  }, [darkmode, hovered, resetCursorTheme, setCursorTheme]);
  useEffect(() => {
    setEnabled(!repositioning);
  }, [repositioning, setEnabled]);
  return (
    <m.div
      className={cn(
        "relative mb-[1em] flex h-[30vh] max-h-[280px] w-full items-center justify-center overflow-hidden bg-faded-background/10 transition-all duration-200 ease-out-power2",
        darkmode && "dark"
      )}
      data-theme={darkmode ? "dark" : theme}
      onMouseEnter={onEnter}
      onMouseLeave={onLeave}
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
                priority={false}
                quality={100}
                unoptimized={true}
                src={typeof image === "string" ? image : image.url}
                style={{
                  objectPosition: transformPosition
                }}
                {...(typeof image === "string"
                  ? { fill: true }
                  : {
                      ...((image.width && { width: image.width as number }) ||
                        {}),
                      ...((image.height && {
                        height: image.height as number
                      }) ||
                        {})
                    })}
              />
            </picture>

            {typeof image === "object" && typeof image.caption === "string" && (
              <figcaption
                data-dark={image.darkmode}
                className={cn(
                  "right-[.5em] bottom-[.05em] flex h-[1em] w-full items-center justify-end bg-transparent p-[1.5em] underline",

                  "text-foreground"
                )}
              >
                {image.caption}
              </figcaption>
            )}
          </m.figure>
        </m.div>
      )}
      <AnimatePresence mode="sync" initial={false}>
        {repositioning ? (
          <RepositionButton
            startDrag={startDrag}
            revertReposition={revertReposition}
            finishReposition={finishReposition}
          />
        ) : (
          <CoverMenu
            enabled={enabled}
            setImage={setImage}
            hover={hover}
            onClickRemove={onClickRemove}
            onRepositionClick={onRepositionClick}
            imageFilePaste={imageFilePaste}
          />
        )}
      </AnimatePresence>
    </m.div>
  );
};
