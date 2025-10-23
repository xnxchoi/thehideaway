"use client";
import { useDomCursor } from "@/components/core/cursorWrapper";
import { cn } from "@/lib/utils";
import * as m from "motion/react-m";
import {
  useState,
  type ComponentProps,
  type ComponentPropsWithRef,
  type RefAttributes
} from "react";
import type { MotionBtnProps } from "../Link/types";

export const RP_Btn = (props: ComponentProps<"button">) => {
  const {
    onClick,
    disabled,
    onMouseLeave: doML,
    onMouseEnter: doME,
    ref,
    className,
    ...rest
  } = props;
  const { onMouseEnter, onMouseLeave } = useDomCursor<HTMLButtonElement>({
    onEnter: doME,
    enterCondition: () => (disabled ? null : "FOCUS"),
    onLeave: doML
  });

  return (
    <button
      disabled={disabled}
      onClick={onClick}
      ref={ref as RefAttributes<HTMLButtonElement>["ref"]}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      className={className}
      {...rest}
    ></button>
  );
};
export const MotionBtn = (props: MotionBtnProps) => {
  const {
    onClick,
    disabled,
    onMouseLeave: doML,
    onMouseEnter: doME,
    ref,
    initial,
    animate,
    ...rest
  } = props;
  const { onMouseEnter, onMouseLeave } = useDomCursor<HTMLButtonElement>({
    onEnter: doME,
    enterCondition: () => (disabled ? null : "FOCUS"),
    onLeave: doML
  });

  return (
    <m.button
      disabled={disabled}
      onClick={onClick}
      ref={ref}
      initial={
        initial || {
          opacity: 0
        }
      }
      animate={
        animate || {
          opacity: 1
        }
      }
      {...rest}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
    />
  );
};
export function Button(props: ComponentPropsWithRef<"button">) {
  return RP_Btn(props);
}
export const MotionPillButton = ({
  size = "sm",
  inverted = false,
  hover = false,
  ...props
}: {
  size?: "sm" | "md" | "lg";
  inverted?: boolean;
  hover?: boolean;
} & MotionBtnProps) => {
  const {
    onClick,
    disabled,
    onMouseLeave: doML,
    onMouseEnter: doME,
    className,
    ...rest
  } = props;
  const { onMouseEnter, onMouseLeave } = useDomCursor<HTMLButtonElement>({
    onEnter: (e) => {
      doME?.(e);
    },
    enterCondition: () => (disabled ? null : "FOCUS"),
    onLeave: (e) => {
      doML?.(e);
    }
  });

  return (
    <m.button
      disabled={disabled}
      className={cn(
        `flex appearance-none items-center justify-center overflow-hidden border-[0.1rem] border-transparent px-[1.2rem] text-sm leading-[2] font-light tracking-[-0.01em] backdrop-blur-[2.4rem] outline-none [text-decoration:none] hover:bg-transparent data-[hover=true]:bg-transparent max-md:px-[1.4rem]`,
        size === "sm"
          ? "h-[2.4rem] max-md:h-[2rem]"
          : size === "md"
            ? "h-[3.2rem] max-md:h-[2.56rem]"
            : "h-[3.6rem] text-3xl max-md:h-[2.88rem]",
        inverted
          ? "bg-button-background-inverted text-[oklch(var(--n-s-btn-inverted)/0.9)] hover:border-[oklch(var(--n-s-bb-inverted)/0.8)] data-[hover=true]:border-[oklch(var(--n-s-bb-inverted)/0.8)]"
          : "bg-button-background text-[oklch(var(--n-s-btn)/0.9)] hover:border-[oklch(var(--n-s-bb)/0.8)] data-[hover=true]:border-[oklch(var(--n-s-bb)/0.8)]",
        className
      )}
      data-hover={hover}
      onClick={onClick}
      {...rest}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
    />
  );
};
export const PillButton = ({
  size = "sm",
  inverted = false,
  ...props
}: {
  size?: "sm" | "md" | "lg";
  inverted?: boolean;
} & ComponentPropsWithRef<"button">) => {
  const [isHovered, setHovered] = useState(false);
  const {
    onClick,
    disabled,
    onMouseLeave: doML,
    onMouseEnter: doME,
    ref,
    ...rest
  } = props;
  const { onMouseEnter, onMouseLeave } = useDomCursor<HTMLButtonElement>({
    onEnter: doME,
    enterCondition: () => (disabled ? null : "FOCUS"),
    onLeave: doML
  });
  return (
    <button
      disabled={disabled}
      className={cn(
        `flex appearance-none items-center justify-center overflow-hidden border border-solid border-off-foreground/0 px-[1.4rem] text-sm leading-[2] font-light tracking-[-0.01em] backdrop-blur-[2.4rem] transition-[border-color,background-color,padding] duration-200 outline-none [text-decoration:none] md:px-[1.2rem]`,

        {
          "h-[2rem] rounded-[2rem] md:h-[2.4rem] md:rounded-[2.4rem]":
            size === "sm"
        },
        {
          "h-[2.56rem] rounded-[2.56rem] md:h-[3.2rem] md:rounded-[3.2rem]":
            size === "md"
        },
        {
          "h-[2.88rem] rounded-[2.88rem] text-3xl md:h-[3.6rem] md:rounded-[3.6rem]":
            size === "lg"
        },
        inverted
          ? "bg-button-background-inverted text-background/90 hover:border-off-foreground/80"
          : "bg-button-background text-foreground/90 hover:border-off-background/80",
        props?.className
      )}
      onClick={onClick}
      ref={ref as RefAttributes<HTMLButtonElement>["ref"]}
      {...rest}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
    />
  );
};
