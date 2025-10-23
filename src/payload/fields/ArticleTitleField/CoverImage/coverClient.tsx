"use client";

import {
  ListDrawerProps,
  useAuth,
  useField,
  useListDrawer
} from "@payloadcms/ui";

import { cn } from "@/lib/utils";
import * as m from "motion/react-m";
import { stringify } from "qs-esm";
import {
  ClipboardEventHandler,
  DragEventHandler,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ChangeEvent
} from "react";

import { useDomCursor } from "@/components/core/cursorWrapper";
import { FrontImage } from "@/components/UX/Media/FrontImage";
import { EASING } from "@/constants/animations";
import { errorToast, successToast } from "@/payload/components/sonner";
import type {
  ImageBaseSelect,
  ImageCollection,
  ImageCollectionSlug
} from "@/types/payload-api-helpers";
import { AnimatePresence } from "motion/react";
import {
  PopulateDocs,
  ReloadDoc
} from "node_modules/@payloadcms/ui/dist/fields/Upload/types";
import type {
  CollectionSlug,
  DataFromCollectionSlug,
  FilterOptionsResult,
  PaginatedDocs,
  UploadFieldClientProps,
  Where
} from "payload";
import { useAltDocCtrls } from "@/payload/providers/Admins";
import { useShallow } from "zustand/shallow";
type FetchedImageDocs = Partial<ImageCollection> & ImageBaseSelect;

type PopulatedDocs = {
  relationTo: ImageCollectionSlug;
  value: FetchedImageDocs;
}[];

export type ArticleCoverProps = UploadFieldClientProps & {
  readonly allowCreate?: boolean;
  readonly filterOptions?: FilterOptionsResult;
  readonly path: string;
  readonly readOnly?: boolean;
  readonly relationTo: ImageCollectionSlug;
  readonly required?: boolean;
  readonly serverURL?: string;
  readonly value?: null | ImageBaseSelect;
};

