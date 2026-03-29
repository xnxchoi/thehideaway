import React from "react";

import { ReferencedLink } from "@/components/core/Link/referencedLink";
import { Media } from "@/components/core/Media";
import RichText from "@/payload/fields/RichText";
import type { Page } from "@/payload-types";

export const MediumImpactHero: React.FC<Page["hero"]> = ({
  links,
  media,
  richText
}) => {
  return (
    <div className="">
      <div className="container mb-8">
        {richText && (
          <RichText className="mb-6" data={richText} enableGutter={false} />
        )}
        {Array.isArray(links) && links.length > 0 && (
          <ul className="flex gap-4">
            {links.map(({ link }, i) => {
              return (
                <li key={i}>
                  <ReferencedLink link={link} />
                </li>
              );
            })}
          </ul>
        )}
      </div>
      <div className="container">
        {media && typeof media === "object" && (
          <div>
            <Media
              className="mx-4 md:-mx-8 2xl:-mx-16"
              imgClassName=""
              priority={false}
              loading="lazy"
              resource={{
                relationTo: "media",
                value: media.id
              }}
            />
            {media?.caption && <div className="mt-3">{media.caption}</div>}
          </div>
        )}
      </div>
    </div>
  );
};
