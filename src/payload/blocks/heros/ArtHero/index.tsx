import React, {CSSProperties} from "react";
import "@/styles/__archives.scss";
import {SingleArticle} from "@/payload/collections/Posts/post-types";
import {
	CoverAuthor,
	CoverCard,
	CoverImage,
	CoverMeta,
	CoverSubtitle,
	CoverTag,
	CoverTitle,
	CoverTitleCard,
	CoverWrap,
} from "./components";

export const SplitCard: React.FC<{
	post: SingleArticle;
}> = ({post}) => {
	const {category, image, author, publishedAt, title, subtitle} = post;

	return (
		<>
			<CoverWrap>
				<CoverCard className="_split">
					<CoverTitleCard>
						<CoverTag category={category} />
						<CoverTitle title={title} />
						<CoverSubtitle subtitle={subtitle} subtitleClassName="font-serif"
						               className="row-4 mt-[5px] md:mt-[20px] lg:pr-[20px] 2xl:pr-[40px]" />
						<CoverAuthor author={author} />
						<CoverMeta
							className="z-10 col-span-1 row-6 mt-[10px] font-sans text-[11.7px] leading-[1.17] uppercase md:text-[14px]"
							publishedAt={publishedAt} />
					</CoverTitleCard>
					<div
						className="relative col-start-1 col-end-1 row-start-2 row-end-2 overflow-hidden rounded-xl md:col-start-2 md:col-end-2 md:row-start-1 md:row-end-1">
						<CoverImage image={image} />
					</div>
				</CoverCard>
			</CoverWrap>
		</>
	);
};

export const HGlassCard: React.FC<{
	post: SingleArticle;
	color?: string;
}> = ({post, color = "var(--color-warm-yellow)"}) => {
	const {category, image, author, publishedAt, title, subtitle} = post;

	return (
		<>
			<CoverWrap>
				<CoverCard className="_split glass" style={
					{
						"--highlight": color,
					} as CSSProperties
				}>
					<CoverTitleCard>
						<CoverTag category={category} />
						<CoverTitle title={title} />
						<CoverSubtitle subtitle={subtitle} subtitleClassName="font-serif"
						               className="row-4 mt-[5px] md:mt-[20px] lg:pr-[20px] 2xl:pr-[40px]" />
						<CoverAuthor author={author} />
						<CoverMeta
							className="z-10 col-span-1 row-6 mt-[10px] font-sans text-[11.7px] leading-[1.17] uppercase md:text-[14px]"
							publishedAt={publishedAt} />
					</CoverTitleCard>
					<div className="rp_thumb">
						<CoverImage image={image} imgClassName="glass" />
					</div>
				</CoverCard>
			</CoverWrap>
		</>
	);
};
export const VGlassCard: React.FC<{
	post: SingleArticle;
	color?: string;
}> = ({post, color = "var(--color-warm-yellow)"}) => {
	const {category, image, author, publishedAt, title, subtitle} = post;

	return (
		<>
			<CoverWrap>
				<CoverCard className="_split glass" style={
					{
						"--highlight": color,
					} as CSSProperties
				}>
					<CoverTitleCard>
						<CoverTag category={category} />
						<CoverTitle title={title} />
						<CoverSubtitle subtitle={subtitle} subtitleClassName="font-serif"
						               className="row-4 mt-[5px] md:mt-[20px] lg:pr-[20px] 2xl:pr-[40px]" />
						<CoverAuthor author={author} />
						<CoverMeta
							className="z-10 col-span-1 row-6 mt-[10px] font-sans text-[11.7px] leading-[1.17] uppercase md:text-[14px]"
							publishedAt={publishedAt} />
					</CoverTitleCard>
					<div className="rp_thumb">
						<CoverImage image={image} imgClassName="glass" />
					</div>
				</CoverCard>
			</CoverWrap>
		</>
	);
};
