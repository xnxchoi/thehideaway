"use client"
import {ProgressiveBlur} from "@/components/UX/Blur/ProgressiveBlur";
import {useFloater} from "@/components/UX/Highlightr/providers/FloatProvider";
import type {SingleArticle} from "@/types/collections/posts";
import {useMotionValueEvent, useScroll} from "motion/react";
import React, {useRef} from "react";
import {
	CoverAuthor,
	CoverCard,
	CoverImage,
	CoverMeta,
	CoverSubtitle,
	CoverTag,
	CoverTitle,
	CoverTitleCard,
	CoverWrap
} from "./components";

type INN = "category" | "title" | "subtitle" | "publishedAt" | "author";
export const FeaturedCard: React.FC<{
	post: Required<Pick<SingleArticle, INN>> & Partial<Omit<SingleArticle, INN>>;
}> = ({post}) => {
	const {category, image, author, publishedAt, title, subtitle} = post;
	const darkmode = image?.value?.darkmode || false;
	const showBreadCrumb = useFloater(r => r.setShown);
	const ref = useRef<HTMLDivElement>(null!)
	const {scrollYProgress, scrollY} = useScroll({
		target: ref,
		offset: ["start start", "center 10%"]
	})
	const mmt = useRef(0)

	useMotionValueEvent(scrollYProgress, "change", args => {
		const now = performance.now()
		if (now - mmt.current > 100) {
			mmt.current = now
			console.log(`progress ${args}`)
			const prev = scrollY.getPrevious();
			if (prev === undefined) return;
			const isDown = scrollY.get() - prev > 0;
			if (isDown) {
				//then as long as the progress is greater than 0.15, we show the breadcrumbs
				if (args > 0.15) {
					showBreadCrumb(true)
				}
			} else {
				//if scrolling up, then it's a little different - ~ 0.35 is the minimum to show the breadcrumbs
				//if the value turns out to be indeed show-worthy, it's fine to probably offload the inverse (show breadcrumb) for the "scroll down" logic to do so.
				if (args < 0.35) {
					showBreadCrumb(false)
				}
			}
		}

	})
	return (
		<CoverWrap ref={ref}>
			<CoverCard
				className="featured group"
				data-theme={(darkmode && "dark") || ""}
			>
				<CoverTitleCard className={"group-dark:text-faded-white!"}>
					<CoverTag category={category}/>
					<CoverTitle title={title}/>
					<CoverSubtitle subtitle={subtitle}/>
					<CoverAuthor author={author} className="leading-[1.17]"/>
					<CoverMeta publishedAt={publishedAt}/>
					<div className="featured rp_thumb select-none">
						<CoverImage image={image}/>
						<ProgressiveBlur
							className={
								"absolute right-0 bottom-0 left-0 z-10 h-[45%] overflow-hidden rounded-(--cardBorder)"
							}
							direction={"bottom"}
						/>
						<div
							className={
								"absolute right-0 bottom-0 left-0 h-[45%] overflow-hidden rounded-(--cardBorder) bg-linear-to-b from-faded-white/0 from-20% via-faded-white/25 via-70% to-faded-white/45 to-100% group-dark:from-faded-black/0 group-dark:via-faded-black/25 group-dark:to-faded-black/65"
							}
						/>
						<div
							className="absolute right-0 bottom-0 left-0 z-5 h-full overflow-hidden rounded-(--cardBorder) bg-transparent backdrop-brightness-110 dark:backdrop-brightness-90"/>
					</div>
				</CoverTitleCard>
			</CoverCard>
		</CoverWrap>
	);
};
