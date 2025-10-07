"use client";

import { ImageMedia } from "@/components/UX/Media/ImageMedia";
import type {
  FrontImageResource,
  MediaProps
} from "@/components/UX/Media/types";
import { cn } from "@/lib/utils";
import { useCursor } from "@/providers/RP_Pro";
import type { ImageCollectionSlug } from "@/types/payload-api-helpers";
import { getClientSideURL } from "@/utilities/getURL";
import { useQuery } from "@tanstack/react-query";
import NextImage from "next/image";
import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  useTransition,
  type ComponentProps,
  type Ref
} from "react";
import { Skeleton } from "../../ui/skeleton";

import { getFallbackImage } from "@/utilities/getFallbackImage";
import type { SelectFromCollectionSlug } from "node_modules/payload/dist/collections/config/types";
import { stringify } from "qs-esm";

export type FrontImageProps = Omit<MediaProps, "ref"> & {
  className?: string;
  isUser?: boolean;
  ref?: Ref<HTMLImageElement>;
};
export const FrontImage = (props: FrontImageProps) => {
  const {
    resource: image,
    imgClassName,
    className,
    src,
    isUser,
    alt,
    ...rest
  } = props;

  return image ? (
    <QueriedImage
      resource={image}
      alt={alt}
      className={imgClassName}
      collection={isUser ? "userMedia" : "media"}
      {...rest}
    />
  ) : src ? (
    <StaticImage
      src={src}
      className={cn("block h-full w-full", className)}
      imgClassName={imgClassName}
      {...rest}
      alt={alt || ""}
    />
  ) : (
    <FallbackImage imgClassName={imgClassName} alt={alt} {...rest} />
  );
};
function FallbackImage(props: Omit<FrontImageProps, "src" | "resource">) {
  const { imgClassName, className, alt, ...rest } = props;
  const [isTransitioning, startTransition] = useTransition();
  const [backupImage, setBackupImage] = useState<{
    path: string;
    sizes: string;
  } | null>(null);
  const getBackupImage = useCallback(() => {
    startTransition(async () => {
      await getFallbackImage().then((res) => {
        setBackupImage(res);
      });
    });
  }, []);
  useEffect(() => {
    getBackupImage();
  }, [getBackupImage]);
  return isTransitioning || !backupImage ? (
    <Skeleton
      className={cn(
        className,
        "block h-full w-full rounded-2xl bg-[oklch(var(--faded-fg)/0.2)] object-cover"
      )}
    />
  ) : (
    <StaticImage
      src={backupImage.path}
      className={cn("block h-full w-full", className)}
      sizes={backupImage.sizes}
      imgClassName={imgClassName}
      fill={true}
      {...rest}
      alt={alt || ""}
    />
  );
}
/**
 *  const [imageMedia, setImageMedia] = useState<FrontImageResource>(null!);
  const [hover, setHover] = useState<boolean>(false);
  const setCursorTheme = useCursorStore((store) => store.setCursorTheme);
  const resetCursorTheme = useCursorStore((store) => store.resetCursorTheme);
  const theme = useTheme((store) => store.theme);
  const [imageTheme, setImageTheme] = useState<"light" | "dark">("light");
  useEffect(() => {
    if (!image) return;
    if (typeof image === "string") {
      const path = isUser ? "userMedia" : "media";
      fetch(`${getClientSideURL()}/api/${path}/${image}`)
        .then((res) => res.json())
        .then((res) => {
          setImageMedia(res);
        });
    } else {
      setImageMedia(image);
    }
  }, [image, isUser]);
  useEffect(() => {
    if (!imageMedia) return;
    if (imageMedia.darkmode === null || imageMedia.darkmode === undefined) {
      fetch(`${getClientSideURL()}/api/media/${imageMedia.id}`)
        .then((res) => res.json())
        .then((res) => {
          setImageMedia(res);
        });
    }
  }, [imageMedia]);
  useEffect(() => {
    if (
      !imageMedia ||
      imageMedia.darkmode === null ||
      imageMedia.darkmode === undefined
    )
      return;
    setImageTheme(imageMedia.darkmode ? "dark" : "light");
  }, [imageMedia]);
  useEffect(() => {
    if (hover) {
      setCursorTheme(imageTheme);
    } else {
      resetCursorTheme();
    }
  }, [hover, imageTheme, resetCursorTheme, setCursorTheme]);
  return (
    <div
      className={"block h-full w-full"}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
    >
      {(imageMedia && (
        <ImageMedia
          fill
          priority={false}
          loading="lazy"
          imgClassName={cn(imgClassName, "rp_lazy")}
          resource={imageMedia}
          {...rest}
        />
      )) || (
        <Skeleton
          className={cn(
            imgClassName,
            "block h-full w-full rounded-2xl bg-[oklch(var(--faded-fg)/0.2)] object-cover"
          )}
        />
      )}
    </div>
  );
 */
