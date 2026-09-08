"use client";
import { Link } from "@/components/core/Link/Link";
import {
  FrontImage,
  FrontImageProps
} from "@/components/core/Media/FrontImage";
import { cn } from "@/lib/utils";
import { SingleArticle } from "@types/collections/posts";
import {
  RalueAsDataWithRelation,
  RalueWithRelation
} from "@types/collections/image-collections";
import { formatDateTime } from "@/utilities/formatDateTime";
import { ComponentProps, ComponentPropsWithoutRef, useEffect } from "react";

export const CoverWrap = (props: ComponentProps<"div">) => {
  const { children, className, ...rest } = props;
  return (
    <div className={cn("-order-1 p-0", className)} {...rest}>
      <div className="relative h-full w-full">{children}</div>
    </div>
  );
};

export const CoverCard = (
  props: {
    children: React.ReactNode;
  } & ComponentPropsWithoutRef<"div">
) => {
  const { children, className, ...rest } = props;
  return (
    <div
      className={cn(
        "cover_card relative mx-auto my-0 grid aspect-3/4 max-h-[clamp(400px,calc(75vh-var(--headerHeight)),700px)] w-full max-w-576 overflow-hidden rounded-2xl p-0 md:aspect-3/5 md:rounded-4xl lg:aspect-auto",
        className
      )}
      {...rest}
    >
      {children}
    </div>
  );
};

export const CoverTitleCard = (
  props: {
    children: React.ReactNode;
  } & ComponentPropsWithoutRef<"div">
) => {
  const { children, className, ...rest } = props;
  return (
    <div
      className={cn("rp_title-card title-grid rounded-xl", className)}
      {...rest}
    >
      {children}
    </div>
  );
};

export const CoverMeta = (
  props: {
    publishedAt: SingleArticle["publishedAt"];
    className?: string;
  } & ComponentPropsWithoutRef<"div">
) => {
  const { publishedAt, className, ...rest } = props;

  return (
    <div
      className={cn(
        "rp_meta z-10 col-span-1 row-6 mt-[10px] font-sans text-[11.7px] leading-[1.17] uppercase md:text-[14px]",
        className
      )}
      {...rest}
    >
      {publishedAt && (
        <div>
          <time className="z-10" dateTime={publishedAt}>
            {formatDateTime(publishedAt)}
          </time>
        </div>
      )}
    </div>
  );
};
export const CoverTag = (
  props: {
    category?: SingleArticle["category"] | null;
  } & ComponentPropsWithoutRef<"a">
) => {
  const { category, className } = props;

  return (
    <div className={cn("rp_title-tag")}>
      <Link
        href={`/archived/${category?.slug}`}
        className={cn("rp_tag", className)}
      >
        {category?.title || "Untitled category"}
      </Link>
    </div>
  );
};
export const CoverTitle = (
  props: {
    title?: SingleArticle["title"] | null;
  } & ComponentPropsWithoutRef<"div"> & { h1?: ComponentPropsWithoutRef<"h1"> }
) => {
  const { title, className, h1 } = props;
  const { className: h1ClassName, ...h1Props } = h1 || {};

  return (
    <div className={cn("col-span-full row-4", className)}>
      <h1
        className={cn(
          "pointer-events-none m-0 text-h1 font-extrabold tracking-tighter text-faded-black uppercase group-dark:text-faded-white",
          h1ClassName
        )}
        data-themed="color, background-color, border-color"
        {...h1Props}
      >
        {title}
      </h1>
    </div>
  );
};
export const CoverSubtitle = (
  props: {
    subtitle?: SingleArticle["subtitle"] | null;
    subtitleClassName?: string;
  } & ComponentPropsWithoutRef<"div">
) => {
  const { subtitle, className, subtitleClassName } = props;

  return (
    <div
      className={cn(
        "col-span-full row-5 lg:m-[1rem_4rem_0_0] 2xl:col-[1/4]",
        className
      )}
    >
      <p
        className={cn(
          "m-0 font-serif text-[14.4px]! leading-[1.3] md:text-[17.6px]!",
          subtitleClassName
        )}
      >
        {subtitle}
      </p>
    </div>
  );
};
export const CoverImage = (
  props: {
    image?: RalueAsDataWithRelation | RalueWithRelation | null;
  } & FrontImageProps
) => {
  const { image, className } = props;
  useEffect(() => {
    console.log("coverimage:", image);
  }, [image]);
  return (
    (!!image && typeof image === "object" && (
      <FrontImage
        priority={false}
        loading="lazy"
        className={"absolute inset-0 h-full w-full"}
        pictureClassName={cn(
          "rp_lazy thumb css-filter size-large",
          props.imgClassName
        )}
        resource={image}
        caption={
          <Link
            className="link-underline"
            target="_blank"
            style={{ color: "inherit" }}
            rel="noreferrer"
            href="/"
          >
            THE HIDEAWAY
          </Link>
        }
      />
    )) || (
      <div className={cn("rp_pxf rp_img", className)}>
        <div
          className={cn(
            "rp_lazy thumb css-filter size-large bg-edge-black/20",
            props.imgClassName
          )}
        />
      </div>
    )
  );
};
export const CoverAuthor = (
  props: {
    author?: SingleArticle["author"] | null;
    authorClassName?: string;
  } & ComponentPropsWithoutRef<"div">
) => {
  const { author, className, authorClassName, ...rest } = props;

  return (
    <address className={cn("rp-author-info z-10")}>
      <div className={cn("rp__a-m text-off-foreground", className)} {...rest}>
        {author && (
          <>
            By
            <Link
              href={`/@${author.slug}`}
              className={cn(
                "bg-transparent text-sm wrap-break-word",
                authorClassName
              )}
            >
              {author.name}
            </Link>
          </>
        )}
      </div>
    </address>
  );
};
