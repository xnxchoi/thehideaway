import {cn} from "@/lib/utils";
import {useState} from "react";

export const Marquee = ({
	direction,
	texts,
}: {
	direction: "ltr" | "rtl";
	texts: string[];
}) => {
	const [state, setState] = useState<"playing" | "paused">("playing");
	return (
		<div
			className="relative z-200 flex overflow-hidden w-full h-[40px] justify-start items-center bg-[oklch(var(--button-background)/1)] text-[oklch(var(--n-s-btn)/1)]  ">
			<div className={cn(
				"absolute whitespace-nowrap will-change-transform",
				direction === "ltr"
					? "marquee-horizontal-ltr"
					: "marquee-horizontal-rtl",
			)} onMouseEnter={() => setState("paused")} onMouseLeave={() => setState("playing")}
			     data-state={state}>
				{[1, 2, 3, 4, 5, 6].map((_, idex) =>
						texts.map((text, index) => (
							<span key={index + text + idex} className={
								"flex-[0_0_auto] uppercase inline-block mr-[8vw] text-[14px]"
							}>
              {text}
            </span>
						)),
				)}
			</div>
		</div>
	);
};
export const CursorMarquee = () => {
};
