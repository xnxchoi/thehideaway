import Image from "next/image"

export const ItemLockedRed = () => {
	return (
		<div
			className="gap-x-0 bg-foreground rounded-sm flex justify-center items-center h-4 px-2 transition-width duration-200"
			style={{transition: 'width .2s cubic-bezier(.55, .085, .68, .53)'}}>
			<Image src="/assets/icons/lock_black.svg" loading="lazy" alt=""
			       className="w-[13px] h-auto inline-block vertical-align-middle max-w-full  2xl:h-[12px]" />
			<div className="c-item-tag-label"
			     style={{opacity: 0, display: 'none', height: '8px', width: '0px'}}>
				<div
					className="tracking-[-.01em] uppercaase whitespace-nowrap bg-transparent pt-[2px] text-[8px] font-bold leading-[6px] 2xl:leading-[.01em]">Non-NDA'd
				</div>
			</div>
		</div>
	)
}