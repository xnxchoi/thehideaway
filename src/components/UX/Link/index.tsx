"use client";

import { useDomCursor } from "@/components/core/cursorWrapper";
import {
  MotionBtnProps,
  RPLinkProps,
  RPLinkPropsWithRef
} from "@/components/UX/Link/types";
import { cn } from "@/lib/utils";
import { useVoyageur } from "@/stores/Routing/RP_Voyageur";
import { isInternalLink } from "@/utilities/isInternalLink";
import { useLenis } from "lenis/react";
import * as m from "motion/react-m";
import { useTransitionRouter } from "next-transition-router";
import NextLink from "next/link";
import {
  type ComponentPropsWithRef,
  MouseEventHandler,
  ReactNode,
  RefAttributes,
  useCallback,
  useEffect,
  useMemo,
  useState
} from "react";

const RP_Link = (props: RPLinkPropsWithRef) => {
  const {
    href,
    onClick,
    onMouseLeave: doML,
    onMouseEnter: doME,
    className,
    ref,
    ...rest
  } = props;

  const lenis = useLenis();

  const { onMouseEnter, onMouseLeave } = useDomCursor({
    onEnter: doME,
    onLeave: doML
  });
  const currentPath = useVoyageur((r) => r.pathName);
  const rout = useTransitionRouter();
  const propsToPass = useMemo(() => {
    const toPass: Partial<RPLinkProps> = {};
    if (!isInternalLink(href)) {
      toPass.target = "_blank";
      toPass.rel = "noreferrer";
    }
    return toPass;
  }, [href]);

  const [isAnchor, setIsAnchor] = useState(
    href.startsWith("#") || href.startsWith(`${currentPath}#`)
  );
  useEffect(() => {
    setIsAnchor(href.startsWith("#") || href.startsWith(`${currentPath}#`));
  }, [href, currentPath]);
  const handleClick: MouseEventHandler = useCallback(
    (e) => {
      e.preventDefault();
      if (isAnchor) {
        onClick?.();
        lenis && lenis.scrollTo(href);
      } else {
        onClick?.();
        rout.push(href);
      }
    },
    [href, isAnchor, lenis, rout, onClick]
  );
  if (!href || typeof href !== "string") {
    return <div className={className}>{props.children}</div>;
  }

  return (
    <NextLink
      className={cn(
        {
          link_hashLink: isAnchor
        },
        {
          link_inactive: !isAnchor && currentPath === href
        },
        className
      )}
      {...rest}
      {...propsToPass}
      href={href}
      onClick={handleClick}
      ref={ref as RefAttributes<HTMLAnchorElement>["ref"]}
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
        `flex appearance-none items-center justify-center overflow-hidden border-[0.1rem] border-transparent px-[1.2rem] text-sm leading-[2] font-light tracking-[-0.01em] backdrop-blur-[2.4rem] transition-[border-color,background-color,padding] duration-200 outline-none [text-decoration:none] max-md:px-[1.4rem]`,
        size === "sm"
          ? "h-[2.4rem] max-md:h-[2rem]"
          : size === "md"
            ? "h-[3.2rem] max-md:h-[2.56rem]"
            : "h-[3.6rem] text-3xl max-md:h-[2.88rem]",
        inverted
          ? "bg-button-background-inverted text-background/90 data-hover:border-off-foreground/80"
          : "bg-button-background text-foreground/90 data-hover:border-off-background/80",
        props?.className
      )}
      {...(isHovered && { "data-hovered": true })}
      onClick={onClick}
      ref={ref as RefAttributes<HTMLButtonElement>["ref"]}
      {...rest}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
    />
  );
};
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
export const RP_Btn = (props: ComponentPropsWithRef<"button">) => {
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
      className={cn(props?.className)}
      onClick={onClick}
      ref={ref as RefAttributes<HTMLButtonElement>["ref"]}
      {...rest}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
    />
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
      className={cn(props?.className)}
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

export function Link(props: RPLinkPropsWithRef) {
  return RP_Link(props);
}

export function LinkUnderlined(
  props: RPLinkPropsWithRef & {
    children: ReactNode;
  }
) {
  const { href, children, className, ...rest } = props;
  return (
    <span className="group relative mx-1 inline-flex items-center justify-center p-0">
      <Link
        href={href}
        className={cn(
          "ease no-underline decoration-0 transition-colors duration-200 hover:text-red-500",
          className
        )}
        {...rest}
      >
        {children}
      </Link>
      <span className="ease absolute bottom-[1px] left-0 z-0 h-[1px] w-full origin-left scale-x-0 transition-transform duration-300 group-hover:scale-x-100"></span>
      <span className="ease absolute bottom-[1px] left-0 z-0 h-px w-full origin-right scale-x-100 transition-transform duration-300 group-hover:scale-x-0"></span>
    </span>
  );
}
