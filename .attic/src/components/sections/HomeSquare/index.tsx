"use client";
import { PlaceHolderImage } from "@/components/core/Media/Image/PlaceHolderImage";
import { Link } from "@/components/core/Link/Link";
import { FrontImage } from "@/components/core/Media/FrontImage";
import { RP_BadgeTag } from "@/components/UX/RP_BadgeTag";
import { cn } from "@/lib/utils";
import { useCursor } from "@/providers/RP_Pro";

import { useTheme } from "@/providers/Theme";
import { Theme } from "@/providers/Theme/types";
import { PostOverview } from "@/types/collections/posts";
import { ComponentPropsWithoutRef, useCallback } from "react";

export const HomeSquare = (
  props: { article: PostOverview } & ComponentPropsWithoutRef<"div">
) => {
  const { article, ...rest } = props;
  const category =
    typeof article.category === "object"
      ? article.category.title
      : "Uncategorized";
  const setCursorTheme = useCursor((r) => r.setCursorTheme);
  const resetCursorTheme = useCursor((r) => r.resetCursorTheme);
  const theme = useTheme((r) => r.theme);
  const inverse: Theme = theme === "dark" ? "light" : "dark";
  const onEnter = useCallback(
    (r: Theme) => {
      setCursorTheme(r);
    },
    [setCursorTheme]
  );
  const onLeave = useCallback(() => {
    resetCursorTheme();
  }, [resetCursorTheme]);
  return (
    <article
      {...rest}
      className="col-[1/-1] rounded-2xl bg-faded-foreground/95 p-4 text-center text-faded-background sm:gap-y-4 sm:p-6 lg:col-[1/5] lg:gap-y-5 lg:p-8 dark:bg-off-white/95"
    >
      <Link
        onMouseEnter={() => onEnter(inverse)}
        onMouseLeave={() => onLeave()}
        href={"/essays/" + `${article.slug}`}
        className="flex flex-col items-center gap-y-4 wrap-break-word"
      >
        {article.image ? (
          <FrontImage
            resource={article.image}
            aspectRatio={100 / 56}
            imgClassName="rounded-[5px] absolute object-cover top-0 block w-full h-full transition-opacity duration-400"
          />
        ) : (
          <PlaceHolderImage />
        )}
        <RP_BadgeTag
          className="border-background text-background"
          content={category}
        />
        <p className="m-0 font-serif text-5xl leading-[1.2] text-balance wrap-break-word lg:text-8xl">
          <span>{article.title}</span>
        </p>
        {article.subtitle && (
          <p className="m-0 font-sans text-base leading-[120%] text-pretty wrap-break-word sm:text-lg lg:text-xl">
            {article.subtitle}
          </p>
        )}
        <div className="max-w-[36ch] font-mono text-[10px] tracking-widest uppercase sm:text-xs">
          {article.author.name}
        </div>
      </Link>
    </article>
  );
};
