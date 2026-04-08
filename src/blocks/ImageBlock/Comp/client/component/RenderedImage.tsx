"use client";
import { useRPImageNode } from "@/blocks/ImageBlock/Comp/client/component/index";
import { EASING } from "@/constants/animations";
import { cn } from "@/lib/utils";
import { RP_InternalImageNodeData } from "@/payload/fields/Article/Cover/rp-image/server/node/RP_ImageNode";
import { useOpenState } from "@/payload/providers/Admins";
import { MotionValue, useMotionValue, useTransform } from "motion/react";
import * as m from "motion/react-m";
import Image from "next/image";
import {
  ComponentProps,
  ReactEventHandler,
  useCallback,
  useEffect,
  useRef
} from "react";
import { mergeRefs } from "react-merge-refs";

const NextImage = m.create(Image);
export type RPImageFrameProps = ComponentProps<"img"> & {
  image: RP_InternalImageNodeData & { src: string };
  darkmode: boolean;
  hover: boolean;
  span: MotionValue<number>;
  resizing?: boolean;
};
export const RenderedImage = ({
  image,
  darkmode,
  ref,
  span,
  hover
}: RPImageFrameProps) => {
  const nh = useMotionValue(450);
  const nw = useMotionValue(600);
  const aspectRatio = useTransform(() => nw.get() / nh.get());
  const width = useTransform(() => span.get() - 40);
  const imageRef = useRef<HTMLImageElement>(null!);
  const onLoad: ReactEventHandler<HTMLImageElement> = useCallback(
    (e) => {
      const imag = e.currentTarget;
      const wnw = imag.naturalWidth,
        wnh = imag.naturalHeight;
      if (!wnw || !wnh) {
        return;
      }
      nw.set(wnw);
      nh.set(wnh);
    },
    [nh, nw]
  );

  const resizing = useRPImageNode((r) => r.isResizing);

  const heightValue = useTransform(() => span.get() / aspectRatio.get());
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
      className={cn("relative rounded-[10px]")}
    >
      <m.div role={"figure"} className={"h-full w-full"}>
        <m.img
          onLoad={onLoad}
          ref={mergeRefs([ref, imageRef])}
          alt={""}
          className={
            "pointer-events-none block w-full rounded-[2px] object-cover select-none"
          }
          draggable={false}
          style={{
            height: resizing ? "100%" : heightValue,
            maxHeight: resizing ? "100%" : heightValue,
            width: resizing ? "100%" : width
          }}
          dragListener={false}
          // width={image.width} height={image.height}
          // priority={false}
          // quality={100}
          // unoptimized={true}
          src={image.src}
        />
        {/*{*/}
        {/*	!!image.caption && (*/}

        {/*			data-dark={darkmode}*/}
        {/*			className={cn(*/}
        {/*				"right-[.5em] bottom-[.05em]  h-[1em] w-full items-center justify-end bg-transparent p-[1.5em] underline",*/}
        {/*				"text-foreground", image.showCaption ? "flex" : "hidden"*/}
        {/*			)}*/}
        {/*			value={image.caption}*/}

        {/*	)}*/}
      </m.div>
    </m.div>
  );
};
