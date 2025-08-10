import {Link} from "@/components/UX/Link"

export const CommentBubble = (props: { commentCount?: number; url: string }) => {
	const {commentCount = 0, url} = props
	return <Link
		className="relative inline-block z-10 min-w-[27px] px-[3px] py-[4px] border-muted border-[1px] rounded-[3px_3px_3px_0] whitespace-nowrap bg-transparent text-center before:content-[''] after:content-[''] before:left-0 before:-bottom-[4.5px] before:w-[5.5px] before:h-[5.5px] before:bg-background before:absolute after:absolute before:[clip-path:polygon(0_0,0_100%,100%_0)] after:[clip-path:polygon(0_0,0_100%,100%_0)] after:bg-muted after:-left-[1px] after:bottom-[-7px] after:w-[7px] after:h-[7px]"
		href={`${url}#comments`}>
        <span
	        className="data-[count=0]:before:content-['+'] before:text-[16px] before:leading-[4px] before:relative before:top-px group"
	        data-count={commentCount}>
            <span
	            className="text-[1.1rem] tracking-[-0.1em] leading-[1] text-[oklch(var(--faded-fg)/1)] uppercase group-data-[count=0]:hidden">
                {commentCount}
            </span>
        </span>
	</Link>
}
