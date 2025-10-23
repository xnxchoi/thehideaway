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
import { nanoid } from "nanoid";
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
  const hashId = useMemo(() => nanoid(), []);
  return image ? (
    <QueriedImage
      resource={image}
      alt={alt}
      className={className}
      imgClassName={imgClassName}
      collection={isUser ? "userMedia" : "media"}
      {...rest}
    />
  ) : src ? (
    <ImageMedia className={"relative"} {...props} alt={alt || ""} />
  ) : (
    <FallbackImage
      hashId={hashId}
      imgClassName={imgClassName}
      alt={alt}
      {...rest}
    />
  );
};
function FallbackImage(
  props: { hashId: string } & Omit<FrontImageProps, "src" | "resource">
) {
  const { hashId, imgClassName, className, alt, aspectRatio, ...rest } = props;
  const [isTransitioning, startTransition] = useTransition();
  const [backupImage, setBackupImage] = useState<{
    path: string;
    sizes: string;
  } | null>(null);

  const getBackupImage = useCallback(() => {
    startTransition(async () => {
      await getFallbackImage(hashId).then((res) => {
        setBackupImage(res);
      });
    });
  }, [hashId]);
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
    <ImageMedia
      src={backupImage.path}
      className={className || "relative"}
      size={backupImage.sizes}
      imgClassName={imgClassName}
      fill={true}
      aspectRatio={aspectRatio}
      {...rest}
      alt={alt || ""}
    />
  );
}
function QueriedImage(
  props: MediaProps & {
    resource: string | FrontImageResource;
    collection?: ImageCollectionSlug;
  }
) {
  const {
    imgClassName,
    className,
    aspectRatio,
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
      updatedAt: "",
      ...((typeof rs === "object" && rs && rs) || {})
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
      priority={false}
      onMouseEnter={onEnter}
      onMouseLeave={onLeave}
      loading="lazy"
      className={className || "relative"}
      imgClassName={imgClassName}
      resource={resource}
      aspectRatio={aspectRatio}
      {...rest}
    />
  );
}
