"use client";
import { Link } from "src/components/UX/Link";
import { ArticleOverview } from "@/types/collections/posts";
import {
  ComponentPropsWithoutRef,
  useCallback,
  useEffect,
  useState
} from "react";
import { RP_BadgeTag } from "@/components/UX/RP_BadgeTag";
import { FrontImage } from "@/components/UX/Media/FrontImage";
import { cn } from "@/lib/utils";

import { useTheme } from "@/providers/Theme";
import { Theme } from "@/providers/Theme/types";
import { useCursorStore } from "@/providers/RP_Pro";

export const HomeSquare = (
  props: { article: ArticleOverview } & ComponentPropsWithoutRef<"div">
) => {
  const { article, ...rest } = props;
  const category =
    typeof article.category === "object"
      ? article.category.title
      : "Uncategorized";
  const setCursorTheme = useCursorStore((r) => r.setCursorTheme);
  const resetCursorTheme = useCursorStore((r) => r.resetCursorTheme);
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
      className="col-span-full flex flex-col items-center gap-y-[10px] rounded-[10px] bg-[oklch(var(--faded-fg)/.95)] p-[20px] text-center text-[oklch(var(--faded-bg)/1)] lg:col-[1/-1] dark:bg-off-white/95"
    >
      <div className="relative min-h-[1px] w-full min-w-[1px] overflow-hidden rounded-[5px] pt-[56%]">
        {article.image ? (
          <FrontImage
            resource={article.image}
            imgClassName="rounded-[5px] absolute object-cover top-0 block w-full h-full transition-opacity duration-400"
          />
        ) : (
          <div className="absolute top-0 block h-full w-full rounded-[5px] object-cover transition-opacity duration-400" />
        )}
      </div>
      <RP_BadgeTag
        className="border-[color:oklch(var(--bg)/1)] text-[oklch(var(--bg)/1)]"
        content={category}
      />
      <div className="flex w-full flex-col items-center justify-center pb-8">
        <span
          className={cn(
            "m-0 font-serif text-[2.8rem] leading-[1] lg:text-[4rem]"
          )}
        >
          {article.title}
        </span>
        <span className="m-0 max-w-[70%] font-sans text-[1.4rem] leading-[1] lg:mt-[-5px] lg:text-[1.6rem]">
          {article.subtitle}
        </span>
      </div>
      <div className="inline-block max-w-[70%] text-[1.1rem] uppercase lg:mt-[-10px] lg:text-[1.2rem]">
        By {article.author.name}
      </div>
    </Link>
  );
};
