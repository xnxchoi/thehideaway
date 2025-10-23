"use client";

import { useDomCursor } from "@/components/core/cursorWrapper";
import { RPLinkProps, RPLinkPropsWithRef } from "@/components/UX/Link/types";
import { cn } from "@/lib/utils";
import { isInternalLink } from "@/utilities/isInternalLink";
import { useLenis } from "lenis/react";
import * as m from "motion/react-m";
import { Link as NextLink } from "next-transition-router";
// import NextLink from "next/link";
import {
  type ComponentProps,
  MouseEventHandler,
  ReactNode,
  RefAttributes,
  useCallback,
  useMemo
} from "react";
import { gsap } from "gsap";
import { useTransitionSetter } from "../Transition/useTransitionSetter";
import { usePathname } from "next/navigation";
import { useGSAP } from "@gsap/react";
import { delay } from "@/utilities/rp_utils";
const RP_Link = (props: RPLinkPropsWithRef) => {
  const {
    href,
    onClick,
    onMouseLeave: doML,
    onMouseEnter: doME,
    className,
    ref,
    disabled = false,
    ...rest
  } = props;

  const lenis = useLenis();

  const { onMouseEnter, onMouseLeave } = useDomCursor({
    onEnter: doME,
    onLeave: doML
  });
  const currentPath = usePathname();
  const propsToPass = useMemo(() => {
    const toPass: Partial<RPLinkProps> = {};
    if (!isInternalLink(href)) {
      toPass.target = "_blank";
      toPass.rel = "noreferrer";
    }
    return toPass;
  }, [href]);

  const isAnchor = useMemo(
    () => href.startsWith("#") || href.startsWith(`${currentPath}#`),
    [href, currentPath]
  );
  const { setGenericPageTransition } = useTransitionSetter();
  const { contextSafe } = useGSAP();
  const fadeOutPage = contextSafe(() => {
    gsap.to(".rp-container", {
      autoAlpha: 0,

      onStart: () => {
        console.log("link here setting rp to hidden");
      },
      duration: 0.3,
      ease: "power3.inOut"
    });
  });

  const handleClick: MouseEventHandler = useCallback(
    (e) => {
      onClick?.();
      if (isAnchor) {
        e.preventDefault();
        lenis && lenis.scrollTo(href);
      } else {
        setGenericPageTransition();
      }
    },
    [onClick, isAnchor, lenis, href, setGenericPageTransition]
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
      href={href}
      onClick={
        disabled
          ? (e) => {
              e.preventDefault();
            }
          : handleClick
      }
      ref={ref as RefAttributes<HTMLAnchorElement>["ref"]}
      onMouseEnter={disabled ? void 0 : onMouseEnter}
      onMouseLeave={disabled ? void 0 : onMouseLeave}
    />
  );
};
const NextMotion = m.create(RP_Link);
export function MotionLink(props: ComponentProps<typeof NextMotion>) {
  return <NextMotion {...props} />;
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
