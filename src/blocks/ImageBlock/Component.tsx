"use client";
import { useDomCursor } from "@/components/core/cursorWrapper";
import { Button } from "@/components/core/Button";
import { RootImage } from "@/components/core/Media/Image";
import type { MediaProps } from "@/components/core/Media/types";
import { SPRING_EASE } from "@/constants/animations";
import type { Image as MediaBlockProps } from "@/payload-types";
import {
  ProcessedImageDoc,
  RenderImageFields
} from "@/types/collections/image-collections";
import { imageSelect } from "@/types/payload-api-selects";
import * as Dialog from "@radix-ui/react-dialog";
import { useQuery } from "@tanstack/react-query";
import Lenis from "lenis";
import { useLenis } from "lenis/react";
import {
  AnimatePresence,
  type HTMLMotionProps,
  MotionConfig,
  useMotionValue
} from "motion/react";
import * as m from "motion/react-m";
import type { StaticImageData } from "next/image";
import { stringify } from "qs-esm";
import React, {
  type ReactEventHandler,
  useCallback,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState
} from "react";

type Props = MediaBlockProps & {
  breakout?: boolean;
  enableGutter?: boolean;
  staticImage?: StaticImageData;
  disableInnerContainer?: boolean;
} & Pick<
    MediaProps,
    "captionClassName" | "className" | "imgClassName" | "aspectRatio"
  >;

// export const MediaBlock: React.FC<
// 	{
// 		id?: string;
// 	} & Props
// > = (props) => {
// 	const {
// 		captionClassName,
// 		className,
// 		aspectRatio,
// 		enableGutter = true,
// 		imgClassName,
// 		media,
// 		staticImage,
// 		disableInnerContainer
// 	} = props;
// 	const caption =
// 		(media.value && typeof media.value === "object" && media.value.caption) || props.blockName;
// 	const src = (typeof media.value === "string" ? media.value : media.value.src || media.value.url);
// 	return staticImage ? (
// 		<ImageMedia
// 			src={staticImage}
// 			className={className}
// 			imgClassName={imgClassName}
// 			caption={caption}
// 			captionClassName={captionClassName}
// 			aspectRatio={aspectRatio}
// 		/>
// 	) : (
// 		<FrontImage
// 			resource={src}
// 			className={className}
// 			imgClassName={imgClassName}
// 			caption={caption}
// 			aspectRatio={aspectRatio}
// 		/>
// 	);
// };

