"use client";

import NextImage from "next/image";
import { useEffect, type FC, type Ref } from "react";

import { breakString } from "@/cssVariables";
import { cn } from "@/lib/utils";
import { useMotionValue, type MotionProps } from "motion/react";
import * as m from "motion/react-m";
import type { StaticImport } from "next/dist/shared/lib/get-img-props";
import type { AspectRatio, MediaProps } from "../types";
import { useAspectRatio } from "./useAspectRatio";

// A base64 encoded image to use as a placeholder while the image is loading
const placeholderBlur =
  "data:image/png;base64,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";

export const ImageMedia: FC<
  Omit<MediaProps, "ref"> & { ref?: Ref<HTMLImageElement> }
> = (props) => {
  const {
    alt: altFromProps,

    fill,
    className,

    priority,
    resource,
    aspectRatio,
    size: sizeFromProps,
    src: srcFromProps,
    loading: loadingFromProps,
    ...rest
  } = props;
  const resourceOb = resource && typeof resource === "object";
  let src: StaticImport | string | undefined = srcFromProps;
  const width = fill ? undefined : (resourceOb && resource.width) || 100;
  const height = fill ? undefined : (resourceOb && resource.height) || 100;
  const alt =
    (!src &&
      resourceOb &&
      "alt" in resource &&
      typeof resource.alt === "string" &&
      resource.alt) ||
    altFromProps ||
    "";
  const darkmode: boolean | undefined = resourceOb
    ? (resource?.darkmode ?? undefined)
    : undefined;
  if (!src && resourceOb) {
    const { url } = resource;
    url && (src = url);
  }

  const loading = loadingFromProps || (!priority ? "lazy" : undefined);

  // NOTE: this is used by the browser to determine which image to download at different screen sizes
  const sizes = sizeFromProps ? sizeFromProps : breakString;
  return (
    <figure
      className={cn(className || "absolute inset-0 h-full")}
      style={{ margin: 0 }}
    >
      <MediaMiddle
        {...rest}
        alt={alt}
        loading={loading}
        darkmode={darkmode}
        priority={priority}
        src={src}
        size={sizes}
        aspectRatio={aspectRatio}
        width={width}
        height={height}
      />
    </figure>
  );
};
type ProcessedMediaProps = Omit<MediaProps, "resource" | "className"> & {
  alt: string;
  darkmode?: boolean;
  width?: number;
  height?: number;
  aspectRatio?: AspectRatio;
};
const MediaMiddle = (props: ProcessedMediaProps) => {
  const { aspectRatio, ...rest } = props;
  if (aspectRatio) {
    return <ARMedia aspectRatio={aspectRatio} {...rest} />;
  }
  return <NoARMedia {...rest} />;
};
const ARMedia = (props: ProcessedMediaProps & { aspectRatio: AspectRatio }) => {
  const {
    src,
    alt,
    fill,
    pictureClassName,
    imgClassName,
    onLoad,
    priority,
    darkmode,
    captionClassName,
    caption,
    size,
    loading,
    ref,
    aspectRatio,
    ...rest
  } = props;
  const ar = useAspectRatio(aspectRatio);
  const paddingTop = useMotionValue(`${(1 / ar) * 100}%`);
  useEffect(() => {
    paddingTop.set(`${(1 / ar) * 100}%`);
  }, [ar, paddingTop]);
  return (
    <>
      {src && (
        <m.div
          className={cn(
            pictureClassName || "relative min-h-px w-full min-w-px"
          )}
          style={{
            paddingTop
          }}
        >
          <picture>
            <NextImage
              alt={alt}
              className={cn(
                "absolute inset-0 max-w-full border-0 object-cover backface-hidden",
                imgClassName
              )}
              onLoad={onLoad}
              fill={fill}
              priority={priority}
              quality={100}
              loading={loading}
              unoptimized={true}
              sizes={size}
              src={typeof src === "string" ? decodeURIComponent(src) : src}
              {...rest}
            />
          </picture>
        </m.div>
      )}
      {caption && (
        <figcaption
          className={cn(
            "right-[.5em] bottom-[.05em] flex h-[1em] w-full items-center justify-end bg-transparent p-[1.5em] underline",
            typeof darkmode === "boolean"
              ? darkmode
                ? "text-[oklch(var(--white)/1)]"
                : "text-[oklch(var(--black)/1)]"
              : "text-[oklch(var(--fg)/1)]",
            captionClassName
          )}
        >
          {caption}
        </figcaption>
      )}
    </>
  );
};
const NoARMedia = (props: Omit<ProcessedMediaProps, "aspectRatio">) => {
  const {
    src,
    alt,
    fill,
    pictureClassName,
    imgClassName,
    onLoad,
    priority,
    darkmode,
    captionClassName,
    caption,
    size,
    loading,
    ref,
    ...rest
  } = props;

  return (
    <>
      {src && (
        <m.div
          className={cn(
            "relative h-full min-h-[1px] min-w-px",
            pictureClassName
          )}
        >
          <picture>
            <NextImage
              alt={alt}
              className={cn(
                "absolute inset-0 h-full w-full max-w-full border-0 object-cover object-center backface-hidden",
                imgClassName
              )}
              onLoad={onLoad}
              fill={fill}
              priority={priority}
              unoptimized={true}
              quality={100}
              loading={loading}
              sizes={size}
              src={typeof src === "string" ? decodeURIComponent(src) : src}
              {...rest}
            />
          </picture>
        </m.div>
      )}
      {caption && (
        <figcaption
          className={cn(
            "right-[.5em] bottom-[.05em] flex h-[1em] w-full items-center justify-end bg-transparent p-[1.5em] underline",
            typeof darkmode === "boolean"
              ? darkmode
                ? "text-[oklch(var(--white)/1)]"
                : "text-[oklch(var(--black)/1)]"
              : "text-[oklch(var(--fg)/1)]",
            captionClassName
          )}
        >
          {caption}
        </figcaption>
      )}
    </>
  );
};
const MediaInternal = ({
  imgClassName,
  pictureClassName,
  alt,
  src,
  fill,
  darkmode,
  onLoad,
  loading,
  priority,
  style,
  size,
  captionClassName,
  caption,
  ...rest
}: Omit<ProcessedMediaProps, "resource" | "aspectRatio">) => {
  return (
    <>
      {src && (
        <m.div
          className={cn("relative min-h-[1px] min-w-[1px]", pictureClassName)}
          style={{
            ...style
          }}
        >
          <picture>
            <NextImage
              alt={alt}
              className={cn(
                "max-w-full border-0 object-cover backface-hidden",
                imgClassName
              )}
              onLoad={onLoad}
              unoptimized={true}
              fill={fill}
              priority={priority}
              quality={100}
              loading={loading}
              sizes={size}
              src={typeof src === "string" ? decodeURIComponent(src) : src}
              {...rest}
            />
          </picture>
        </m.div>
      )}
      {caption && (
        <figcaption
          className={cn(
            "right-[.5em] bottom-[.05em] flex h-[1em] w-full items-center justify-end bg-transparent p-[1.5em] underline",
            typeof darkmode === "boolean"
              ? darkmode
                ? "text-[oklch(var(--white)/1)]"
                : "text-[oklch(var(--black)/1)]"
              : "text-[oklch(var(--fg)/1)]",
            captionClassName
          )}
        >
          {caption}
        </figcaption>
      )}
    </>
  );
};
