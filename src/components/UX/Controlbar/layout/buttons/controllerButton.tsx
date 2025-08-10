"use client";

import {usePathname} from "next/navigation";
import type {ButtonHTMLAttributes, ForwardedRef, ReactNode, Ref} from "react";
import {forwardRef} from "react";

import {Link} from "@/components/UX/Link";
import type {SVGIcoProps} from "@/components/UX/svgIco";
import {SvgIco} from "@/components/UX/svgIco";
import {RPTooltip} from "@/components/UX/tooltip";
import {cn} from "@/lib/utils";
import {LinkProps} from "next/link";
import {Button} from "@/components/ui/button";
import {RPLinkProps} from "@/components/UX/Link/types";

export type ExecutorSlot<Type> = {
	[Property in keyof Type]: Type[Property] extends (
			...args: infer Args
		) => infer Return
		? (...args: Args) => Return
		: never;
};
export type MenuButtonProps<
	T extends HTMLButtonElement | ReturnType<typeof Link>,
> = {
	el: T extends HTMLButtonElement
		? ButtonHTMLAttributes<HTMLButtonElement>
		: LinkProps;
} & {
	style?: React.CSSProperties;
	"data-action"?: string;
	"data-target"?: string;
	"data-post-author"?: string;
	"data-tab"?: string;
	title?: string;
	label?: string;
	onClick?: () => void;
	onMouseEnter?: () => void;
	onMouseLeave?: () => void;
	name?: string;
	children?: ReactNode;
} & {
	icon?: SVGIcoProps;
	className?: string;
	href?: string;
};
export type ControlIconButtonProps = ButtonHTMLAttributes<HTMLButtonElement> &
	SVGIcoProps & {
	title?: string;
	label?: string;
};
export type ControlIconLinkProps = RPLinkProps &
	SVGIcoProps & { title?: string; label?: string };
export const ControllerButton = forwardRef<
	HTMLButtonElement | HTMLAnchorElement,
	MenuButtonProps<any>
>((props, ref) => {
	const cl = cn("menu-float__item has-tooltip", ...(props.className ?? ""));

	const paths = props?.icon?.paths;
	const pathname = usePathname();
	const title = props.title ?? props.name ?? "";
	const label = props.label ?? title;
	let pr = props
		? props?.href
			? (props.el as ButtonHTMLAttributes<HTMLButtonElement>)
			: (props.el as LinkProps)
		: {};
	return (
		props && (
			<li className="ha-button__wrapper" style={props?.style}>
				{props.href && (props.href.length ?? 0) > 0 ? (
					<>
						<Link className={cn(cl, {
							"js-menu-anchor":
								props.href.startsWith("#") ||
								props.href.startsWith(`${pathname}#`),
						})} ref={ref as Ref<HTMLAnchorElement>} href={props.href} title={title}
						      aria-label={label}>
							{paths && paths?.length > 0 ? (
								<SvgIco {...props.icon} paths={paths} />
							) : (
								<div>{title}</div>
							)}
						</Link>{" "}
						<RPTooltip label={label} />
					</>
				) : (
					<Button
						{...(pr as ButtonHTMLAttributes<HTMLButtonElement>)}
						ref={ref as ForwardedRef<HTMLButtonElement>} className={cl} title={title}
						aria-label={label}>
						{paths && paths.length > 0 ? (
							<SvgIco paths={paths} />
						) : (
							<div>{title}</div>
						)}
						<RPTooltip label={label} />
					</Button>
				)}{" "}
			</li>
		)
	);
});
