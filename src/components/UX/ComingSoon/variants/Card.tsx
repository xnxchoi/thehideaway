import { ComponentProps } from "react";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";
import { type ChipLabel } from "../copy";

interface ComingSoonCardProps extends ComponentProps<"div"> {
  label?: string;
  preset?: ChipLabel;
  copy?: string;
  glyph?: string;
  aspect?: "square" | "portrait" | "video";
}

const ASPECT_CLASS = {
  square: "aspect-square",
  portrait: "aspect-[3/4]",
  video: "aspect-video"
} as const;

export function ComingSoonCard({
  label,
  preset = "default",
  copy,
  glyph = "◌",
  aspect = "portrait",
  className,
  ...rest
}: ComingSoonCardProps) {
  const t = useTranslations("ComingSoon");
  const chip = label ?? t(`chips.${preset}`);
  const bodyCopy = copy ?? t("cardCopy");

  return (
    <div
      {...rest}
      className={cn(
        "group relative flex flex-col overflow-hidden rounded-sm border border-dashed border-border/20 bg-card/30",
        "transition-colors hover:border-border/40",
        className
      )}
    >
      <div
        className={cn(
          ASPECT_CLASS[aspect],
          "relative flex items-center justify-center bg-muted/10"
        )}
      >
        <span
          aria-hidden
          className="font-mono text-[20vw] leading-none font-light text-foreground/[0.04] select-none sm:text-[12vw] lg:text-[9vw] xl:text-[7vw]"
        >
          {glyph}
        </span>
        <span className="absolute top-3 left-3 inline-flex items-center gap-1.5 border border-dashed border-border/40 px-2 py-0.5 font-mono text-[9px] tracking-widest text-muted-foreground/70 uppercase xl:text-[10px]">
          <span
            aria-hidden
            className="size-1 rounded-full bg-muted-foreground/50"
          />
          {chip}
        </span>
      </div>
      <div className="p-3.5 xl:p-4">
        <p className="font-mono text-[10px] tracking-wide text-muted-foreground/60 xl:text-[11px]">
          {bodyCopy}
        </p>
      </div>
    </div>
  );
}
