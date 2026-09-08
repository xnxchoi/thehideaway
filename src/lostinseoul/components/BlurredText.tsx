import { useMemo } from "react";
import {
  getLostBlurLineDelay,
  splitLostBlurLines
} from "@lostinseoul/blur-motion";
import * as m from "motion/react-m";

export function BlurredText({
  interval = 200,
  text
}: {
  interval?: number;
  text: string;
}) {
  const lines = useMemo(() => splitLostBlurLines(text), [text]);
  if (!text) return null;

  return (
    <span className="grid">
      {lines.map((line, index) => (
        <m.span
          initial={{ filter: "blur(8px)" }}
          key={`${line}-${index}`}
          transition={{
            delay: getLostBlurLineDelay(index, interval),
            duration: 0.3,
            ease: [0.6, 0, 0.3, 1]
          }}
          viewport={{ once: true }}
          whileInView={{ filter: "blur(0px)" }}
        >
          {line}
        </m.span>
      ))}
    </span>
  );
}
