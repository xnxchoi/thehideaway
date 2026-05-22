"use client";

import * as m from "motion/react-m";
import { cn } from "@/lib/utils";

interface MarkerTextProps {
  text: string;
  active?: boolean;
  className?: string;
}

const wordVariants = {
  hidden: { clipPath: "inset(-10% 105% -10% -5%)" },
  visible: {
    clipPath: "inset(-10% 0% -10% -5%)",
    transition: { duration: 0.3, ease: [0.16, 1, 0.3, 1] as const }
  }
};

export function MarkerText({
  text,
  active = false,
  className
}: MarkerTextProps) {
  const words = text.split(" ");
  return (
    <m.div
      className={cn("flex flex-wrap items-baseline gap-x-[0.38em]", className)}
      initial="hidden"
      animate={active ? "visible" : "hidden"}
      variants={{
        hidden: {},
        visible: { transition: { staggerChildren: 0.2, delayChildren: 0 } }
      }}
    >
      {words.map((word, i) => (
        <m.span
          key={`${word}-${i}`}
          variants={wordVariants}
          className="inline-block"
        >
          {word}
        </m.span>
      ))}
    </m.div>
  );
}
