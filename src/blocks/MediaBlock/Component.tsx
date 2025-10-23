import type { StaticImageData } from "next/image";

import React from "react";

import { FrontImage } from "@/components/UX/Media/FrontImage";
import { ImageMedia } from "@/components/UX/Media/ImageMedia";
import type { MediaProps } from "@/components/UX/Media/types";
import type { Media1 as MediaBlockProps } from "@/payload-types";

type Props = MediaBlockProps & {
  breakout?: boolean;
  enableGutter?: boolean;
  staticImage?: StaticImageData;
  disableInnerContainer?: boolean;
} & Pick<
    MediaProps,
    "captionClassName" | "className" | "imgClassName" | "aspectRatio"
  >;

export const MediaBlock: React.FC<
  {
    id?: string;
  } & Props
> = (props) => {
  const {
    captionClassName,
    className,
    aspectRatio,
    enableGutter = true,
    imgClassName,
    media,
    staticImage,
    disableInnerContainer
  } = props;
  const caption =
    (media && typeof media === "object" && media.caption) || props.blockName;

  return staticImage ? (
    <ImageMedia
      src={staticImage}
      className={className}
      imgClassName={imgClassName}
      caption={caption}
      captionClassName={captionClassName}
      aspectRatio={aspectRatio}
    />
  ) : (
    <FrontImage
      resource={media}
      className={className}
      imgClassName={imgClassName}
      caption={caption}
      aspectRatio={aspectRatio}
    />
  );
};
