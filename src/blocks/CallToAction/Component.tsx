"use client";
import { ReferencedLink } from "@/components/core/Link/ReferencedLink";
import type { CallToActionBlock as CTABlockProps } from "@/payload-types";

import RichText from "../../components/UX/RichText";
import React from "react";
import { getUrlFromReference } from "@/components/core/Link/ReferencedLink/getUrlFromReference";

export const CallToActionBlock: React.FC<
  {
    id?: string;
  } & CTABlockProps
> = ({ links, richText }) => {
  return (
    <div className="container">
      <div className="flex flex-col gap-8 rounded-sm border border-border bg-card p-4 md:flex-row md:items-center md:justify-between">
        <div className="flex max-w-3xl items-center">
          {richText && (
            <RichText className="mb-0" data={richText} enableGutter={false} />
          )}
        </div>
        <div className="flex flex-col gap-8">
          {(links || []).map(({ link }, i) => {
            return (
              !!link.url && (
                <ReferencedLink href={link.url} key={i} link={link} />
              )
            );
          })}
        </div>
      </div>
    </div>
  );
};
