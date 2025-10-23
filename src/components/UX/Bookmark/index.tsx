"use client";
import { ComponentProps, useEffect, useRef, useState } from "react";
import { Button } from "../Button";

export type BookmarkProps = {
  articleId: string;
  userId: string;
};
export const Bookmark = (props) => {
  const bookmarkRef = useRef<HTMLButtonElement>(null);
  const [bookmarked, setBookmarked] = useState(false);
  const [disabled, setDisabled] = useState(false);
  useEffect(() => {
    if (bookmarkRef.current) {
      bookmarkRef.current.style.setProperty(
        "background-color",
        "oklch(var(--faded-black)/1)"
      );
    }
  }, []);

  return (
    <Button
      ref={bookmarkRef}
      className="m-0 flex h-[20px] w-[20px] items-center justify-center p-0 disabled:opacity-50"
      disabled={disabled}
    >
      <svg
        width="15"
        height="15"
        viewBox="0 0 15 15"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d={bPath({ bookmarked })}
          fill="currentColor"
          fillRule="evenodd"
          clipRule="evenodd"
        />
      </svg>
    </Button>
  );
};
const bPath = (
  props: {
    bookmarked?: boolean;
  } = { bookmarked: false }
): ComponentProps<"path">["d"] => {
  return props.bookmarked
    ? "M3.5 2C3.22386 2 3 2.22386 3 2.5V13.5C3 13.6818 3.09864 13.8492 3.25762 13.9373C3.41659 14.0254 3.61087 14.0203 3.765 13.924L7.5 11.5896L11.235 13.924C11.3891 14.0203 11.5834 14.0254 11.7424 13.9373C11.9014 13.8492 12 13.6818 12 13.5V2.5C12 2.22386 11.7761 2 11.5 2H3.5Z"
    : "M3 2.5C3 2.22386 3.22386 2 3.5 2H11.5C11.7761 2 12 2.22386 12 2.5V13.5C12 13.6818 11.9014 13.8492 11.7424 13.9373C11.5834 14.0254 11.3891 14.0203 11.235 13.924L7.5 11.5896L3.765 13.924C3.61087 14.0203 3.41659 14.0254 3.25762 13.9373C3.09864 13.8492 3 13.6818 3 13.5V2.5ZM4 3V12.5979L6.97 10.7416C7.29427 10.539 7.70573 10.539 8.03 10.7416L11 12.5979V3H4Z";
};
