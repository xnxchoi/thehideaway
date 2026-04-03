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
import {
  ComponentPropsWithoutRef,
  useCallback,
  useEffect,
  useState
} from "react";

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
  const [inverse, setInverse] = useState<Theme>(
    theme === "dark" ? "light" : "dark"
  );
  useEffect(() => {
    setInverse(theme === "dark" ? "light" : "dark");
  }, [theme]);
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
    <Link
      onMouseEnter={() => onEnter(inverse)}
      onMouseLeave={() => onLeave()}
      href={"/essays/" + `${article.slug}`}
      className="col-span-full flex flex-col items-center gap-y-4 rounded-2xl bg-faded-foreground/95 p-8 text-center text-faded-background lg:col-span-full dark:bg-off-white/95"
    >
      <div
        className={cn(
          "relative min-h-px w-full min-w-px overflow-hidden rounded-[5px]",
          !!article.image ? "aspect-100/56" : "aspect-square"
        )}
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
      </div>
      <RP_BadgeTag
        className="border-background text-background"
        content={category}
      />
      <div className="flex w-full flex-col items-center justify-center pb-8">
        <span
          className={cn(
            "m-0 font-serif text-[2.8rem] leading-[1.75] lg:text-[4rem]"
          )}
        >
          {article.title}
        </span>
        <span className="m-0 max-w-[70%] font-sans text-[1.4rem] leading-none lg:-mt-2 lg:text-[1.6rem]">
          {article.subtitle}
        </span>
      </div>
      <div className="inline-block max-w-[70%] text-[1.1rem] uppercase lg:-mt-4 lg:text-[1.2rem]">
        {article.author.name}
      </div>
    </Link>
  );
};
