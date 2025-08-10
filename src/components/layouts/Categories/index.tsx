"use client"
import {Link} from "@/components/UX/Link"
import {FrontImage} from "@/components/UX/Media/FrontImage"
import {RP_BadgeTag} from "@/components/UX/RP_BadgeTag"
import {cn} from "@/lib/utils"
import {ArticleOverview} from "@/payload/collections/Posts/post-types"
import {AnimatePresence} from "motion/react"
import * as m from "motion/react-m"
import {ComponentProps, useState} from "react"

export type SectionHeroProps = {
	posts: ArticleOverview[]
}
export const SectionHero = ({posts}: SectionHeroProps) => {
	const postList = posts.slice(0, 3)
	return (
		<div className="w-full h-full relative">
			<div className="flex flex-col items-center justify-center relative py-[1.6rem]">
				<div className="w-[calc(100%-20px)] max-w-[1440px] mx-[10px] rounded-[10px]">
					<div
						className="grid gap-y-[3rem] lg:gap-x-[2rem] lg:gap-y-[2.4rem] lg:grid-cols-[repeat(6,1fr)]">{
						postList.map((post, index) => {
							switch (index) {
								case 0:
									return <HeroTop key={post.slug} post={post} />
								case 1:
									return <HeroFeature key={post.slug} post={post} />
								case 2:
									return <HeroSub
										className={'lg:border-r-[1px] lg:col-[1/3]! lg:pl-0! lg:pr-[2rem]!'}
										key={post.slug} post={post} />
								case 3:
									return <HeroSub
										className={'lg:col-[3/5]! lg:px-[2rem]! lg:-ml-[2rem]'}
										key={post.slug} post={post} />
							}
						})
					}</div>
				</div>
			</div>
		</div>
	)
}
const HeroTop = ({post, className, ...rest}: { post: ArticleOverview } & ComponentProps<'div'>) => {
	const {title, slug, subtitle, image, author, category} = post;
	return (
		<div className={
			"items-center bg-background text-foreground rounded-[1rem] grid col-[1] p-[1rem] gap-y-[1rem] text-center lg:grid-cols-[1fr_1fr] lg:row-[1/3] lg:col-[1/5] lg:mb-0 lg:gap-x-[1rem]"
		}>
			<Link className="absolute top-0 left-0 z-0 w-full h-full"
			      href={`/posts/${slug}`}></Link>
			<HeroTopMedia image={image} />
			<HeroTopTag tag={category.title} />
			<HeroTopTitle title={title} />
			<HeroTopMeta author={author} />
			<HeroTopSubtitle subtitle={subtitle} />
		</div>
	);
}
const HeroTopTag = ({tag}: { tag: string }) => {
	return (
		<div className="col-[2/-1] order-2 text-[1rem] uppercase text-sans">
			<RP_BadgeTag content={tag} />
		</div>
	);
};
const RP_Image = (
	post: { image: ArticleOverview["image"] } & ComponentProps<"div">,
) => {
	const {image, className} = post;
	const [isLoading, setIsLoading] = useState(true);
	return (
		<div className={cn("rounded-[.5rem] pt-[100%] self-start w-full", className)}
		     data-loading={isLoading}>
			<AnimatePresence mode={"sync"} initial={false}>
				{isLoading && (
					<m.div initial={{opacity: 0}} animate={{
						opacity: 0.2,
						transition: {
							type: "tween",
							duration: 0.2,
							ease: "easeIn",
						},
					}} exit={{
						opacity: 0,
						transition: {
							type: "tween",
							duration: 0.2,
							ease: "easeOut",
						},
					}}
					       className="clip-sun animate-spinner absolute top-[50%] left-[50%] block h-[3.2rem] w-[3.2rem] origin-[0_0] transform-[translate(-50%,-50%)] bg-[oklch(var(--fg)/1)]"></m.div>
				)}
			</AnimatePresence>
			<FrontImage imgClassName={"absolute top-0 left-0"} resource={image}
			            onLoad={() => setIsLoading(false)} />
		</div>
	);
};
const HeroTopMedia = ({image}: { image: ArticleOverview["image"] }) => {
	return (
		<RP_Image image={image}
		          className={"col-1 row-[1/4] min-w-px min-h-px relative lg:row-[1/5]"} />
	);
};
const HeroTopTitle = ({title}: { title: ArticleOverview['title'] }) => {
	return (
		<p className={'text-[3.2rem] font-bold col-[2/-1] order-3 tracking-[-0.02em] leading-[.9] uppercase m-0 font-sans lg:text-[3.5rem]'}>
			{title}
		</p>)
}
const HeroTopSubtitle = ({subtitle}: { subtitle: ArticleOverview['subtitle'] }) => {
	return (<p className={'block order-4 text-[1.2rem] m-0 leading-[1.2] lg:col-[2]'}>
		{subtitle}
	</p>)
}
const HeroTopMeta = ({author}: { author: ArticleOverview['author'] }) => {
	return (<div
		className={'inline-block uppercase text-[1rem] font-medium font-sans order-5 opacity-100 before:clip-sun before:m-[0_auto_10px] before:block before:h-[12px] before:w-[12px] before:bg-foreground lg:col-[2]'}>By {author.name}</div>)
}
const HeroSub = ({
	className,
	post,
	...rest
}: { post: ArticleOverview } & ComponentProps<"div">) => {
	const {title, slug, subtitle, image, author, category} = post;
	return (
		<div className={cn(
			"grid grid-cols-[minmax(100px,1fr)_repeat(3,1fr)] grid-rows-[repeat(2,auto)_1fr] relative gap-y-[1rem] gap-x-[2rem] lg:border-b-[1px] lg:border-t-[1px] lg:py-[2.4rem] lg:px-0",
			className,
		)}>
			<Link className="absolute top-0 left-0 z-0 w-full h-full"
			      href={`/posts/${slug}`}></Link>
			<SubMedia image={post.image} />
			<SubTag tag={category.title} />
			<SubTitle title={title} />
		</div>
	);
};
const SubMedia = ({image}: { image: ArticleOverview["image"] }) => {
	return (
		<RP_Image className={"col-[1] row-[1/4] rounded-[1rem]"} image={image} />
	);
};
const SubTag = ({tag}: { tag: string }) => {
	return (<div className={'col-[2/-1] order-2 text-[1rem] uppercase text-sans'}>
		<RP_BadgeTag content={tag} />
	</div>)
}
const SubTitle = ({title}: { title: string }) => {
	return (
		<p className={'col-[2/-1] order-3 leading-[1.1] font-bold text-[1.5rem] uppercase text-sans'}>
			{title}
		</p>)
}
const HeroFeature = ({post}: { post: ArticleOverview }) => {

	return (
		<div className={
			"grid grid-cols-[2rem_1fr_2rem] grid-rows-[1fr] relative gap-y-[2rem] row-[4] rounded-[.5rem] lg:col-[5/-1] lg:row-[1/4]"
		}>
			<Link className="absolute top-0 left-0 z-0 w-full h-full" href={"/"}></Link>
			<RP_Image image={post.image} className={
				'col-[1/-1] row-[1/8] pt-[177%] rounded-[1rem] min-h-px self-start lg:h-full z-0 overflow-hidden lg:pt-0 after:content-[""] after:absolute after:inset-0 after:bg-gradient-to-b after:from-[oklch(var(--muted-bg)/0.1)] after:to-[80.6%] after:to-[oklch(var(--muted-bg)/1)] after:mix-blend-multiply'
			} />
			<div className={
				"col-[2] row-[3] order-2 text-[1rem] uppercase text-sans z-[1]"
			}>
				<RP_BadgeTag content={"tag"} />
			</div>
			<p className={
				"col-[2] row-[4] order-3 leading-[1.1] m-0 font-bold text-[2rem] uppercase text-sans lg:text-[3rem] z-[1]"
			}>
				A title </p>
			<div
				className="row-[6] col-[2] order-2 inline-block uppercase text-[1rem] font-medium font-sans z-[1]">
				By Someone
			</div>
			<p className="row-[5] col-[2] leading-[1.2] text-[1rem] z-[1]">
				Subtitle </p>
		</div>
	);
}