function QueriedImage(
  props: MediaProps & {
    resource: string | FrontImageResource;
    collection?: ImageCollectionSlug;
  }
) {
  const {
    imgClassName,
    className,
    collection = "media",
    resource: rs,
    ...rest
  } = props;
  const [hover, setHover] = useState<boolean>(false);
  const onEnter = useCallback(() => setHover(true), []);
  const onLeave = useCallback(() => setHover(false), []);
  const setCursorTheme = useCursor((store) => store.setCursorTheme);
  const resetCursorTheme = useCursor((store) => store.resetCursorTheme);
  const [image, setImage] = useState<FrontImageResource | null>(null);
  const tId = useMemo(() => (typeof rs === "string" ? rs : rs.id), [rs]);
  const select = useMemo(
    () =>
      ({
        darkmode: true,
        filename: true,
        mimeType: true,
        url: true,
        width: true,
        height: true,
        thumbnailURL: true,
        id: true
      }) as SelectFromCollectionSlug<ImageCollectionSlug>,
    []
  );
  const {
    data: resource,
    isLoading,
    isPending,
    isError,
    isEnabled
  } = useQuery({
    placeholderData: {
      author: "",
      darkmode: false,
      filename: "",
      mimeType: "",
      url: "",
      width: 0,
      height: 0,
      thumbnailURL: "",
      id: "",
      createdAt: "",
      updatedAt: ""
    } as FrontImageResource,
    queryKey: [collection, tId],
    queryFn: async () => {
      const res = await fetch(
        `${getClientSideURL()}/api/${collection}/${tId}${stringify({ select }, { addQueryPrefix: true })}`
      );
      if (!res.ok) {
        throw new Error("Failed to fetch image");
      }
      return (await res.json()) as FrontImageResource;
    },
    enabled: typeof rs === "string" || !rs,
    staleTime: Infinity,
    refetchOnWindowFocus: false,
    gcTime: 1.5 * 60 * 1000
  });
  useEffect(() => {
    if (image) {
      if (hover) {
        setCursorTheme(image.darkmode ? "dark" : "light");
      } else {
        resetCursorTheme();
      }
    }
  }, [hover, image, resetCursorTheme, setCursorTheme]);
  useEffect(() => {
    if (isEnabled) {
      if (!isLoading && !isError && resource) {
        setImage(resource);
      }
    }
  }, [isLoading, isEnabled, resource, isError]);
  return isLoading || isPending ? (
    <div
      className={"block h-full w-full"}
      onMouseEnter={onEnter}
      onMouseLeave={onLeave}
    >
      <Skeleton
        className={cn(
          imgClassName,
          "block h-full w-full rounded-2xl bg-[oklch(var(--faded-fg)/0.2)] object-cover"
        )}
      />
    </div>
  ) : (
    <ImageMedia
      fill
      priority={false}
      onMouseEnter={onEnter}
      onMouseLeave={onLeave}
      loading="lazy"
      className={className}
      imgClassName={cn(imgClassName, "rp_lazy")}
      resource={rs}
      {...rest}
    />
  );
}

function StaticImage(
  props: ComponentProps<typeof NextImage> & {
    imgClassName?: string;
    className?: string;
    darkmode?: boolean;
  }
) {
  const { imgClassName, className, src, darkmode, ...rest } = props;
  const [hover, setHover] = useState<boolean>(false);
  const onEnter = useCallback(() => setHover(true), []);
  const onLeave = useCallback(() => setHover(false), []);
  const setCursorTheme = useCursor((store) => store.setCursorTheme);
  const resetCursorTheme = useCursor((store) => store.resetCursorTheme);
  useEffect(() => {
    if (hover) {
      setCursorTheme(darkmode ? "dark" : "light");
    } else {
      resetCursorTheme();
    }
  }, [darkmode, hover, resetCursorTheme, setCursorTheme]);
  return (
    <div
      className={"block h-full w-full"}
      onMouseEnter={onEnter}
      onMouseLeave={onLeave}
    >
      <picture>
        <NextImage
          priority={false}
          loading={"lazy"}
          src={src}
          className={cn("block", imgClassName)}
          {...rest}
        />
      </picture>
    </div>
  );
}
