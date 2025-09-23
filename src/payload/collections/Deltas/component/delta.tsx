"use client";
import { Link } from "@/components/UX/Link";
import { useHumanTime } from "./useLocaleDate";
import { DateTime } from "luxon";
import { CommentBubble } from "@/components/content/CommentBubble";
import { randomNumber } from "@/utilities/randomNumber";
import { SerializedRootNode } from "lexical";
import { CopyLinkButton } from "@/components/ui/copy-button";
import { getClientSideURL } from "@/utilities/getURL";
import { useDomCursor } from "@/components/core/cursorWrapper";
import { useState } from "react";
import { cn } from "../../../../lib/utils";

export const Delta = () => {
  const [hovered, setHovered] = useState(false);
  const { onMouseEnter, onMouseLeave } = useDomCursor({
    onEnter: () => setHovered(true),
    onLeave: () => setHovered(false)
  });
  return (
    <div
      className={cn(
        "group border-muted-fg relative border-b-[1px] px-4 pt-[16px] pb-[24px]",
        hovered
      )}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      data-themed={"background-color, border-color,color"}
    >
      <Link
        className="z-[1] after:absolute after:top-0 after:left-0 after:h-full after:w-full after:rounded-[3px] after:bg-transparent after:transition-colors after:duration-300 after:ease-power3 after:content-[''] hover:after:bg-muted/10"
        href="/"
      />
      <div className={"flex p-0 md:py-4"}>
        <DeltaMeta name="Claude" source="external" url={"slug"} />
        <DeltaInner slug={"slug"} />
      </div>
    </div>
  );
};
const DeltaGradient = (props: { start?: string; stop?: string }) => {
  const { start = "#FF3D00", stop = "#D6F31F" } = props;
  const rn = randomNumber(1, 999);
  return (
    <div className={"absolute ml-0 w-[24px]"}>
      <svg
        xmlns="http://www.w3.org/2000/svg"
        className={"block max-w-full align-middle"}
        viewBox="0 0 134.51 284.18"
      >
        <defs>
          <linearGradient id={`gradient${rn}`} gradientTransform="rotate(90)">
            <stop offset="40%" stopColor={start}></stop>
            <stop offset="55%" stopColor={stop}></stop>
          </linearGradient>
        </defs>
        <g id="Layer_2" data-name="Layer 2">
          <g id="Layer_1-2" data-name="Layer 1">
            <path
              fill={`url(#gradient${rn})`}
              className="cls-1"
              d="M110.91,165.78h0c-18-15.39-18-32,0-47.39h0a67.26,67.26,0,1,0-87.31,0h0c18,15.39,18,32,0,47.39h0a67.26,67.26,0,1,0,87.31,0Z"
            ></path>
          </g>
        </g>
      </svg>
    </div>
  );
};
const DeltaMeta = ({
  name,
  source,
  url
}: {
  name: string;
  source: string;
  url: string;
}) => {
  return (
    <div className="relative flex w-[38px] min-w-[38px] flex-col items-start">
      <DeltaGradient />
      <DeltaInitials name={name} />
      <DeltaSource source={source} />
      <div className="relative mt-5 flex w-[27px] items-center">
        <CommentBubble commentCount={0} url={url} />
      </div>
    </div>
  );
};
const DeltaSource = ({ source }: { source: string }) => {
  return (
    <div
      className={
        "z-[10] mt-[3px] flex h-[24px] w-[24px] justify-center p-2 text-center text-background"
      }
    >
      <span className={"flex w-full justify-center text-foreground"}>
        <svg
          width="12"
          height="13"
          viewBox="0 0 11 11"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <title>External Link</title>
          <path
            fillRule="evenodd"
            clipRule="evenodd"
            d="M6.8999 0.400024H10.8999V4.40002H9.8999V2.10713L4.8999 7.10713L4.1928 6.40002L9.1928 1.40002H6.8999V0.400024ZM2.3999 2.90002C2.12604 2.90002 1.8999 3.12617 1.8999 3.40002V8.90002C1.8999 9.03263 1.95258 9.15981 2.04635 9.25358C2.14012 9.34735 2.26729 9.40002 2.3999 9.40002H7.8999C8.03251 9.40002 8.15969 9.34735 8.25346 9.25358C8.34722 9.15981 8.3999 9.03263 8.3999 8.90002V5.90002H9.3999V8.90002C9.3999 9.29785 9.24187 9.67938 8.96056 9.96068C8.67926 10.242 8.29773 10.4 7.8999 10.4H2.3999C2.00208 10.4 1.62055 10.242 1.33924 9.96068C1.05794 9.67938 0.899902 9.29785 0.899902 8.90002V3.40002C0.899902 2.57388 1.57376 1.90002 2.3999 1.90002H5.3999V2.90002H2.3999Z"
            fill="currentColor"
          ></path>
        </svg>
      </span>
    </div>
  );
};
const DeltaInitials = ({ name }: { name: string }) => {
  const initial = name.charAt(0) || "R";
  return (
    <div
      className={
        "z-[10] flex h-[24px] w-[24px] justify-center px-[4px] py-[6px] text-center font-sans text-[11px] leading-[1]"
      }
    >
      {initial.toUpperCase()}
    </div>
  );
};
const DeltaInner = (props: { slug: string }) => {
  const { slug } = props;
  return (
    <div className="flex flex-[1_1] flex-col">
      <DeltaHeader slug={slug} />
    </div>
  );
};
const DeltaHeader = (props: { slug: string }) => {
  const { slug } = props;
  const timestamp = DateTime.now().toISO();
  return (
    <div className={"mb-1.5 flex md:justify-start"}>
      <div
        className={"mr-3 flex flex-wrap items-center"}
        style={{ justifyContent: "left" }}
      >
        <DeltaAuthor name={"Something"} />
        <DeltaTime timestamp={timestamp} />
      </div>
      <div className="relative flex items-center">
        <CopyLinkButton textToCopy={`${getClientSideURL()}/delta/${slug}`} />
      </div>
    </div>
  );
};
export const DeltaAuthor = ({ name }: { name: string }) => {
  return (
    <span
      className={
        "mr-3 inline text-[1.1rem] tracking-[0.1em] text-foreground uppercase"
      }
    >
      {name}
    </span>
  );
};

/**
 *
 * @param timestamp ISO formatted Date.

 */
export const DeltaTime = ({ timestamp }: { timestamp: string }) => {
  const formattedDate = useHumanTime(timestamp);
  return (
    <span
      className={
        "mr-3 inline text-[1.1rem] tracking-[0.1em] text-foreground uppercase"
      }
    >
      <time dateTime={timestamp}>{formattedDate}</time>
    </span>
  );
};
export const DeltaContent = (props: {
  title: string;
  content: SerializedRootNode;
}) => {
  const { title, content } = props;
  const contents = content.children;

  return (
    <div className={"mb-4 tracking-[2.08rem]"}>
      <DeltaTitle title={title} />
    </div>
  );
};
export const DeltaTitle = (props: { title: string }) => {
  const { title } = props;
  return (
    <div className={"inline pr-[4px] font-serif text-[1.6rem] tracking-normal"}>
      {title}
    </div>
  );
};
