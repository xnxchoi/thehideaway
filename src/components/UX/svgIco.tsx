import type {ComponentPropsWithRef, SVGAttributes} from "react";

type PathProp = SVGAttributes<SVGPathElement> & {
	"data-themed"?: string;
};

export type SVGIcoProps = ComponentPropsWithRef<"svg"> & {
	paths: Array<PathProp | string | [string, Omit<PathProp, "d">]>;
};

export const SvgIco = ({
	paths,
	width,
	height,
	viewBox,
	ref,
	...rest
}: SVGIcoProps) => {
	const w = width ?? 22;
	const h = height ?? 22;
	const dim = {
		width: w,
		height: h,
	};
	return (
		<svg xmlns="http://www.w3.org/2000/svg" width={dim.width} height={dim.height}
		     viewBox={viewBox} ref={ref}
		     {...rest}
		>
			{paths.map((path, index: number) => {
				if (typeof path === "string") {
					return <path key={index} d={path} />;
				}
				if (typeof path === "object") {
					if (path instanceof Array) {
						return <path key={index} {...path[1]} d={path[0]} />;
					} else {
						return <path key={index} {...path} />;
					}
				}
			})}
		</svg>
	);
};
