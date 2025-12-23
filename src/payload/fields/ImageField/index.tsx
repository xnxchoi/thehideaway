"use client";

import {
  ListDrawerProps,
  useAuth,
  useField,
  useListDrawer
} from "@payloadcms/ui";
import {
  ClipboardEventHandler,
  DragEventHandler,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState
} from "react";

import { useDomCursor } from "@/components/core/cursorWrapper";
import { cn } from "@/lib/utils";
import { Media, type Asset, type UserMedia } from "@/payload-types";
import { capitalize } from "lodash-es";
import { AnimatePresence } from "motion/react";
import * as m from "motion/react-m";
import Image from "next/image";
import {
  PopulateDocs,
  ReloadDoc
} from "node_modules/@payloadcms/ui/dist/fields/Upload/types";
import type {
  CollectionSlug,
  DataFromCollectionSlug,
  FilterOptionsResult,
  JsonObject,
  PaginatedDocs,
  Where
} from "payload";
import { stringify } from "qs-esm";

import { errorToast, successToast } from "@/payload/components/sonner";
import type { ImageCollectionSlug } from "../../../types/payload-api-helpers";

type PopulatedDocs = { relationTo: string; value: JsonObject }[];

export type ImageFieldProps = {
  readonly allowCreate?: boolean;
  readonly filterOptions?: FilterOptionsResult;
  readonly path: string;
  readonly readOnly?: boolean;
  readonly relationTo: Extract<
    CollectionSlug,
    "media" | "assets" | "user_media"
  >;
  readonly required?: boolean;
  readonly serverURL?: string;
  readonly idValue?: string;
  readonly urlValue?: string;
  readonly idPath: string;
  readonly urlPath: string;

  readonly value?: string[] | string;
};
export default function ImageField(props: ImageFieldProps) {
  const {
    allowCreate,
    filterOptions: filterOptionsFromProps,
    relationTo,
    idValue: initIDValue,
    urlValue: initURLValue,
    urlPath,
    idPath,
    path,
    readOnly,
    required,
    serverURL,
    value
  } = props;
  const { setValue: setIDValue } = useField<string>({ path: idPath });
  const { setValue: setUrlValue } = useField<string>({ path: urlPath });
  const { value: labelValue } = useField<string>({ path: "label" });
  const [populatedDocs, setPopulatedDocs] = useState<PopulatedDocs>();
  const { permissions } = useAuth();

  const [image, setImage] = useState<string>(initURLValue || null!);
  const [dragging, setDragging] = useState(false);
  const [inserted, setInserted] = useState<boolean>(Boolean(initIDValue));
  const [hover, setHover] = useState<boolean>(false);
  const [activeRelationTo, setActiveRelationTo] =
    useState<ImageCollectionSlug>("media");
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

  const onChange = useCallback(
    async (
      newValue: Pick<Media | UserMedia, "id" | "thumbnailURL" | "url"> | null
    ) => {
      if (!newValue) {
        setIDValue(null);
        setUrlValue("");
        setImage("");
        setInserted(false);
      } else {
        setInserted(true);
        setIDValue(newValue.id);
        setUrlValue(newValue.url);
        setImage(newValue.thumbnailURL || newValue.url || "");
      }
    },
    [setIDValue, setUrlValue]
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
    { closeDrawer: closeListDrawer, openDrawer: openListDrawer }
  ] = useListDrawer({
    collectionSlugs: [relationTo],
    filterOptions
  });

  const [removeImage, setRemoveImage] = useState<boolean>(false);
  const populateDocs = useCallback<PopulateDocs>(
    async (
      ids,
      relatedCollectionSlug
    ): Promise<PaginatedDocs<
      Pick<Media, "id" | "thumbnailURL" | "url">
    > | null> => {
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
        select: {
          id: true,
          thumbnailURL: true,
          url: true
        }
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
        const json = await response.json();
        const sortedDocs = ids.map((id) =>
          json.docs.find((doc: Media | UserMedia | Asset) => {
            return String(doc.id) === String(id);
          })
        );

        return { ...json, docs: sortedDocs };
      }

      return null;
    },
    [serverURL]
  );
  const onUploadSuccess = useCallback(
    (newDocs: Pick<Media, "url" | "id" | "thumbnailURL">[]) => {
      const firstDoc = newDocs[0];
      if (firstDoc) {
        successToast("Image uploaded successfully");
        onChange(firstDoc);

        setPopulatedDocs([
          {
            relationTo: activeRelationTo,
            value: firstDoc
          }
        ]);
      }
    },
    [onChange, activeRelationTo]
  );
  const doUpload = useCallback(async (file: File) => {
    const formD = new FormData();
    formD.append("file", file);
    formD.append(
      "_payload",
      JSON.stringify({
        alt: "",
        caption: "An optional description for the file",
        _status: "published"
      })
    );
    try {
      const response = await fetch(`${serverURL}/api/${relationTo}`, {
        method: "POST",
        body: formD,
        credentials: "include"
      });
      if (response.ok) {
        const json = await response.json();
        onUploadSuccess([json.doc]);
      }
    } catch (e) {
      errorToast("Welp, something went wrong. Try again?");
      console.log(e);
    }
  }, []);
  const onLocalFileSelection = useCallback(
    (fileList?: FileList) => {
      let fileListToUse = fileList;
      console.log("fileList:", fileList);
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

          setImage(URL.createObjectURL(file));
          doUpload(file);
        } else {
          errorToast("File is not an image");
        }
      }
    },
    [doUpload]
  );

  const onDocCreate = useCallback(
    (data?: { doc?: Media | UserMedia | Asset }) => {
      const dc = data?.doc;
      if (dc) {
        setPopulatedDocs((currentDocs) => [
          ...(currentDocs || []),
          {
            relationTo: activeRelationTo,
            value: dc
          }
        ]);

        onChange(dc);
      }
    },
    [activeRelationTo, onChange]
  );
  const onListSelect = useCallback<NonNullable<ListDrawerProps["onSelect"]>>(
    async ({ collectionSlug, doc }) => {
      console.log("onListSelect: ", collectionSlug, doc);
      // const loadedDocs: null | PaginatedDocs<
      //   Pick<UserMedia, "id" | "thumbnailURL" | "url">
      // > = await populateDocs([doc.id], collectionSlug);
      // const selectedDoc = loadedDocs ? loadedDocs.docs?.[0] : null;
      // console.log("selectedDoc inside onListSelect: ", selectedDoc);
      setPopulatedDocs((currentDocs) => {
        if (doc) {
          return [
            {
              relationTo: activeRelationTo,
              value: doc
            }
          ];
        }
        return currentDocs;
      });
      const { id, url, thumbnailURL } = doc;
      onChange({ id, url, thumbnailURL });
      closeListDrawer();
    },
    [closeListDrawer, onChange, activeRelationTo]
  );
  const reloadDoc = useCallback<ReloadDoc>(
    async (docID, collectionSlug) => {
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
                  | DataFromCollectionSlug<ImageCollectionSlug>
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
              value: docs[0]
            };

            return updatedDocs;
          }
        });
      }
    },
    [populateDocs]
  );
  const onRemove = useCallback(
    (newValue?: PopulatedDocs) => {
      const newValueIDs = newValue
        ? newValue.map(({ value }) => value.id)
        : null;
      onChange(newValueIDs ? newValueIDs[0] : null);
      setPopulatedDocs(newValue ? newValue : []);
    },
    [onChange]
  );
  const onClickRemove = useCallback(() => {
    setRemoveImage((r) => !r);
    setUrlValue(null);
    setIDValue(null);
    onChange(null);
  }, []);
  useEffect(() => {
    async function loadInitialDocs() {
      if (initIDValue) {
        loadedValueDocsRef.current = true;
        const loadedDocs = await populateDocs(
          Array.isArray(initIDValue) ? initIDValue : [initIDValue],
          "media"
        );
        if (loadedDocs) {
          setPopulatedDocs(
            loadedDocs.docs.map((doc) => ({
              relationTo: activeRelationTo,
              value: doc
            }))
          );
        }
      }
    }

    if (!loadedValueDocsRef.current) {
      void loadInitialDocs();
    }
  }, [populateDocs, activeRelationTo, value, initIDValue]);

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
          onLocalFileSelection(e.dataTransfer.files);
          setDragging(false);

          e.dataTransfer.clearData();
        }
      }
    },
    [onLocalFileSelection]
  );
  const { onMouseEnter, onMouseLeave } = useDomCursor({});
  const handleDragOver: DragEventHandler<HTMLDivElement> = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);
  const handlePaste: ClipboardEventHandler<HTMLDivElement> = useCallback(
    (e) => {
      e.preventDefault();
      e.stopPropagation();

      if (e.clipboardData?.files && e.clipboardData.files.length > 0) {
        onLocalFileSelection(e.clipboardData.files);
      }
    },
    [onLocalFileSelection]
  );

  return (
    <div className={cn("relative flex w-full flex-col items-center")}>
      <div className={"w-full"}>{capitalize(idPath)}</div>
      <div
        className={
	        "relative my-[2em] flex h-[150px] w-[200px] items-center justify-center overflow-hidden bg-muted-faded-background transition-all duration-300 data-[inserted=false]:bg-muted-faded-background/50 data-[inserted=false]:text-foreground data-[inserted=false]:shadow-[0_0_1px_1px_var(--muted-faded-bg)]"
        }
        onDragEnter={handleDragEnter}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        data-inserted={!!image}
        onDrop={handleDrop}
        onMouseEnter={() => setHover(true)}
        onMouseLeave={() => setHover(false)}
        onPaste={handlePaste}
      >
        <input
          type="checkbox"
          className="hidden outline-none"
          checked={removeImage}
          onChange={() => setRemoveImage((t) => !t)}
        />
        <div
	        className="ease relative rounded-xl border-[1px] border-solid border-[currentColor] px-3.5 py-1 text-center leading-[1.5] transition-[z-index,opacity,border-color,background-color,color] duration-200 hover:border-off-background hover:bg-off-foreground hover:text-off-background data-[visible=false]:z-[-1] data-[visible=false]:opacity-0 data-[visible=true]:z-[10] data-[visible=true]:opacity-100"
          onMouseEnter={onMouseEnter}
          onMouseLeave={onMouseLeave}
        >
          {!image && (
            <input
              id={"image_file"}
              name={"image[file]"}
              className={cn(
                "absolute inset-0 z-[10] h-full w-full cursor-none overflow-hidden opacity-0",
                { hidden: inserted }
              )}
              onChange={(e) => {
                if (e.target.files) {
                  onLocalFileSelection(e.target.files);
                }
              }}
              accept="image/*"
              type={"file"}
            />
          )}
          <label className={"cursor-none"} htmlFor="image_file" role="button">
            <p>
              Upload File
              <svg
                className="relative inline-block h-auto bg-transparent transition-colors duration-300 outline-none"
                viewBox="0 0 20 20"
                width="30"
              >
                <path
                  xmlns="http://www.w3.org/2000/svg"
                  d="M16.3,8.2C15.9,5.3,13.2,3,10,3C7.4,3,5.2,4.5,4.2,6.6C1.8,7.2,0,9.2,0,11.7c0,3,2.5,5.3,5.5,5.3 c0.6,0,1-0.4,1-1c0-0.6-0.4-1-1-1c-2,0-3.5-1.5-3.5-3.3c0-1.6,1.3-3,3-3.2c0.4,0,0.7-0.3,0.8-0.6C6.4,6.2,8,5,10,5 c2.5,0,4.4,1.9,4.4,4.1c0,0.6,0.4,1,1,1c1.5,0,2.6,1.1,2.6,2.4c0,1.3-1.1,2.4-2.6,2.4c-0.6,0-1,0.4-1,1c0,0.6,0.4,1,1,1 c2.5,0,4.6-1.9,4.6-4.4C20,10.4,18.4,8.7,16.3,8.2z"
                  fill={"currentColor"}
                />
              </svg>
            </p>
          </label>
        </div>
        <span className={"mx-5"}>OR</span>
        <span
	        className={`upload__listToggler ease rounded-xl border-[1px] border-solid border-[currentColor] px-3.5 py-1 leading-[1.5] transition-[z-index,opacity,border-color,background-color,color] duration-200 hover:border-off-background hover:bg-off-foreground hover:text-off-background data-[visible=false]:z-[-1] data-[visible=false]:opacity-0 data-[visible=true]:opacity-100`}
          data-visible={!image}
          onMouseEnter={onMouseEnter}
          onMouseLeave={onMouseLeave}
          onClick={openListDrawer}
          role="button"
        >
          Choose from library
        </span>
        <AnimatePresence initial={false} mode={"sync"}>
          {image && (
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
                  ease: "easeIn"
                }
              }}
              exit={{
                visibility: "hidden",
                opacity: 0,
                transition: {
                  duration: 0.2,
                  ease: "easeOut"
                }
              }}
              className="absolute inset-0 z-[1]"
            >
              <Image
                className="h-full w-full object-cover"
                src={image!}
                height={400}
                width={400}
                alt=""
              />
            </m.div>
          )}
        </AnimatePresence>
        {image && (
          <div
            className={cn(
	            "absolute inset-0 flex items-center justify-center gap-[8px] bg-off-black/30 backdrop-blur-lg transition-all duration-300 data-[visible=false]:z-[0] data-[visible=false]:opacity-0 data-[visible=true]:z-[55] data-[visible=true]:opacity-100"
            )}
            data-visible={hover}
          >
            {populatedDocs && populatedDocs.length > 0 && (
              <span
	              className="relative z-[5] inline-flex h-[42px] min-w-[42px] cursor-none items-center justify-center rounded-xl px-[20px] py-0 text-center leading-[42px] transition-colors duration-300 hover:bg-off-background/50 hover:text-rouge-700"
                onClick={onClickRemove}
                role="button"
              >
                <svg
                  className="relative mr-[.5em] inline-block h-auto w-[21px] cursor-none border-none bg-transparent fill-current align-middle transition-[fill] duration-300 outline-none"
                  viewBox="0 0 20 20"
                  width="16"
                >
                  <path
                    xmlns="http://www.w3.org/2000/svg"
                    d="M12.4,0H7.6v2h4.8V0z M20,3.1H0v2h20V3.1z M8,6.9H6v9.3h2V6.9z M12,6.9h2v9.3h-2V6.9z M16.8,18 c0.6,0,1.2-0.5,1.2-1.2V7.1l2,0.6v9.1c0,1.7-1.4,3.2-3.2,3.2H3.2C1.4,20,0,18.6,0,16.8V7.8l2-0.6v9.7C2,17.5,2.5,18,3.2,18H16.8z"
                  />
                </svg>

                <span>Remove</span>
              </span>
            )}
          </div>
        )}
        <ListDrawer
          allowCreate={false}
          enableRowSelections={false}
          onSelect={onListSelect}
        />
      </div>
    </div>
  );
}
