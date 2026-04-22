import { ComponentProps } from "react";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";
import { type ChipLabel } from "../copy";

interface ComingSoonSectionProps extends ComponentProps<"section"> {
  label?: string;
  preset?: ChipLabel;
  copy?: string;
}

export function ComingSoonSection({
  label,
  preset = "default",
  copy,
  className,
  ...rest
}: ComingSoonSectionProps) {
  const t = useTranslations("ComingSoon");
  const chip = label ?? t(`chips.${preset}`);
  const bodyCopy = copy ?? t("sectionCopy");

  return (
    <section
      {...rest}
      className={cn(
        "flex items-center justify-between gap-6 border-y border-border/20 py-5",
        className
      )}
    >
      <p className="font-mono text-[11px] tracking-wide text-muted-foreground/60 xl:text-xs">
        {bodyCopy}
      </p>
      <span className="inline-flex shrink-0 items-center gap-1.5 border border-dashed border-border/40 px-2 py-0.5 font-mono text-[9px] tracking-widest text-muted-foreground/70 uppercase xl:text-[10px]">
        <span
          aria-hidden
          className="size-1 rounded-full bg-muted-foreground/50"
        />
        {chip}
      </span>
    </section>
  );
}
