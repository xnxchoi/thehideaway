import type {SingleArticle} from "@/payload/collections/Posts/post-types";
import type React from "react";
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
type INN='category'|'title'|'subtitle'|'publishedAt'| 'author'
export const FeaturedCard: React.FC<{
	post: Required<Pick<SingleArticle,INN>>&Partial<Omit<SingleArticle, INN>>;
}> = ({post}) => {
	const {category, image, author, publishedAt, title, subtitle} = post;
	const darkmode = image?.darkmode || false;
	return (
		<CoverWrap>
			<CoverCard className="featured group" data-theme={(darkmode && "dark") || ""}>
				<CoverTitleCard className={"group-dark:!text-faded-white"}>
					<CoverTag category={category} />
					<CoverTitle title={title} />
					<CoverSubtitle subtitle={subtitle} />
					<CoverAuthor author={author} className="leading-[1.17]" />
					<CoverMeta publishedAt={publishedAt} />
					<div className="featured rp_thumb">
						<CoverImage image={image} />
					</div>
				</CoverTitleCard>
			</CoverCard>
		</CoverWrap>
	);
};
