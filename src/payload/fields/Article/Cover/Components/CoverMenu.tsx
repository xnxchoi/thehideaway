"use client";
import { Spinner } from "@/components/ui/spinner";

import { EASING, TWEEN_EASE } from "@/constants/animations";
import { cn } from "@/lib/utils";
import {
  getUnsplashCollection,
  getUnsplashCollectionsList
} from "@/payload/collections/Media/hooks/getFallbackFromUnsplash";
import { MenuPopup, MenuPositioner } from "@/payload/components/Popover";
import { Link } from "@/payload/elements/Link";
import {
  Tab,
  TabIndicator,
  TabPanel,
  TabsList,
  TabsRoot
} from "@/payload/elements/Tabs";
import { useRPImageNode } from "@/payload/fields/Article/Cover/rp-image/client/component";
import { $isRPImageNode } from "@/payload/fields/Article/Cover/rp-image/client/node/RP_ImageNode";
import { Internal_RPImageData } from "@/payload/fields/Article/Cover/rp-image/server/node/RP_ImageNode";
import { useGalleryFetch } from "@/payload/fields/Article/Cover/useGalleryFetch";
import { useCursor } from "@/providers/RP_Pro";
import {
  ImageCollectionSlug,
  ProcessedImage,
  RalueWithRelation,
  RenderImageFields,
  TabNames
} from "@/types/collections/image-collections";
import { ImageForm, ImageMetadata } from "@/types/ImageCollections/schema";
import {
  SavedMetadataUnsplash,
  UnsplashCollectionDoc
} from "@/types/ImageCollections/unsplash";
import { ContextMenu, Menu, Popover, Tabs } from "@base-ui/react";
import {
  $getNodeByKey,
  ElementFormatType
} from "@payloadcms/richtext-lexical/lexical";
import { useLexicalComposerContext } from "@payloadcms/richtext-lexical/lexical/react/LexicalComposerContext";
import { $dfsIterator } from "@payloadcms/richtext-lexical/lexical/utils";
import { toast } from "@payloadcms/ui";
import {
  DeepKeys,
  revalidateLogic,
  useForm,
  ValidationError
} from "@tanstack/react-form";
import { useQuery } from "@tanstack/react-query";
import { NodeKey } from "lexical";
import { isEmpty } from "lodash-es";
import { AlignCenter, AlignLeft, AlignRight, Ellipsis } from "lucide-react";
import { HTMLMotionProps } from "motion/react";
import * as m from "motion/react-m";
import NextImage from "next/image";
import {
  ChangeEventHandler,
  type ComponentProps,
  ComponentType,
  MouseEventHandler,
  useCallback,
  useEffect,
  useEffectEvent,
  useRef,
  useState
} from "react";
import { useDarkRoom } from "../ImageNode/DarkRoom";

import { ImageMenu, RemoveImageButton } from "./ImageMenu";
import { useLenis } from "lenis/react";
import Lenis from "lenis";

export const CoverMenu = ({
  hover,
  enabled,
  onClickRemove,
  setOpenedTab,
  onRepositionClick,
  imageFilePaste,
  setImage,
  setActiveCollection
}: HTMLMotionProps<"div"> & {
  enabled: boolean;
  hover: boolean;
  setOpenedTab: (r: TabNames | null) => void;
  setActiveCollection: (r: ImageCollectionSlug) => void;
  onClickRemove: () => void;
  onRepositionClick: MouseEventHandler;
  imageFilePaste: ChangeEventHandler;
  setImage: (r: string | null | ProcessedImage) => void;
}) => {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
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
      transition={{ type: "tween", duration: 0.3 }}
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
          aria-label="Update the page cover image"
        >
          <ImageMenu
            enabled={enabled}
            onClickRemove={onClickRemove}
            setImage={setImage}
            setOpenedTab={setOpenedTab}
            onChange={imageFilePaste}
            setActiveCollection={setActiveCollection}
            setOpen={setMenuOpen}
            open={menuOpen}
          />
        </div>
        <div
          onPointerDown={onRepositionClick}
          role="button"
          aria-label="Reposition the cover image"
          data-themed={"color, background-color, border-color"}
          className="flex h-10 min-w-0 shrink-0 overflow-hidden rounded-l-[2px] rounded-r-sm bg-faded-foreground/10 px-[8px] py-[4px] leading-[1.2] text-foreground/80 transition-colors duration-200 ease-out-power3 select-none hover:bg-faded-foreground/70 hover:text-background/60"
        >
          {" "}
          <span className={"text-sm leading-normal"}>Reposition</span>
        </div>
      </m.div>
    </m.div>
  );
};
export const FrameContextMenuHandle = Menu.createHandle();

