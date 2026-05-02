import { ReferencedLink } from "@/components/core/Link/ReferencedLink";
import React from "react";
import { cn } from "@/lib/utils";

import RichText from "../../components/UX/RichText";
import type { ContentBlock as ContentBlockProps } from "@/payload-types";

export const ContentBlock: React.FC<
  {
    id?: string;
  } & ContentBlockProps
> = (props) => {
  const { columns } = props;

  const colsSpanClasses = {
    full: "12",
    half: "6",
    oneThird: "4",
    twoThirds: "8"
  };

  return (
    <div className="container my-16">
      <div className="grid grid-cols-4 gap-x-16 gap-y-8 lg:grid-cols-4 xl:gap-x-20">
        {columns &&
          columns.length > 0 &&
          columns.map((col, index) => {
            const { enableLink, link, richText, size } = col;

            return (
              <div
                className={cn(
                  `lg:col-span-4 col-span-${colsSpanClasses[size!]}`,
                  {
                    "md:col-span-2": size !== "full"
                  }
                )}
                key={index}
              >
                {richText && <RichText data={richText} enableGutter={false} />}
                {link && link.url && enableLink && (
                  <ReferencedLink href={link.url} link={link} />
                )}
              </div>
            );
          })}
      </div>
    </div>
  );
};
