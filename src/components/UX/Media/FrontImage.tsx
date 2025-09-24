"use client";

import { Media, UserMedia } from "@/payload-types";
import { ImageMedia } from "@/components/UX/Media/ImageMedia";
import { useEffect, useState } from "react";
import { useCursorStore } from "@/providers/RP_Pro";
import { getClientSideURL } from "@/utilities/getURL";
import type { MediaProps as MediaProps } from "@/components/UX/Media/types";
import { useTheme } from "@/providers/Theme";
import { cn } from "@/lib/utils";
import { Skeleton } from "../../ui/skeleton";
import { useQuery } from "@tanstack/react-query";
import { nanoid } from "nanoid";

export type FrontImageProps = MediaProps & {
  className?: string;
  isUser?: boolean;
};
export const FrontImage = (props: FrontImageProps) => {
  const { resource: image, imgClassName, className, isUser, ...rest } = props;

  const [imageMedia, setImageMedia] = useState<Media | UserMedia>(null!);
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
      setImageMedia(isUser ? (image as UserMedia) : (image as Media));
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
          onMouseEnter={() => setHover(true)}
          onMouseLeave={() => setHover(false)}
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
};

function QueriedImage(props: FrontImageProps) {
  const {
    resource: image,
    imgClassName,
    className,
    src,
    isUser,
    ...rest
  } = props;
}
