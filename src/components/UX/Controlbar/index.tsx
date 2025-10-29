import "@/styles/executor.scss";
import { useCursor, useMenu, useRPStore } from "@/providers/RP_Pro";
import { type ReactNode, useCallback, useEffect, useRef } from "react";
import { Button } from "../Button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import Image from "next/image";
import { useShallow } from "zustand/shallow";
import { useMotionValue, useSpring } from "motion/react";
import { springGSAP } from "@/constants/animations";
import * as m from "motion/react-m";

export const Controlbar = () => {
  const setCursorTheme = useCursor((r) => r.setCursorTheme);
  const resetCursorTheme = useCursor((r) => r.resetCursorTheme);
  const setCur = useCallback(() => {
    setCursorTheme("dark");
  }, [setCursorTheme]);
  const ctrlRef = useRef<HTMLDivElement>(null!);
  const isSidebarOpen = useRPStore(useShallow((r) => r.sidebarOpen));
  const snapPoints = useRPStore(useShallow((r) => r.snapPoints));
  const bott = useMenu((r) => r.bottom);
  const op = useMotionValue(1);
	const locationBottom = useMotionValue(`0px`);
  const opacity = useSpring(op, {
    ...springGSAP.power3.out,
    visualDuration: 0.2,
    damping: 40,
    stiffness: 1000
  });
  const bottom = useSpring(locationBottom, {
    ...springGSAP.power3.out,
    visualDuration: 0.4,
    damping: 40,
    stiffness: 1000
  });
  useEffect(() => {
    // if (isSidebarOpen) {
    op.set(0);
    locationBottom.set(0 + "px");
    op.set(1);
    // } else {
    //   op.set(0);
    //   locationBottom.set(
    //     window.innerHeight * 0.65 - (ctrlRef.current?.offsetHeight || 50) + "px"
    //   );
    //   op.set(1);
    // }
  }, [isSidebarOpen, locationBottom, op, snapPoints]);
  return (
    <>
      <m.div
        ref={ctrlRef}
        className="fixed right-0 left-0 z-251 h-[30px] auto-cols-[1fr] grid-cols-[.5fr_2fr_.5fr] place-content-center place-items-center-safe gap-6 px-5"
        onMouseEnter={setCur}
        onMouseLeave={resetCursorTheme}
        style={{
          bottom,
          opacity
        }}
      >
        <div className="mx-auto flex h-[99%] items-center justify-center gap-x-4 rounded-[4px] px-8">
          <BTPopup
            content={
              <svg
                width="12"
                height="12"
                viewBox="0 0 15 15"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M8 2.75C8 2.47386 7.77614 2.25 7.5 2.25C7.22386 2.25 7 2.47386 7 2.75V7H2.75C2.47386 7 2.25 7.22386 2.25 7.5C2.25 7.77614 2.47386 8 2.75 8H7V12.25C7 12.5261 7.22386 12.75 7.5 12.75C7.77614 12.75 8 12.5261 8 12.25V8H12.25C12.5261 8 12.75 7.77614 12.75 7.5C12.75 7.22386 12.5261 7 12.25 7H8V2.75Z"
                  fill="currentColor"
                  fillRule="evenodd"
                  clipRule="evenodd"
                ></path>
              </svg>
            }
            popup="Write"
          />
          <BTPopup
            content={
              <svg
                width="12"
                height="12"
                viewBox="0 0 15 15"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M7.5 0.875C5.49797 0.875 3.875 2.49797 3.875 4.5C3.875 6.15288 4.98124 7.54738 6.49373 7.98351C5.2997 8.12901 4.27557 8.55134 3.50407 9.31167C2.52216 10.2794 2.02502 11.72 2.02502 13.5999C2.02502 13.8623 2.23769 14.0749 2.50002 14.0749C2.76236 14.0749 2.97502 13.8623 2.97502 13.5999C2.97502 11.8799 3.42786 10.7206 4.17091 9.9883C4.91536 9.25463 6.02674 8.87499 7.49995 8.87499C8.97317 8.87499 10.0846 9.25463 10.8291 9.98831C11.5721 10.7206 12.025 11.8799 12.025 13.5999C12.025 13.8623 12.2376 14.0749 12.5 14.0749C12.7623 14.075 12.975 13.8623 12.975 13.6C12.975 11.72 12.4778 10.2794 11.4959 9.31166C10.7244 8.55135 9.70025 8.12903 8.50625 7.98352C10.0187 7.5474 11.125 6.15289 11.125 4.5C11.125 2.49797 9.50203 0.875 7.5 0.875ZM4.825 4.5C4.825 3.02264 6.02264 1.825 7.5 1.825C8.97736 1.825 10.175 3.02264 10.175 4.5C10.175 5.97736 8.97736 7.175 7.5 7.175C6.02264 7.175 4.825 5.97736 4.825 4.5Z"
                  fill="currentColor"
                  fillRule="evenodd"
                  clipRule="evenodd"
                ></path>
              </svg>
            }
            popup="Read"
          />
          <BTPopup
            content={
              <svg
                width="12"
                height="12"
                viewBox="0 0 15 15"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M5.07505 4.10001C5.07505 2.91103 6.25727 1.92502 7.50005 1.92502C8.74283 1.92502 9.92505 2.91103 9.92505 4.10001C9.92505 5.19861 9.36782 5.71436 8.61854 6.37884L8.58757 6.4063C7.84481 7.06467 6.92505 7.87995 6.92505 9.5C6.92505 9.81757 7.18248 10.075 7.50005 10.075C7.81761 10.075 8.07505 9.81757 8.07505 9.5C8.07505 8.41517 8.62945 7.90623 9.38156 7.23925L9.40238 7.22079C10.1496 6.55829 11.075 5.73775 11.075 4.10001C11.075 2.12757 9.21869 0.775024 7.50005 0.775024C5.7814 0.775024 3.92505 2.12757 3.92505 4.10001C3.92505 4.41758 4.18249 4.67501 4.50005 4.67501C4.81761 4.67501 5.07505 4.41758 5.07505 4.10001ZM7.50005 13.3575C7.9833 13.3575 8.37505 12.9657 8.37505 12.4825C8.37505 11.9992 7.9833 11.6075 7.50005 11.6075C7.0168 11.6075 6.62505 11.9992 6.62505 12.4825C6.62505 12.9657 7.0168 13.3575 7.50005 13.3575Z"
                  fill="currentColor"
                  fillRule="evenodd"
                  clipRule="evenodd"
                ></path>
              </svg>
            }
            popup={"Help"}
          />
        </div>
      </m.div>
    </>
  );
};
const SubPopup = () => {
  return (
    <div
      className={
        "pointer-events-none fixed inset-x-[10px] top-auto bottom-[30px] z-[15] flex w-auto items-stretch justify-center overflow-visible bg-transparent px-[10px] py-0"
      }
    >
      <SubPopupSide side="left" />
      <div className="pointer-events-auto relative z-[2] -mb-2 flex max-w-[33.33%] flex-row items-center justify-start gap-[5px] overflow-auto rounded-[5px] bg-[oklch(var(--n-s-bg)/1)] px-[6px] pt-2 pb-2">
        <div className={"flex h-full items-center justify-between"}>
          <SubList
            items={[
              { title: "Write", content: "Write" },
              { title: "Read", content: "Read" },
              { title: "Image", content: "Image" }
            ]}
          />
        </div>
        <div className="sticky right-[-6px] z-[4] mr-[-5px] ml-[-5px] block h-full w-[5px] flex-none"></div>
      </div>
      <SubPopupSide side="right" />
    </div>
  );
};
const SubList = (props: { items: { title: string; content: string }[] }) => {
  return (
    <div
      className={
        "relative flex flex-row items-baseline justify-start 2xl:gap-x-2.5"
      }
    >
      {props.items.map((item, index) => (
        <SubListItem key={index} title={item.title} content={item.content} />
      ))}
    </div>
  );
};
const SubListItem = (props: { title: string; content: string }) => {
  return (
    <div className="relative flex flex-none items-center justify-center">
      <div
        className={
          "relative m-0 flex items-center justify-center gap-0 overflow-hidden rounded-[4px] px-2 py-1"
        }
      >
        <Tooltip>
          <TooltipTrigger
            render={() => (
              <Button
                className={
                  "flex items-center justify-center border-[1px] border-transparent text-[.875rem]"
                }
              >
                <div className="text-center font-sans font-medium text-[oklch(var(--n-s-fg)/1)] uppercase">
                  {props.title}
                </div>
              </Button>
            )}
          />
          <TooltipContent className="bg-cold-d-gray text-cold-l-gray">
            <p>{props.content}</p>
          </TooltipContent>
        </Tooltip>
      </div>
    </div>
  );
};
const SubPopupSide = (props: { side: "left" | "right" }) => {
  return (
    <div
      className={
        "relative z-[1] mx-[-1px] flex h-auto flex-col items-center justify-end"
      }
    >
      <div
        className={cn(
          "relative flex h-[4px] w-[4px] items-end",
          props.side === "left" ? "justify-end" : "justify-start"
        )}
      >
        {props.side === "left" ? (
          <>
            <Image
              src={"/assets/corner-ll.svg"}
              alt="sub-popup-side"
              className={"min-h-0"}
              width={4}
              height={4}
            />
            <div
              className={cn(
                "h-[10px] w-[5px] flex-none bg-[oklch(var(--n-s-bg)/1)]",
                "mr-[-4px]"
              )}
            ></div>{" "}
          </>
        ) : (
          <>
            <div
              className={cn(
                "h-[10px] w-[5px] flex-none bg-[oklch(var(--n-s-bg)/1)]",
                "ml-[-4px]"
              )}
            ></div>
            <Image
              src={"/assets/corner-lr.svg"}
              alt="sub-popup-side"
              className={"min-h-0"}
              width={4}
              height={4}
            />
          </>
        )}
      </div>
    </div>
  );
};
const BTPopup = (props: { content: ReactNode | string; popup: string }) => {
  return (
    <div
      className={
        "relative m-0 flex aspect-[16/9] h-[20px] items-center justify-center gap-0 overflow-hidden rounded-[2px]"
      }
    >
      <Tooltip>
        <TooltipTrigger
          render={() => (
            <Button
              className={
                "flex items-center justify-center border-[1px] border-transparent px-[6px] py-1 text-[1rem]"
              }
            >
              <div className="text-center text-[oklch(var(--n-s-fg)/1)] uppercase">
                {props.content}
              </div>
            </Button>
          )}
        />
        <TooltipContent className="bg-[oklch(var(--n-s-bg)/1)]">
          <p>{props.popup}</p>
        </TooltipContent>
      </Tooltip>
    </div>
  );
};
