import { cn } from "@/lib/utils";
import type { ReactNode } from "react";
import { GlassPanel } from "./GlassPanel";

interface SectionEmptyProps {
  eyebrow?: string;
  title: string;
  body?: string;
  action?: ReactNode;
  className?: string;
  symbol?: string;
}

export const SectionEmpty = ({
  eyebrow = "In preparation",
  title,
  body,
  action,
  className,
  symbol = "○"
}: SectionEmptyProps) => {
  return (
    <GlassPanel variant="elevated" className={cn("overflow-hidden", className)}>
      <div className="relative flex flex-col items-start gap-6 px-8 py-14 xl:px-12 xl:py-20">
        <span
          aria-hidden="true"
          className="pointer-events-none absolute top-8 right-8 font-mono text-[6rem] leading-none text-foreground/[0.05] xl:text-[8rem] dark:text-foreground/[0.07]"
        >
          {symbol}
        </span>
        <span className="font-mono text-[10px] tracking-[0.22em] text-foreground/65 uppercase dark:text-foreground/60">
          {eyebrow}
        </span>
        <h3 className="max-w-prose text-2xl font-light tracking-tight xl:text-3xl">
          {title}
        </h3>
        {body ? (
          <p className="max-w-prose text-base leading-relaxed font-light text-foreground/75 xl:text-lg">
            {body}
          </p>
        ) : null}
        {action ? <div className="mt-2">{action}</div> : null}
      </div>
    </GlassPanel>
  );
};
