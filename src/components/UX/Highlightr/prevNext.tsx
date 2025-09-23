"use client";
import { fallback } from "@/components/UX/Highlightr/Navigation/fallbacks";
import { Link } from "@/components/UX/Link";
import { useCursorStore, useMenu } from "@/providers/RP_Pro";
import { useWindowResize } from "@/utilities/use_window_resize";
import type { ArticleOverview } from "@/payload/collections/Posts/post-types";
import { useEffect, useRef, useState } from "react";

export const PrevNext = ({
  prev: previousPost,
  next: nextPost
}: {
  prev: ArticleOverview | null;
  next: ArticleOverview | null;
}) => {
  const [prev, setPreviousPost] = useState(
    previousPost || fallback({ direction: "prev" })
  );
  const [next, setNextPost] = useState(
    nextPost || fallback({ direction: "next" })
  );
  const lastResize = useWindowResize({
    detectVisibilityChange: false,
    detectHeightChange: true,
    debounce: 100
  });
  const resetCursorTheme = useCursorStore((r) => r.resetCursorTheme);
  const toggleCursorTheme = useCursorStore((r) => r.toggleCursorTheme);
  const containerRef = useRef<HTMLDivElement>(null!);
  const { bottom } = useMenu((r) => r.frames);
  const lastBottom = useRef(bottom);
  useEffect(() => {
    setPreviousPost(previousPost || fallback({ direction: "prev" }));
    setNextPost(nextPost || fallback({ direction: "next" }));
  }, [previousPost, nextPost]);
  useEffect(() => {
    if (!containerRef.current) {
      return;
    }

    const e = containerRef.current.getBoundingClientRect().height;
    const t = document.documentElement.clientHeight;
    containerRef.current.style.bottom = `${(e - t) * -1 - 36 + bottom}px`;
    lastBottom.current = bottom;
  }, [lastResize, bottom]);
  useEffect(() => {
    const throttledScroll = (() => {
      let isThrottled = false;

      return () => {
        if (!isThrottled) {
          if (
            window.scrollY > 2000 &&
            containerRef.current &&
            containerRef.current.getBoundingClientRect().top < 36
          ) {
            const e = containerRef.current.getBoundingClientRect().height;
            const t = window.innerHeight;
            containerRef.current.style.top = "auto";
            containerRef.current.style.bottom = `${(e - t) * -1 - 36 + lastBottom.current}px`;
          }

          isThrottled = true;
          setTimeout(() => {
            isThrottled = false;
          }, 100);
        }
      };
    })();
    window.addEventListener("scroll", throttledScroll);
    return () => {
      window.removeEventListener("scroll", throttledScroll);
    };
  }, []);
  return (
    <div
      className={
        "boder-t-[1px] sticky top-[0px] z-0 mt-[-10px] flex w-screen flex-col justify-between overflow-hidden border-0 border-solid border-foreground bg-[oklch(var(--faded-fg)/1)] pt-0 pb-[8px] text-background"
      }
      ref={containerRef}
      onMouseEnter={toggleCursorTheme}
      onMouseLeave={resetCursorTheme}
    >
      <div
        className="relative flex h-[calc(100svh-35px)] min-h-[400px] w-full items-start gap-[31px] bg-[oklch(var(--faded-fg)/1)] pb-[24px] after:absolute after:bottom-0 after:left-0 after:mt-[12px] after:h-px after:w-full after:border-t-[1px] after:border-solid after:border-foreground after:opacity-20 after:content-[''] min-lg:p-[0_27px_24px_26px] [&_h1]:m-0 [&_h1]:leading-[0.84] [&>a]:h-full [&>a]:w-1/2 [&>a]:text-faded-background"
        style={{ textDecoration: "none" }}
      >
        <div
          className={
            "pointer-events-none absolute top-0 left-[calc(50%-16px)] z-[1] h-full w-[32px] border-x-[1px] border-dashed border-muted-off-background/20 bg-faded-foreground after:absolute after:top-0 after:left-1/2 after:h-full after:w-px after:bg-muted-off-background/20 after:content-['']"
          }
        ></div>
        <Link
          href={`${prev.slug}`}
          onClick={resetCursorTheme}
          className={"overflow-hidden rounded-lg"}
        >
          <div className="relative flex h-full w-full flex-col justify-end bg-[oklch(var(--faded-fg)/1)] text-[oklch(var(--faded-bg)/1)] transition-colors duration-200 ease-out-power2 hover:bg-[oklch(var(--faded-bg)/1)] hover:text-[oklch(var(--faded-fg)/1)] min-lg:px-[14px] min-lg:py-[10px]">
            <h1 className="fixed !top-[55px] m-0 font-serif text-[calc(10px+5.8vmax+5.8vmin)] leading-[0.84] font-light tracking-[-0.05em]">
              Past&nbsp;
              <span>
                <em> musings</em>
              </span>
            </h1>
            <div className="m-0 flex h-auto w-full justify-between gap-12.5 font-mono text-base leading-[1.4] -tracking-[0.03em] break-words uppercase [&_span]:self-end [&_span]:min-lg:min-w-1/2">
              <span>
                {prev.title + " // "}
                <span>{prev.author.name}</span>
              </span>
              <span>{prev.subtitle}</span>
            </div>
          </div>
        </Link>
        <Link
          href={`${next.slug}`}
          onClick={resetCursorTheme}
          className={"overflow-hidden rounded-lg"}
        >
          <div className="relative flex h-full w-full flex-col justify-end bg-[oklch(var(--faded-fg)/1)] break-words text-[oklch(var(--faded-bg)/1)] transition-colors duration-200 ease-out-power2 hover:bg-[oklch(var(--faded-bg)/1)] hover:text-[oklch(var(--faded-fg)/1)] min-lg:px-[14px] min-lg:py-[10px]">
            <div className="fixed !top-[80px] z-[5] m-0 flex h-auto w-[calc(50%-44px)] justify-between gap-[32px] text-right font-mono text-base leading-[1.4] -tracking-[0.03em] uppercase min-lg:w-[calc(50%-97px)] min-lg:self-end min-lg:[&_span]:max-w-1/2">
              <span>
                {next.title + " // "}
                <span className={"hidden min-lg:inline"}>
                  {next.author.name}
                </span>
              </span>
              <span className={"hidden min-lg:inline"}>{next.subtitle}</span>
            </div>
            <h1
              className={
                "m-0 text-right font-serif text-[calc(10px+5.8vmax+5.8vmin)] leading-[0.84] font-light tracking-[-0.05em] min-lg:mr-[12px]"
              }
              style={{
                alignSelf: "flex-end"
              }}
            >
              &nbsp;<em>What&#39;s</em>&nbsp;Next
            </h1>
          </div>
        </Link>
        <div
          className={
            "absolute bottom-0 z-[2] h-[24px] w-full after:absolute after:top-0 after:left-0 after:z-[2] after:w-full after:border-t-[1px] after:border-solid after:border-background after:opacity-20 after:content-['']"
          }
        ></div>
      </div>
      <div
        className="pointer-events-none absolute top-0 left-[28px] z-[30] h-full w-[calc(100%-56px)] border-0 border-x-[1px] border-solid border-x-muted-faded-background opacity-20"
        style={{
          borderImage: "initial"
        }}
      />
    </div>
  );
};