export const PostedImage = ({
  media: mediaProps
}: {
  media: MediaBlockProps["media"];
} & { staticImage?: StaticImageData }) => {
  return !!mediaProps ? <MediaMedia media={mediaProps} /> : <></>;
};
const MediaMedia = ({
  media: mediaProps
}: {
  media: NonNullable<MediaBlockProps["media"]>;
} & { staticImage?: StaticImageData }) => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const id =
    typeof mediaProps.value === "string"
      ? mediaProps.value
      : mediaProps.value.id;

  const initialData = useMemo((): RenderImageFields => {
    const initValue = mediaProps.value;
    switch (typeof initValue) {
      case "string":
        return {
          caption: "",
          alt: "",
          src: "",
          darkmode: false
        };
      default:
        return {
          darkmode: initValue.darkmode,
          alt: initValue.alt,
          caption: initValue.caption || "",
          src: initValue.src || null!,
          width: initValue.width,
          height: initValue.height,
          blurDataUrl: initValue.blurDataUrl,
          sizes: initValue.sizes || {}
        };
    }
  }, [mediaProps]);
  const uniqueId = useId();
  const { data } = useQuery({
    initialData,
    queryKey: ["media", { id: id || "" }] as [string, { id: string }],
    queryFn: async ({ queryKey }: { queryKey: [string, { id: string }] }) => {
      const select = imageSelect();
      const [_, { id }] = queryKey;
      const res = await fetch(
        `/api/${mediaProps.relationTo}/${id}${stringify({ select }, { addQueryPrefix: true })}`
      );
      if (res.ok) {
        const rr = await res.json().then((r) => r as ProcessedImageDoc);
        if (!rr.src) throw new Error("No valid url or filename found");

        return {
          darkmode: rr.darkmode || false,
          src: rr.src,
          blurDataUrl: rr.blurDataUrl,
          sizes: {
            ...(rr.sizes || {})
          },
          alt: rr.alt,
          caption: rr.caption || "",
          width: rr.width,
          height: rr.height
        };
      }
      throw new Error("Error fetching media");
    }
  });

  const handleDialogTrigger = useCallback(() => {
    setIsDialogOpen((prev) => !prev);
  }, []);
  const handlePressEnter = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter") {
        handleDialogTrigger();
      }
    },
    [handleDialogTrigger]
  );
  const { onMouseEnter, onMouseLeave } = useDomCursor({});
  const paddingTop = useMotionValue("0");
  const position = useMotionValue("static");
  const onLoad: ReactEventHandler<HTMLImageElement> = useCallback(
    (e) => {
      const t = e.target as HTMLImageElement;
      paddingTop.set(`${(t.height / t.width) * 100}%`);
      position.set("absolute");
    },
    [paddingTop, position]
  );

  return (
    <MotionConfig
      transition={{
        duration: 0.3,
        ease: "easeInOut"
      }}
    >
      <Dialog.Root open={isDialogOpen}>
        <m.div
          className={
            "LexicalEditorTheme__block relative m-0 flex h-0 w-full flex-col items-start"
          }
          lexical-decorator={"true"}
          key={`image-${uniqueId}`}
          style={{ paddingTop }}
        >
          <Dialog.Trigger asChild={true} tabIndex={0}>
            <m.div
              whileTap={{ scale: 0.98 }}
              layoutId={`dialog-${uniqueId}`}
              className={"inset-0"}
              style={{ position }}
              transition={{
                ...SPRING_EASE.power2.inOut,
                layout: {
                  ...SPRING_EASE.power2.inOut,
                  type: "spring",
                  stiffness: 300,
                  damping: 30
                }
              }}
              whileHover={{ scale: 1.02 }}
              role="button"
              onMouseEnter={onMouseEnter}
              onMouseLeave={onMouseLeave}
              onClick={handleDialogTrigger}
            >
              <RootImage
                resource={data}
                width={data.width || undefined}
                height={data.height || undefined}
                quality={100}
                onLoad={onLoad}
              />
            </m.div>
          </Dialog.Trigger>
          {data.caption && (
            <figcaption className={"pt-4 leading-normal"}>
              {data.caption}
            </figcaption>
          )}
        </m.div>
        <AnimatePresence initial={false} mode="popLayout">
          {isDialogOpen && (
            <Dialog.Portal key={`portal-${uniqueId}`}>
              <PO
                uniqueId={uniqueId}
                media={data}
                handleDialogTrigger={handleDialogTrigger}
              />
            </Dialog.Portal>
          )}
        </AnimatePresence>
      </Dialog.Root>
    </MotionConfig>
  );
};
const PO = ({
  handleDialogTrigger,
  uniqueId,
  media,
  ...props
}: HTMLMotionProps<"div"> & {
  handleDialogTrigger: () => void;
  uniqueId: string;
  media: RenderImageFields;
}) => {
  const wrapRef = useRef<HTMLDivElement>(null!);
  const contentRef = useRef<HTMLDivElement>(null!);
  const lenis = useLenis();
  const { onMouseEnter, onMouseLeave } = useDomCursor({});
  const uui = useId();
  useEffect(() => {
    lenis && lenis.stop();
    const wrapper = wrapRef.current,
      content = contentRef.current;
    let lnis: Lenis | undefined;
    if (wrapper && content) {
      lnis = new Lenis({
        wrapper,
        content,
        autoRaf: true
      });
    }
    return () => {
      lnis?.destroy();
      lenis && lenis.start();
    };
  }, [lenis]);
  const iddd = useId();
  return (
    <Dialog.Overlay asChild key={`overlay-${uniqueId}`}>
      <m.div
        {...props}
        className={
          "fixed inset-0 z-150 grid h-screen w-screen place-items-center overflow-y-auto px-0 py-[102px]"
        }
        layoutRoot={true}
        layoutScroll={true}
        ref={wrapRef}
        transition={{
          duration: 0.3,
          type: "spring",
          ...SPRING_EASE.power2.out
        }}
        key={`overlay-${uniqueId}-${uui}`}
      >
        <m.div
          className={"fixed inset-0 h-screen w-screen backdrop-blur-md"}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{
            type: "spring",
            bounce: 0.2
          }}
          key={iddd}
          onClick={handleDialogTrigger}
        />
        <Dialog.Title key={iddd + 2 + ""} asChild>
          <div className={"sr-only"}>Image Dialog</div>
        </Dialog.Title>
        <Dialog.Content
          key={`content-${uniqueId}`}
          asChild
          ref={contentRef}
          onInteractOutside={handleDialogTrigger}
          onFocusOutside={handleDialogTrigger}
          className={"z-150 bg-transparent focus:outline-none"}
          onEscapeKeyDown={handleDialogTrigger}
        >
          <m.div
            data-themed="background-color, color"
            className={
              "flex flex-col flex-nowrap items-center justify-center gap-6"
            }
            transition={{
              type: "spring",
              bounce: 0.4,
              ...SPRING_EASE.power2.out
            }}
          >
            <m.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{
                duration: 0.3,
                ease: "easeInOut",
                delay: 0.2
              }}
            >
              <Button
                aria-label="Close"
                className={
                  "z-150 flex size-15 flex-col flex-nowrap items-center justify-center rounded-full outline-1 select-none"
                }
                onClick={handleDialogTrigger}
              >
                <svg
                  width="24"
                  height="24"
                  viewBox="0 0 25 25"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  role="img"
                  className="size-7.5 fill-none stroke-muted-faded-foreground"
                >
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </Button>
            </m.div>
            <m.div
              layoutId={`dialog-${uniqueId}`}
              style={{
                position: "relative"
              }}
              className={"h-auto w-[80dvw] object-cover max-md:w-[97dvw]"}
              transition={{
                layout: {
                  ...SPRING_EASE.power3.out,
                  damping: 45
                }
              }}
              role="button"
              whileTap={{ scale: 0.98 }}
              onMouseEnter={onMouseEnter}
              onMouseLeave={onMouseLeave}
              autoFocus
              onClick={handleDialogTrigger}
            >
              <RootImage
                resource={media}
                width={media.width || undefined}
                height={media.height || undefined}
                quality={100}
              />
            </m.div>
          </m.div>
        </Dialog.Content>
      </m.div>
    </Dialog.Overlay>
  );
};
