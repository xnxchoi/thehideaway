import React from "react"

import {RPCard} from "@/payload/components/Card"
import {cn} from "@/lib/utils"
import {ArticleOverview} from "@/payload/collections/Posts/post-types"

export type RelatedPostsProps = {
	className?: string
	docs?: ArticleOverview[]
	introContent?: any
}

export const MoreLikeThis: React.FC<RelatedPostsProps> = (props) => {
	const {className, docs, introContent} = props
	return (
		<div className="fZb">
			{docs?.map((doc, index) => {
				return typeof doc !== "string" ? (
					<RPCard key={index} doc={doc} relationTo="posts"
					        className={cn("col-span-6", "col-span-" + 12 / docs.length)} />
				) : null
			}) || null}
		</div>
	)
}