export const FrameToolbar = ({ hover }: { hover: boolean }) => {
  const [submenuOpen, setSubmenuOpen] = useState(false);
  const format = useRPImageNode((r) => r.format);
  const FrameToolbarSubMenuHandle = Popover.createHandle<
    ComponentType<{
      nodeKey: string;
      format?: ElementFormatType;
    }>
  >();
  return (
    <m.div
      key={"changeCoverButton"}
      className={cn(
        "pointer-events-none absolute top-1.5 right-1.5 z-10 opacity-0 transition-opacity duration-200 ease-out-power2 hover:pointer-events-auto hover:opacity-100"
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
      transition={{ type: "tween", duration: 0.3 }}
      exit="animate"
      animate={hover ? "hover" : "animate"}
    >
      <m.div
        className={
          "flex w-fit items-center rounded-[6px] bg-faded-background/30 p-1 shadow-md"
        }
      >
        <Popover.Trigger
          className={cn(
            "inline-flex size-10 min-w-0 shrink-0 items-center justify-center gap-0 overflow-hidden rounded-[4px] bg-faded-foreground/10 p-0 leading-[1.2] text-foreground/80 transition-colors duration-200 ease-out-power2 select-none hover:bg-faded-foreground/70 hover:text-background/60",
            submenuOpen
              ? "pointer-events-none"
              : "hover:bg-faded-foreground/70 hover:text-background/60"
          )}
          data-themed={"color, background-color, border-color"}
          role="button"
          aria-label="Set Alignment"
          handle={FrameToolbarSubMenuHandle}
          payload={FrameAligment}
        >
          {format === "left" || format === "start" ? (
            <AlignLeft />
          ) : format === "end" || format === "right" ? (
            <AlignRight />
          ) : (
            <AlignCenter />
          )}
        </Popover.Trigger>
        <div
          className={cn(
            "inline-flex size-10 min-w-0 shrink-0 items-center justify-center gap-0 overflow-hidden rounded-[4px] bg-faded-foreground/10 p-0 leading-[1.2] text-foreground/80 transition-colors duration-200 ease-out-power2 select-none hover:bg-faded-foreground/70 hover:text-background/60",
            submenuOpen
              ? "pointer-events-none"
              : "hover:bg-faded-foreground/70 hover:text-background/60"
          )}
          data-themed={"color, background-color, border-color"}
          role="button"
          aria-label=""
        >
          Add Caption
        </div>
        <div
          className={cn(
            "inline-flex size-10 min-w-0 shrink-0 items-center justify-center gap-0 overflow-hidden rounded-[4px] bg-faded-foreground/10 p-0 leading-[1.2] text-foreground/80 transition-colors duration-200 ease-out-power2 select-none hover:bg-faded-foreground/70 hover:text-background/60",
            submenuOpen
              ? "pointer-events-none"
              : "hover:bg-faded-foreground/70 hover:text-background/60"
          )}
          data-themed={"color, background-color, border-color"}
          role="button"
          aria-label=""
        >
          Add Caption
        </div>
        <Menu.Trigger
          handle={FrameContextMenuHandle}
          role="button"
          aria-label="Open the block menu"
          data-themed={"color, background-color, border-color"}
          className="inline-flex size-10 min-w-0 shrink-0 items-center justify-center gap-0 overflow-hidden rounded-[4px] bg-faded-foreground/10 p-0 leading-[1.2] text-foreground/80 transition-colors duration-200 ease-out-power2 select-none hover:bg-faded-foreground/70 hover:text-background/60"
        >
          <Ellipsis className={"size-6 shrink-0"} />
        </Menu.Trigger>
      </m.div>
    </m.div>
  );
};
export const FrameContextMenu = ({
  children,
  className,
  ...props
}: ComponentProps<typeof ContextMenu.Popup>) => {
  return (
    <ContextMenu.Positioner sideOffset={8} className="outline-none">
      <ContextMenu.Popup
        className={cn(
          "max-w-[265px] min-w-[180px] origin-[var(--transform-origin)] rounded-md bg-[canvas] py-1.5 outline outline-1 transition-[transform,scale,opacity] data-[ending-style]:scale-90 data-[ending-style]:opacity-0 data-[starting-style]:scale-90 data-[starting-style]:opacity-0",
          className
        )}
        {...props}
      >
        {children}
      </ContextMenu.Popup>
    </ContextMenu.Positioner>
  );
};
export const FrameMenuItem = ({
  className,
  ...props
}: ComponentProps<typeof ContextMenu.Item>) => {
  return (
    <ContextMenu.Item
      className={className}
      render={({ className, ...props }) => (
        <div
          className={cn(
            "relative z-0 flex min-h-11 w-full gap-3 rounded-[6px] px-3.5 py-3.5 text-sm leading-[120%] transition-colors duration-150 ease-out-power2 outline-none select-none before:absolute before:inset-x-1 before:inset-y-0 before:z-[-1] before:rounded-sm before:bg-transparent before:transition-colors before:duration-150 before:ease-out-power2 data-[highlighted]:text-foreground data-[highlighted]:before:bg-muted-faded-background",
            className
          )}
          {...props}
          role="button"
        />
      )}
      {...props}
    />
  );
};
const alignmentToSide = (r: ElementFormatType): "left" | "right" | "center" => {
  switch (r) {
    case "start":
    case "left":
      return "left";
    case "end":
    case "right":
      return "right";
    default:
      return "center";
  }
};
export const FrameAligment = ({
  nodeKey,
  format = "center"
}: {
  nodeKey: NodeKey;
  format?: ElementFormatType;
}) => {
  const alignment = alignmentToSide(format);
  const [editor] = useLexicalComposerContext();
  const setActive = useCallback(
    (r: ElementFormatType) => {
      editor.update(() => {
        const node = $getNodeByKey(nodeKey);
        if ($isRPImageNode(node)) {
          node.setFormat(r);
        }
      });
    },
    [editor, nodeKey]
  );
  return (
    <div className="flex flex-row items-center">
      {["left", "center", "right"].map((r, k) => (
        <div
          key={r + k}
          role={"button"}
          onClick={() => setActive(r as ElementFormatType)}
          className={cn(
            "inline-flex h-9 w-9 min-w-0 shrink-0 items-center justify-center gap-0 rounded-[4px] px-0 text-[14px] leading-[1.2] font-normal whitespace-nowrap text-off-foreground transition-colors duration-20 ease-in select-none",
            alignment === r && "bg-faded-foreground/10 text-background"
          )}
        >
          {" "}
          {r === "left" ? (
            <AlignLeft />
          ) : r === "right" ? (
            <AlignRight />
          ) : (
            <AlignCenter />
          )}
        </div>
      ))}
    </div>
  );
};

type SaveImageFields = ImageMetadata &
  ImageForm & {
    src: string;
  };
const FrameFiller = ({
  userId,
  userName,
  formID
}: {
  formID: string;
  userId: string;
  userName: string;
}) => {
  const onInsertComplete = useCallback(() => {}, []);
  const defaultValues: ImageForm & ImageMetadata = {
    caption: `Uploaded by @${userName}`,

    alt: `Uploaded by @${userName}`,
    file: null!,

    collection: "userMedia",
    author: userId,
    darkmode: false
  };
  const fileRef = useRef<HTMLInputElement>(null!);
  const form = useForm({
    defaultValues,
    onSubmit: async ({ value: formValues }) => {
      const a: ImageForm & ImageMetadata = {
        file: formValues.file,
        collection: "userMedia",
        author: userId,
        darkmode: false,
        alt: formValues.alt,
        caption: formValues.caption
      };
    },
    validationLogic: revalidateLogic({
      mode: "submit",
      modeAfterSubmission: "change"
    }),
    validators: {
      onDynamic: ({ value: formValues }) => {
        const errors: Partial<
          Record<DeepKeys<SaveImageFields>, ValidationError>
        > = {};

        (["file"] as const).forEach((requiredField) => {
          if (!formValues[requiredField]) {
            switch (requiredField) {
              case "file":
                errors.file = "Please select a file to upload.";
                break;
            }
          }
        });
        return isEmpty(errors) ? undefined : { form: errors, fields: errors };
      }
    }
  });
  const handleSubmit = form.handleSubmit(async (data: ImageForm) => {
    toast("Form submitted");
  });
  return (
    <m.span
      className={cn(
        "relative flex h-14 w-3/4 items-center justify-center rounded-[35px] border border-solid border-muted-faded-foreground/80 p-5 px-3.5 py-1 text-center! leading-normal text-faded-foreground/90 transition-[z-index,opacity,border-color,background-color,color] duration-200 ease-out-power2 hover:border-muted-faded-foreground/30 hover:bg-faded-foreground hover:text-faded-background"
      )}
      data-themed={"opacity,border-color,background-color,color"}
      role="button"
    >
      <input
        id={"user_settings_photo_file"}
        name={"user_settings[photo][file]"}
        className={cn(
          "absolute! inset-0 z-10 h-full w-full cursor-none! overflow-hidden opacity-0"
        )}
        accept="image/*"
        type={"file"}
      />
      <label
        className={"flex w-fit cursor-none! items-center font-sans!"}
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
  );
};
export const ReplaceImageHandle = Menu.createHandle();
export const FrameImageReplacerMenu = () => {
  const [editor] = useLexicalComposerContext();
  const onClickRemove = useCallback(() => {
    editor.update(() => {
      for (const dfsNode of $dfsIterator()) {
        const node = dfsNode.node;

        if ($isRPImageNode(node)) {
          const nodeData = node.getData();
          if ((nodeData as Internal_RPImageData)?.pending) {
            node.remove();
          }
        }
      }
    });
  }, [editor]);
  const open = useDarkRoom((r) => r.open);
  const openCHange = useDarkRoom((r) => r.setOpen);
  const onOpenChange = useCallback(
    (open: boolean) => {
      openCHange(open);
    },
    [openCHange]
  );
  return (
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
      <Menu.Root
        handle={ReplaceImageHandle}
        open={open}
        onOpenChange={onOpenChange}
      >
        <Menu.Portal>
          <MenuPositioner align={"end"}>
            <MenuPopup className="relative max-w-[calc(100vw-24%)] p-0">
              <FrameTab onClickRemove={onClickRemove} />
            </MenuPopup>
          </MenuPositioner>
        </Menu.Portal>
      </Menu.Root>
    </m.div>
  );
};
const MotionTabPanel = m.create(Tabs.Panel);
const FrameTab = ({
  onClickRemove,
  onOpenChange
}: {
  onClickRemove: MouseEventHandler;
  onOpenChange?: (tab: TabNames | null) => void;
}) => {
  const [editor] = useLexicalComposerContext();
  const openedTab = useDarkRoom((r) => r.focusedTab);
  const setOpenedTab = useDarkRoom((r) => r.setFocusedTab);
  const setMenuOpen = useDarkRoom((r) => r.setOpen);
  const onOpenTabChange = useCallback(
    (tab: null | TabNames) => {
      setOpenedTab(tab);
      onOpenChange?.(tab);
    },
    [onOpenChange, setOpenedTab]
  );

  return (
    <TabsRoot value={openedTab} onValueChange={onOpenTabChange}>
      <TabsList slots={<RemoveImageButton onClick={onClickRemove} />}>
        <Tab value="personal">Gallery</Tab>
        <Tab value={"gallery"}>Curations</Tab>
        <Tab value="upload">Upload</Tab>
        <Tab value="url">Embed Image</Tab>
        <Tab value="unsplash">Unsplash</Tab>
        <TabIndicator />
      </TabsList>
      <TabPanel value="upload"></TabPanel>
      <TabPanel value="personal"></TabPanel>
      <TabPanel value="gallery"></TabPanel>
      <MotionTabPanel
        className={
          "relative flex h-32 shrink-0 grow-0 -outline-offset-1 data-hidden:hidden"
        }
        initial={{
          height: 80
        }}
        variants={{
          open: {
            height: 240,
            transition: {
              ease: TWEEN_EASE.power3.out,
              duration: 0.2,
              delay: 0.5
            }
          },
          closed: {
            height: 80,
            transition: {
              ease: TWEEN_EASE.power3.out,
              duration: 0.2
            }
          }
        }}
        animate={openedTab === "unsplash" ? "open" : "closed"}
        exit={"closed"}
        value="unsplash"
      >
        <FrameGallery />
      </MotionTabPanel>
    </TabsRoot>
  );
};
const ImageGallery = ({
  uploadCallback
}: {
  uploadCallback: (params: ImageForm & ImageMetadata) => Promise<void>;
}) => {
  const {
    fetchNextPage,
    isEnabled,
    isError,
    isFetching,
    isFetchingNextPage,
    data
  } = useGalleryFetch(true);
  return (
    <>
      {" "}
      {isFetching ? (
        <div>Loading...</div>
      ) : (
        ((!isEnabled || isError) && <div>Error!</div>) || (
          <div className="flex w-full flex-wrap content-start bg-muted-faded-background/30 px-[12px] py-0">
            {(data &&
              (data.pages.length ? (
                data.pages.map((r, i) =>
                  r.totalDocs > 0 ? (
                    r.docs.map((c, idx) => (
                      <div
                        className={"relative flex w-full flex-col gap-px p-2"}
                        key={`pages-${idx}`}
                      >
                        {c.items.map((cv, ii) => (
                          <ImageInsert
                            itemValue={cv.value}
                            data={cv.data}
                            key={`item-${idx}-${ii}`}
                          />
                        ))}
                      </div>
                    ))
                  ) : (
                    <></>
                  )
                )
              ) : (
                <div>{":("}</div>
              ))) || <div>Empty!</div>}
          </div>
        )
      )}
    </>
  );
};
const ImageInsert = ({
  onClick,
  className,
  ref,
  onSelect,
  itemValue,
  data,
  figureClassName,
  ...props
}: ComponentProps<"div"> & {
  itemValue: RalueWithRelation;
  data: RenderImageFields;

  figureClassName?: string;
}) => {
  const { alt, caption, darkmode, src } = data;
  // eslint-disable-next-line react-hooks/preserve-manual-memoization
  const onClickCallback: MouseEventHandler<HTMLDivElement> = useCallback(
    (e) => {
      onClick?.(e);
    },
    [onClick]
  );
  return (
    <div
      className={cn("relative w-[25%] p-1.5", className)}
      role="button"
      onClick={onClickCallback}
      {...props}
    >
      {src ? (
        <figure
          className={cn(
            "relative m-0 h-[64px] w-full overflow-hidden rounded-[4px] transition-[opacity,background-color] duration-200 ease-out-power2 hover:bg-muted-faded-background hover:opacity-85",
            figureClassName
          )}
        >
          <NextImage
            unoptimized={true}
            src={src}
            alt={alt || ""}
            fill={true}
            className={
              "position-[center_60%] absolute inset-0 block w-full object-cover"
            }
          />
          {caption && (
            <figcaption
              className={
                "right-[.5em] bottom-[.05em] flex h-[1em] w-full items-center justify-end bg-transparent p-[1.5em] underline"
              }
            >
              {caption}
            </figcaption>
          )}
        </figure>
      ) : null}
    </div>
  );
};
const FrameGallery = () => {
  const {
    data: collections,
    isEnabled,
    isError,
    isFetching
  } = useQuery({
    queryKey: ["unsplashCollections"],
    queryFn: async () => {
      const res = await getUnsplashCollectionsList();
      if (!res) {
        throw new Error("Failed to fetch collections");
      }
      return res;
    }
  });
  const lnis = useLenis();
  const lenisRef = useRef<Lenis>(null);
  const containerRef = useRef<HTMLDivElement>(null),
    contentRef = useRef<HTMLDivElement>(null);
  const createLenis = useEffectEvent(() => {
    const content = contentRef.current,
      wrapper = containerRef.current;
    if (lnis && wrapper && content && lenisRef.current === null) {
      const lenis = new Lenis({
        content,
        wrapper,
        autoRaf: true
      });
      const onEnter = (e: MouseEvent) => {
        lnis.stop();
        lenis.start();
      };
      const onLeave = (e: MouseEvent) => {
        lenis.stop();
        lnis.start();
      };
      wrapper.addEventListener("mouseenter", onEnter);
      wrapper.addEventListener("mouseleave", onLeave);
      lenisRef.current = lenis;
      return () => {
        lenis.destroy();
        lenisRef.current = null;
        wrapper.removeEventListener("mouseenter", onEnter);
        wrapper.removeEventListener("mouseleave", onLeave);
      };
    }
  });
  useEffect(() => {
    const re = createLenis();
    return () => {
      re?.();
    };
  }, []);
  return (
    <div
      ref={containerRef}
      className={"h-full w-full overflow-x-hidden overflow-y-auto pb-3"}
    >
      <div className="flex w-full flex-wrap">
        {isFetching ? (
          <div>Loading...</div>
        ) : (
          ((!isEnabled || isError) && <div>Error!</div>) ||
          (collections &&
            collections.length > 0 &&
            collections.map((data) => (
              <UnsplashRow key={data.id} collection={data} />
            )))
        )}
      </div>
    </div>
  );
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
  const [hovered, setHovered] = useState(false);
  const { alt, caption, darkmode, src } = image;
  // eslint-disable-next-line react-hooks/preserve-manual-memoization
  const onClickCallback: MouseEventHandler<HTMLDivElement> = useCallback(
    (e) => {
      onClick?.(e);
    },
    [onClick]
  );
  const setCursorTheme = useCursor((r) => r.setCursorTheme);
  const resetCursorTheme = useCursor((r) => r.resetCursorTheme);
  useEffect(() => {
    if (hovered) {
      darkmode && setCursorTheme("dark");
    } else {
      resetCursorTheme();
    }
  }, [darkmode, hovered, resetCursorTheme, setCursorTheme]);
  return (
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
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className={cn("relative w-[25%] p-1.5", className, darkmode && "dark")}
      role="button"
      onClick={onClickCallback}
      {...((darkmode && { "data-dark": true }) || {})}
      {...props}
    >
      <figure
        className={cn(
          "relative m-0 h-[64px] w-full overflow-hidden rounded-[4px] transition-[opacity,background-color] duration-200 ease-out-power2 hover:bg-muted-faded-background hover:opacity-85",
          figureClassName
        )}
      >
        <picture>
          <NextImage
            unoptimized={true}
            src={src}
            alt={alt || ""}
            fill={true}
            className={
              "position-[center_60%] absolute inset-0 block w-full object-cover"
            }
          />
        </picture>
      </figure>
    </m.div>
  );
};
const UnsplashRow = ({ collection }: { collection: UnsplashCollectionDoc }) => {
  const {
    data: images,
    isFetching,
    isError
  } = useQuery({
    queryKey: [
      "unsplash",
      {
        collectionId: collection.id
      }
    ],
    queryFn: async ({
      queryKey
    }: {
      queryKey: [string, { collectionId: number }];
    }) => {
      const { collectionId } = queryKey[1];
      const res = await getUnsplashCollection(collectionId, {
        perPage: 32,
        page: 1
      });
      if (!res) {
        throw new Error("Failed to fetch images");
      }
      return res;
    }
  });
  return (
    <div className={"relative flex flex-col gap-px p-2.5"}>
      <div
        className={
          "mt-2.5 mb-3 flex px-3 text-sm leading-[120%] text-faded-foreground select-none"
        }
      >
        <div className={"flex self-center"}>
          <Link href={`${collection.links.html}`} target={"_blank"}>
            {collection.title}
          </Link>
        </div>
        <div className={"ml-auto"}>{isFetching && <Spinner />}</div>
      </div>
      <div className="flex w-full flex-wrap content-start bg-muted-faded-background/30 px-[12px] py-0">
        {isError ? (
          <></>
        ) : (
          images &&
          images.length > 0 &&
          images.map((image, i) => (
            <UnsplashImage key={"" + collection.id + i} {...image} />
          ))
        )}
      </div>
    </div>
  );
};
// <div
//     className={'absolute top-1.5 right-1.5 pointer-events-none opacity-0 hover:opacity-100 hover:pointer-events-auto duration-200 ease-out-power2 transition-opacity z-10'}
// >
//     <div aria-label="Block actions" dir="ltr"
//          className={'flex items-center bg-muted-faded-background rounded-[6px] w-fit p-1'}>
//
//         <div className={'w-px h-6 my-0 mx-1.5 rounded-[2px]'}></div>
//
//         <div className={'contents'}>
//             <div role="button" className={''} tabindex="0" aria-label="Add a new comment"
//                  style="user-select: none; transition: background 20ms ease-in; cursor: pointer; display: inline-flex; align-items: center; justify-content: unset; height: 24px; padding-inline: 6px; border-radius: 4px; white-space: nowrap; font-size: 14px; font-weight: 400; line-height: 1.2; color: var(--c-graTexAccPri); flex-shrink: 0; min-width: 0px; position: relative;">
//                 <div style="font-size: 12px; line-height: 16px; font-weight: 400;">
//                     <div style="display: flex; flex-direction: row; gap: 2px;">
//                         <svg aria-hidden="true" role="graphics-symbol" viewBox="0 0 16 16" class="commentSmall"
//                              style="width: 16px; height: 16px; display: block; fill: inherit; flex-shrink: 0; color: inherit;">
//                             <path
//                                 d="M4 2.575c-1.036 0-1.875.84-1.875 1.875v5.5c0 1.036.84 1.875 1.875 1.875h.466v1.822a.625.625 0 0 0 1.019.485l2.84-2.307H12c1.036 0 1.875-.84 1.875-1.875v-5.5c0-1.035-.84-1.875-1.875-1.875zM3.375 4.45c0-.345.28-.625.625-.625h8c.345 0 .625.28.625.625v5.5c0 .345-.28.625-.625.625H8.102a.63.63 0 0 0-.394.14l-1.992 1.619V11.2a.625.625 0 0 0-.625-.625H4a.625.625 0 0 1-.625-.625z"></path>
//                         </svg>
//                     </div>
//                 </div>
//             </div>
//         </div>
//         <div data-popup-origin="true" style="display: contents;">
//             <div data-popup-origin="true" style="display: contents;">
//                 <div role="button" tabindex="0" aria-expanded="false" aria-label="Set block alignment"
//                      aria-haspopup="dialog"
//                      style="user-select: none; transition: background 20ms ease-in; cursor: pointer; display: inline-flex; align-items: center; justify-content: center; gap: 0px; height: 24px; padding-inline: 0px; border-radius: 4px; white-space: nowrap; font-size: 14px; font-weight: 400; line-height: 1.2; width: 24px; color: var(--c-graTexAccPri); flex-shrink: 0; min-width: 0px;">
//                     <svg aria-hidden="true" role="graphics-symbol" viewBox="0 0 16 16"
//                          class="alignRightSmall directional-icon"
//                          style="width: 16px; height: 16px; display: block; fill: inherit; flex-shrink: 0; color: inherit;">
//                         <path
//                             d="M2.4 2.175a.625.625 0 1 0 0 1.25h11.2a.625.625 0 1 0 0-1.25zm5.6 2A1.825 1.825 0 0 0 6.175 6v4c0 1.008.817 1.825 1.825 1.825h4.4A1.825 1.825 0 0 0 14.225 10V6A1.825 1.825 0 0 0 12.4 4.175zM7.425 6c0-.318.257-.575.575-.575h4.4c.318 0 .575.257.575.575v4a.575.575 0 0 1-.575.575H8A.575.575 0 0 1 7.425 10zM2.4 12.575a.625.625 0 1 0 0 1.25h11.2a.625.625 0 1 0 0-1.25z"></path>
//                     </svg>
//                 </div>
//             </div>
//         </div>
//         <div data-popup-origin="true" style="display: contents;">
//             <div role="button" tabindex="0" aria-label="Add a caption"
//                  style="user-select: none; transition: background 20ms ease-in; cursor: pointer; display: inline-flex; align-items: center; justify-content: center; gap: 0px; height: 24px; padding-inline: 0px; border-radius: 4px; white-space: nowrap; font-size: 14px; font-weight: 400; line-height: 1.2; width: 24px; color: var(--c-graTexAccPri); flex-shrink: 0; min-width: 0px;">
//                 <svg aria-hidden="true" role="graphics-symbol" viewBox="0 0 16 16" class="captionSmall"
//                      style="width: 16px; height: 16px; display: block; fill: inherit; flex-shrink: 0; color: inherit;">
//                     <path
//                         d="M4.75 2.125c-1.036 0-1.875.84-1.875 1.875v3.5c0 1.036.84 1.875 1.875 1.875h5.5c1.036 0 1.875-.84 1.875-1.875V4c0-1.036-.84-1.875-1.875-1.875zM4.125 4c0-.345.28-.625.625-.625h5.5c.345 0 .625.28.625.625v3.5c0 .345-.28.625-.625.625h-5.5a.625.625 0 0 1-.625-.625zM3.5 10.375a.625.625 0 1 0 0 1.25h9.72a.625.625 0 1 0 0-1.25zm0 2.25a.625.625 0 1 0 0 1.25h6.84a.625.625 0 1 0 0-1.25z"></path>
//                 </svg>
//             </div>
//         </div>
//         <div data-popup-origin="true" style="display: contents;">
//             <div role="button" tabindex="0" aria-label="Crop image"
//                  style="user-select: none; transition: background 20ms ease-in; cursor: pointer; display: inline-flex; align-items: center; justify-content: center; gap: 0px; height: 24px; padding-inline: 0px; border-radius: 4px; white-space: nowrap; font-size: 14px; font-weight: 400; line-height: 1.2; width: 24px; color: var(--c-graTexAccPri); flex-shrink: 0; min-width: 0px;">
//                 <svg aria-hidden="true" role="graphics-symbol" viewBox="0 0 16 16" class="cropSmall"
//                      style="width: 16px; height: 16px; display: block; fill: inherit; flex-shrink: 0; color: inherit;">
//                     <g clip-path="url(#clip0_10073_12430)">
//                         <path
//                             d="M4.625 1.6a.625.625 0 0 0-1.25 0v1.775H1.6a.625.625 0 1 0 0 1.25h1.775V10.8c0 1.008.817 1.825 1.825 1.825h6.175V14.4a.625.625 0 1 0 1.25 0v-1.775H14.4a.625.625 0 1 0 0-1.25h-1.775V5.2A1.825 1.825 0 0 0 10.8 3.375H4.625zm0 3.025H10.8c.318 0 .575.258.575.575v6.175H5.2a.575.575 0 0 1-.575-.575z"></path>
//                     </g>
//                     <defs>
//                         <clipPath id="clip0_10073_12430">
//                             <path d="M0 0h16v16H0z"></path>
//                         </clipPath>
//                     </defs>
//                 </svg>
//             </div>
//         </div>
//         <div data-popup-origin="true" style="display: contents;">
//             <div role="button" tabindex="0" aria-label="Open block in full screen"
//                  style="user-select: none; transition: background 20ms ease-in; cursor: pointer; display: inline-flex; align-items: center; justify-content: center; gap: 0px; height: 24px; padding-inline: 0px; border-radius: 4px; white-space: nowrap; font-size: 14px; font-weight: 400; line-height: 1.2; width: 24px; color: var(--c-graTexAccPri); flex-shrink: 0; min-width: 0px;">
//                 <svg aria-hidden="true" role="graphics-symbol" viewBox="0 0 16 16" class="magnifyingGlassPlusSmall"
//                      style="width: 16px; height: 16px; display: block; fill: inherit; flex-shrink: 0; color: inherit;">
//                     <path
//                         d="M7.1 4.475a.625.625 0 0 0-.625.625v1.375H5.1a.625.625 0 1 0 0 1.25h1.375V9.1a.625.625 0 0 0 1.25 0V7.725H9.1a.625.625 0 0 0 0-1.25H7.725V5.1a.625.625 0 0 0-.625-.625"></path>
//                     <path
//                         d="M7.1 1.975a5.125 5.125 0 1 0 3.155 9.164l3.107 3.107a.625.625 0 1 0 .884-.884l-3.107-3.107A5.125 5.125 0 0 0 7.1 1.975M3.225 7.1a3.875 3.875 0 1 1 7.75 0 3.875 3.875 0 0 1-7.75 0"></path>
//                 </svg>
//             </div>
//         </div>
//         <div data-popup-origin="true" style="display: contents;">
//             <div role="button" tabindex="0" aria-label="Download file"
//                  style="user-select: none; transition: background 20ms ease-in; cursor: pointer; display: inline-flex; align-items: center; justify-content: center; gap: 0px; height: 24px; padding-inline: 0px; border-radius: 4px; white-space: nowrap; font-size: 14px; font-weight: 400; line-height: 1.2; width: 24px; color: var(--c-graTexAccPri); flex-shrink: 0; min-width: 0px;">
//                 <svg aria-hidden="true" role="graphics-symbol" viewBox="0 0 16 16" class="arrowLineDownSmall"
//                      style="width: 16px; height: 16px; display: block; fill: inherit; flex-shrink: 0; color: inherit;">
//                     <path
//                         d="M8 2.125a.625.625 0 0 0-.625.625v7.128L5.378 7.881a.625.625 0 1 0-.884.884l3.064 3.064c.244.244.64.244.884 0l3.065-3.064a.625.625 0 0 0-.884-.884L8.625 9.878V2.75A.625.625 0 0 0 8 2.125m-4.403 10.5a.625.625 0 1 0 0 1.25h8.806a.625.625 0 1 0 0-1.25z"></path>
//                 </svg>
//             </div>
//         </div>
//         <div data-popup-origin="true" style="display: contents;">
//             <div role="button" tabindex="0" aria-label="Open block actions menu"
//                  style="user-select: none; transition: background 20ms ease-in; cursor: pointer; display: inline-flex; align-items: center; justify-content: center; gap: 0px; height: 24px; padding-inline: 0px; border-radius: 4px; white-space: nowrap; font-size: 14px; font-weight: 400; line-height: 1.2; width: 24px; color: var(--c-graTexAccPri); flex-shrink: 0; min-width: 0px;">
//                 <svg aria-hidden="true" role="graphics-symbol" viewBox="0 0 16 16" class="ellipsisSmall"
//                      style="width: 16px; height: 16px; display: block; fill: inherit; flex-shrink: 0; color: inherit;">
//                     <path
//                         d="M3.2 6.725a1.275 1.275 0 1 0 0 2.55 1.275 1.275 0 0 0 0-2.55m4.8 0a1.275 1.275 0 1 0 0 2.55 1.275 1.275 0 0 0 0-2.55m4.8 0a1.275 1.275 0 1 0 0 2.55 1.275 1.275 0 0 0 0-2.55"></path>
//                 </svg>
//             </div>
//         </div>
//     </div>
// </div>