export function CoverImageClient(props: ArticleCoverProps) {
  const {
    allowCreate = false,
    filterOptions: filterOptionsFromProps,
    relationTo,
    path,
    validate,
    readOnly,
    required,
    value: initValue,
    serverURL
  } = props;
  const { value, setValue } = useField<string>({
    path
  });
  const [wantInsert, setWantInsert] = useState(false);

  const altDocShown = useAltDocCtrls(useShallow((r) => r.peeked));
  const [populatedDocs, setPopulatedDocs] = useState<PopulatedDocs>();
  const { permissions } = useAuth();
  const initURLValue = initValue?.url || initValue?.blurDataUrl || null;
  const initIdValue = initValue?.id || null;
  const [image, setImage] = useState<string | ImageBaseSelect | null>(
    initValue || null
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
  const [dragging, setDragging] = useState(false);
  const [inserted, setInserted] = useState<boolean>(Boolean(initURLValue));
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

  const onChange = useCallback(
    async (newValue: ImageBaseSelect | null, fallback?: string) => {
      console.log("onChange: ", newValue);
      if (!newValue) {
        setImage(fallback || null);
        setInserted(false);
        setValue(null);
      } else {
        setInserted(true);
        setValue(newValue.id);
        setImage(newValue);
      }
    },
    [setValue, setImage, setInserted]
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
  const valueIdRef = useRef<null | string>(value || null);
  useEffect(() => {
    valueIdRef.current = value || null;
  }, [value]);
  const [removeImage, setRemoveImage] = useState<boolean>(false);
  const populateDocs = useCallback<PopulateDocs>(
    async (
      ids,
      relatedCollectionSlug
    ): Promise<PaginatedDocs<ImageBaseSelect> | null> => {
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
        const json = (await response.json()) as PaginatedDocs<ImageBaseSelect>;
        const sortedDocs = ids.flatMap(
          (id) =>
            json.docs.find((doc) => {
              return String(doc.id) === String(id);
            }) || []
        );

        return { ...json, docs: sortedDocs };
      }

      return null;
    },
    [serverURL]
  );
  const onUploadSuccess = useCallback(
    (newDocs: ImageBaseSelect[], fallback: string) => {
      const firstDoc = newDocs[0];
      if (firstDoc) {
        successToast("Image uploaded successfully");
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
          alt: "",
          caption: "An optional description for the file"
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
          onUploadSuccess([json.doc], fallback);
        }
      } catch (e) {
        errorToast("Welp, something went wrong. Try again?");
        console.log(e);
      }
    },
    [onUploadSuccess, relationTo, serverURL]
  );
  const onLocalFileSelection = useCallback(
    (fileList?: FileList, fallback?: string) => {
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
          doUpload(file, fallback || "");
        } else {
          errorToast("File is not an image");
        }
      }
    },
    [doUpload]
  );

  //   const onDocCreate = useCallback(
  //     (data: { doc?: ImageBaseSelect }) => {
  //       if (data.doc && data.doc !== undefined) {
  //         const d = data.doc;
  //         setPopulatedDocs((currentDocs) => [
  //           ...(currentDocs || []),
  //           {
  //             relationTo: activeRelationTo,
  //             value: d
  //           }
  //         ]);

  //         onChange(d, urlValue);
  //       }
  //     },
  //     [activeRelationTo, onChange, urlValue]
  //   );
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
              value: doc as ImageBaseSelect
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
      const docs = await populateDocs([docID], "userMedia").then((r) => {
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
              value: docs[0] as ImageBaseSelect
            };

            return updatedDocs;
          }
        });
      }
    },
    [populateDocs, onChange]
  );
  // const onRemove = useCallback(
  //   (newValue?: PopulatedDocs) => {
  //     const newValueIDs = newValue
  //       ? newValue.map(({ value }) => value.id)
  //       : null;
  //     onChange(newValueIDs ? newValueIDs[0] : null, "");
  //     setPopulatedDocs(newValue ? newValue : []);
  //   },
  //   [onChange]
  // );
  useEffect(() => {
    const imageRemove = async () => {
      if (valueIdRef.current) {
        await fetch(`${serverURL}/api/${relationTo}/${valueIdRef.current}`, {
          method: "DELETE",
          credentials: "include"
        });
      }
      onChange(null);
    };
    if (removeImage) {
      imageRemove();
    }
  }, [onChange, relationTo, removeImage, serverURL]);
  const onClickRemove = useCallback(() => {
    setRemoveImage((r) => !r);
  }, []);
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
              value: doc as ImageBaseSelect
            }))
          );
        }
      }
    }

    if (!loadedValueDocsRef.current) {
      void loadInitialDocs();
    }
  }, [populateDocs, activeRelationTo, initIdValue]);

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
  const [trashHovered, setTrashHovered] = useState(false);
  const { onMouseEnter, onMouseLeave } = useDomCursor({
    onEnter: () => setTrashHovered(true),
    onLeave: () => setTrashHovered(false)
  });
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
        "relative flex min-h-14 w-full shrink-0 grow-0 flex-col items-center bg-transparent"
      )}
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
            onDrop={handleDrop}
            className={
              "relative mb-[1em] flex h-[30vh] max-h-[280px] items-center justify-center overflow-hidden bg-faded-background/10 transition-all duration-200 ease-out-power2"
            }
            style={{
              // width: "var(--maxBodyWidth)"
              width: "100%",
              height: "30vh"
            }}
          >
            {image && (
              <>
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
                    "relative h-full w-full overflow-hidden rounded-[6px]"
                  )}
                >
                  <div
                    className={cn(
                      "absolute inset-0 z-10 transition-[backdrop-filter] delay-50 duration-200 ease-out-power4 hover:backdrop-blur-sm hover:backdrop-brightness-80",
                      hover && "backdrop-blur-sm backdrop-brightness-80"
                    )}
                    style={{
                      objectFit: "cover"
                    }}
                  />
                  <FrontImage resource={image} />
                </m.div>

                <m.div
                  className={cn(
                    "absolute inset-0 flex items-center justify-center gap-[8px] bg-transparent transition-[z-index,opacity] duration-300"
                  )}
                  variants={{
                    animate: {
                      zIndex: 0,
                      opacity: 0
                    },
                    hover: {
                      zIndex: 55,
                      opacity: 1
                    }
                  }}
                  animate={hover ? "hover" : "animate"}
                >
                  <div
                    className={
                      "flex w-fit items-center rounded-[6px] bg-faded-background/30 px-[2px] shadow-md"
                    }
                    // style={{
                    //   display: "flex",
                    //   alignItems: "center",
                    //   background: "oklch(var(--faded-bg)/.3)",
                    //   borderRadius: "6px",
                    //   width: "fit-content",
                    //   padding: "2px",
                    //   boxShadow: "0 0 0 1px #30302e,0px 4px 12px -2px #00000029"
                    // }}
                  >
                    <div
                      style={{
                        userSelect: "none",
                        transition: "background 20ms ease-in",
                        display: "inline-flex",
                        alignItems: "center",
                        height: "24px",
                        paddingInline: "6px",
                        borderRadius: "4px",
                        whiteSpace: "nowrap",
                        fontSize: "14px",
                        flexShrink: 0,
                        lineHeight: "1.2",
                        minWidth: "0px"
                      }}
                      className={cn(
                        "flex h-10 min-w-0 shrink-0 rounded-[4px] bg-faded-foreground/10 px-[6px] py-[4px] leading-[1.2] text-background/80 transition-colors duration-200 ease-out-power2 select-none hover:bg-faded-foreground/40 hover:text-background"
                      )}
                      role="button"
                      aria-label="Update the page cover image"
                    >
                      <div
                        style={{
                          fontSize: "12px",
                          lineHeight: "16px",
                          fontWeight: "400"
                        }}
                      >
                        Change cover
                      </div>
                    </div>
                    <div
                      className={
                        "mx-[4px] my-0 h-7 w-px rounded-[2px] bg-[var(--edge-black)/.1]"
                      }
                    >
                      |
                    </div>
                    <div
                      role="button"
                      aria-label="Reposition the cover image"
                      style={{
                        userSelect: "none",
                        transition: "background 20ms ease-in",

                        display: "inline-flex",
                        alignItems: "center",
                        height: "24px",
                        paddingInline: "6px",
                        borderRadius: "4px",
                        whiteSpace: "nowrap",
                        fontSize: "14px",
                        flexShrink: 0,
                        lineHeight: "1.2",
                        minWidth: "0px"
                      }}
                      className="inline-flex h-[24px] min-w-0 shrink-0 items-center rounded-[4px] bg-edge-black/10 px-[8px] text-base leading-[1.2] whitespace-nowrap transition-colors duration-200 ease-out-power3 hover:bg-edge-black/40"
                    >
                      <div
                        style={{
                          fontSize: "12px",
                          lineHeight: "16px",
                          fontWeight: "400"
                        }}
                      >
                        Reposition
                      </div>
                    </div>
                  </div>
                </m.div>
              </>
            )}
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
              "field-type cover-image image-cover-insert__wrap relative mb-[1em] flex h-[4vh] max-h-[280px] items-center justify-center overflow-hidden transition-all duration-200 ease-out-power2"
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
                ease: EASING.power2.out
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
                    <m.span
                      className={cn(
                        "ease relative rounded-xl border border-solid border-[currentColor] p-5 px-3.5 py-1 text-center leading-normal transition-[z-index,opacity,border-color,background-color,color] duration-200 ease-out-power2 hover:border-[oklch(var(--off-bg)/1)] hover:bg-[oklch(var(--off-fg)/1)] hover:text-[oklch(var(--off-bg)/1)]"
                      )}
                      role="button"
                      style={{
                        padding: "2.5px 8.75px"
                      }}
                    >
                      <input
                        id={"user_settings_photo_file"}
                        name={"user_settings[photo][file]"}
                        className={cn(
                          "!absolute inset-0 z-[10] h-full w-full cursor-none overflow-hidden opacity-0"
                        )}
                        onChange={imageFilePaste}
                        accept="image/*"
                        type={"file"}
                        style={{
                          cursor: "none",
                          position: "absolute"
                        }}
                      />
                      <label
                        className={"flex cursor-none items-center"}
                        style={{
                          fontSize: "11px"
                        }}
                        htmlFor="user_settings_photo_file"
                      >
                        Upload File
                        <svg
                          className="relative inline-block w-auto bg-transparent transition-colors duration-200 ease-out-power2 outline-none"
                          style={{
                            backgroundColor: "transparent",
                            outline: "none",
                            display: "inline-block",
                            lineHeight: 1.5,
                            border: "none"
                          }}
                          viewBox="0 0 20 20"
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
                    <m.span>/</m.span>
                    <m.span
                      className={`upload__listToggler ease rounded-xl border-[1px] border-solid border-[currentColor] px-3.5 py-1 leading-[1.5] transition-colors duration-200 ease-out-power2 hover:border-[oklch(var(--off-bg)/1)] hover:bg-[oklch(var(--off-fg)/1)] hover:text-[oklch(var(--off-bg)/1)]`}
                      onClick={openListDrawer}
                      role="button"
                      style={{
                        fontSize: "11px"
                      }}
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
                        "ease relative rounded-xl border-[1px] border-solid border-[currentColor] p-5 px-3.5 py-1 text-center leading-[1.5] transition-[z-index,opacity,border-color,background-color,color] duration-200 ease-out-power2 hover:border-[oklch(var(--off-bg)/1)] hover:bg-[oklch(var(--off-fg)/1)] hover:text-[oklch(var(--off-bg)/1)]"
                      )}
                      role="button"
                      style={{
                        fontSize: "11px"
                      }}
                      onClick={() => setWantInsert((r) => !r)}
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
}
