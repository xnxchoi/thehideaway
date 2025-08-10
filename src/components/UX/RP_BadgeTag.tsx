import {ComponentPropsWithoutRef} from 'react'
import {cn} from '@/lib/utils'

export const RP_BadgeTag = (props: { content: string } & ComponentPropsWithoutRef<'span'>) => {
	const {content, className, ...rest} = props
	return <div className="text-[1.1rem]">
    <span className={cn(
	    'text-[10px] border-solid border-[1px] border-[oklch(var(--n-s-fg)/1)] text-[oklch(var(--n-s-fg)/1)] inline-block leading-[.95] tracking-[-.01em] text-center uppercase pt-[5px] pl-[9px] pr-[9px] pb-[5px] rounded-[20px] font-medium',
	    className)} {...rest}>{content}</span>
	</div>
}