"use client";
import {Link} from "src/components/UX/Link";
import {ArticleOverview} from "@/payload/collections/Posts/post-types";
import {
	ComponentPropsWithoutRef,
	useCallback,
	useEffect,
	useState,
} from "react";
import {RP_BadgeTag} from "@/components/UX/RP_BadgeTag";
import {FrontImage} from "@/components/UX/Media/FrontImage";
import {cn} from "@/lib/utils";

import {useTheme} from "@/providers/Theme";
import {Theme} from "@/providers/Theme/types";
import {useCursorStore} from "@/providers/RP_Pro";

export const HomeSquare = (
	props: { article: ArticleOverview } & ComponentPropsWithoutRef<"div">,
) => {
	const {article, ...rest} = props;
	const category =
		typeof article.category === "object"
			? article.category.title
			: "Uncategorized";
	const setCursorTheme = useCursorStore((r) => r.setCursorTheme);
	const resetCursorTheme = useCursorStore((r) => r.resetCursorTheme);
	const theme = useTheme((r) => r.theme);
	const [inverse, setInverse] = useState<Theme>(
		theme === "dark" ? "light" : "dark",
	);
	useEffect(() => {
		setInverse(theme === "dark" ? "light" : "dark");
	}, [theme]);
	const onEnter = useCallback(
		(r: Theme) => {
			setCursorTheme(r);
		},
		[setCursorTheme],
	);
	const onLeave = useCallback(() => {
		resetCursorTheme();
	}, [resetCursorTheme]);
	return (
		<Link onMouseEnter={() => onEnter(inverse)} onMouseLeave={() => onLeave()}
		      href={"/posts/" + `${article.slug}`}
		      className="items-center rounded-[10px] flex flex-col p-[20px] col-span-full text-center gap-y-[10px] bg-[oklch(var(--faded-fg)/.95)] dark:bg-off-white/95 text-[oklch(var(--faded-bg)/1)] lg:col-[1/-1]">
			<div
				className="pt-[56%] w-full rounded-[5px] relative min-w-[1px] min-h-[1px] overflow-hidden">
				{article.image ? (
					<FrontImage resource={article.image}
					            imgClassName="rounded-[5px] absolute object-cover top-0 block w-full h-full transition-opacity duration-400" />
				) : (
					<div
						className="rounded-[5px] absolute object-cover top-0 block w-full h-full transition-opacity duration-400" />
				)}
			</div>
			<RP_BadgeTag className="text-[oklch(var(--bg)/1)] border-[color:oklch(var(--bg)/1)]"
			             content={category} />
			<div className="flex flex-col pb-8 w-full items-center justify-center">
        <span className={cn(
	        "leading-[1] m-0 text-[2.8rem] lg:text-[4rem] font-serif",
        )}>
          {article.title}
        </span>
				<span
					className="m-0 font-sans leading-[1] text-[1.4rem] max-w-[70%] lg:mt-[-5px] lg:text-[1.6rem]">
          {article.subtitle}
        </span>
			</div>
			<div
				className="inline-block uppercase text-[1.1rem] max-w-[70%] lg:mt-[-10px] lg:text-[1.2rem]">
				By {article.author.name}
			</div>
		</Link>
	);
};
