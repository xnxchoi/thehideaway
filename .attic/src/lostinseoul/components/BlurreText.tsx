import { useMemo } from "react";
import { splitLostBlurLines } from "@lostinseoul/blur-motion";
import * as m from "motion/react-m";

export function BlurredText({
  interval = 200,

  text
}: {
  interval?: number;

  text: string;
}) {
  const content = useMemo(() => splitLostBlurLines(text), [text]);
  return (
    !content ||
    (Array.isArray(content) ? (
      <span className={"grid"}>
        {content.map((line, index) => (
          <m.span
            initial={{ filter: "blur(8px)" }}
            key={`${line}-${index}`}
            transition={{
              delay: (index * interval) / 1000,
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
    ) : (
      <m.span
        initial={{
          filter: "blur(8px)"
        }}
        transition={{ duration: 1, ease: [0.6, 0, 0.3, 1] }}
        viewport={{ once: true }}
        className={"inline-block"}
        whileInView={{ filter: "blur(0px)" }}
      ></m.span>
    ))
  );
}
