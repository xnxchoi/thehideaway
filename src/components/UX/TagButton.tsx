"use client"
import {Link} from "@/components/UX/Link/Link";
import {cn} from "@/lib/utils";
import {TagOverview} from "@/types/collections/meta-collections";
import {MakeRequired} from "@/utilities/typeUtilities";
import {ComponentProps} from "react";

export const TagButton = ({
	                          tag: tagg,
	                          className,

	                          rel,

	                          selected = false,
	                          ...props
                          }: Omit<ComponentProps<typeof Link>, "href"> & {
	selected?: boolean;
	tag: Omit<TagOverview, "title" | "slug"> & MakeRequired<Pick<TagOverview, "title" | "slug">>
}) => {
	return <Link

		className={cn("flex items-center rounded-[100px] relative border-[1px] border-solid border-transparent mr-3.5 bg-faded-foreground/10 data-[current=true]:bg-transparent hover:bg-transparent hover:border-faded-foreground data-[current=true]:border-faded-foreground ease-out-power2 transition-colors", className)}
		{...props} href={`/tagged/${tagg.slug}`} rel={rel || "noopener follow"} disabled={false}
		data-current={selected} data-active={selected}>
		<div className="px-6.5 text-sm whitespace-nowrap py-2 leading-[20px]">{tagg.title}</div>
	</Link>
}