"use client";

import {useLenis} from "lenis/react";
import NextLink from "next/link";
import {
	type ComponentPropsWithRef,
	ReactNode,
	RefAttributes,
	useEffect,
	useMemo,
	useRef,
	useState,
} from "react";
import {cn} from "@/lib/utils";
import gsap from "gsap";
import {isInternalLink} from "@/utilities/isInternalLink";
import {useVoyageur} from "@/stores/Routing/RP_Voyageur";
import {delay} from "@/utilities/rp_utils";
import {useRouter} from "next/navigation";
import {useDomCursor} from "@/components/core/cursorWrapper";
import {useGSAP} from "@gsap/react";
import {useRPStore} from "@/providers/RP_Pro";
import * as m from "motion/react-m";
import {
	MotionBtnProps,
	RPLinkProps,
	RPLinkPropsWithRef,
} from "@/components/UX/Link/types";

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

	const clickRef = useRef<() => void>(null!);
	const setPageIsTransitioning = useRPStore((l) => l.setPageIsTransitioning);
	useGSAP((context, contextSafe) => {
		clickRef.current = () =>
			gsap.to(".rp-container .page", {
				opacity: 0,
				duration: 0.2,
				ease: "power2.inOut",
				onComplete: () => {
					setPageIsTransitioning(true);
					delay(200).then(() => {
						rout.push(href);
					});
				},
			});
	}, {});
	const lenis = useLenis();

	const {onMouseEnter, onMouseLeave} = useDomCursor({
		onEnter: doME,
		onLeave: doML,
	});
	const currentPath = useVoyageur((r) => r.pathName);
	const rout = useRouter();
	const propsToPass = useMemo(() => {
		const toPass: Partial<RPLinkProps> = {};
		if (!isInternalLink(href)) {
			toPass.target = "_blank";
			toPass.rel = "noreferrer";
		}
		return toPass;
	}, [href]);

	const [isAnchor, setIsAnchor] = useState(
		href.startsWith("#") || href.startsWith(`${currentPath}#`),
	);
	useEffect(() => {
		setIsAnchor(href.startsWith("#") || href.startsWith(`${currentPath}#`));
	}, [href, currentPath]);

	if (!href || typeof href !== "string") {
		return <div className={className}>{props.children}</div>;
	}
	return (
		<NextLink className={cn(
			{
				link_hashLink: isAnchor,
			},
			{
				link_inactive: !isAnchor && currentPath === href,
			},
			className,
		)}
		          {...rest}
		          {...propsToPass} href={href} onClick={(e) => {
			e.preventDefault();
			onClick?.();
			if (isAnchor) {
				lenis && lenis.scrollTo(href);
			} else {
				clickRef.current();
			}
		}} ref={ref as RefAttributes<HTMLAnchorElement>["ref"]} onMouseEnter={onMouseEnter}
		          onMouseLeave={onMouseLeave} />
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
	const {onMouseEnter, onMouseLeave} = useDomCursor({
		onEnter: doME,
		enterCondition: () => (disabled ? null : "FOCUS"),
		onLeave: doML,
	});

	return (
		<button disabled={disabled} className={cn(props?.className)} onClick={onClick}
		        ref={ref as RefAttributes<HTMLButtonElement>["ref"]}
		        {...rest} onMouseEnter={onMouseEnter} onMouseLeave={onMouseLeave} />
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
	const {onMouseEnter, onMouseLeave} = useDomCursor({
		onEnter: doME,
		enterCondition: () => (disabled ? null : "FOCUS"),
		onLeave: doML,
	});

	return (
		<m.button disabled={disabled} className={cn(props?.className)} onClick={onClick} ref={ref}
		          initial={
			          initial || {
				          opacity: 0,
			          }
		          } animate={
			animate || {
				opacity: 1,
			}
		}
		          {...rest} onMouseEnter={onMouseEnter} onMouseLeave={onMouseLeave} />
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
	},
) {
	const {href, children, className, ...rest} = props;
	return (
		<span className="group relative mx-1 inline-flex items-center justify-center p-0">
      <Link href={href} className={cn(
	      "ease no-underline decoration-0 transition-colors duration-200 hover:text-red-500",
	      className,
      )}
            {...rest}
      >
        {children}
      </Link>
      <span
	      className="ease absolute bottom-[1px] left-0 z-0 h-[1px] w-full origin-left scale-x-0 transition-transform duration-300 group-hover:scale-x-100"></span>
      <span
	      className="ease absolute bottom-[1px] left-0 z-0 h-px w-full origin-right scale-x-100 transition-transform duration-300 group-hover:scale-x-0"></span>
    </span>
	);
}
