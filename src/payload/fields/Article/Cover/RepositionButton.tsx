"use client"
import {EASING} from "@/constants/animations"
import {cn} from "@/lib/utils"
import * as m from "motion/react-m"
import type {PointerEventHandler} from "react"

export const RepositionButton = ({startDrag, revertReposition, finishReposition}: {
	revertReposition: PointerEventHandler;
	startDrag: PointerEventHandler;
	finishReposition: PointerEventHandler
}) => {
	return <>
		<m.div
			key={"repositioningButton"}
			onPointerDown={startDrag}
			className={cn(
				"absolute inset-0 flex items-center justify-center gap-[8px] bg-transparent"
			)}
			initial={{
				opacity: 0,
				zIndex: -1
			}}
			exit={{
				opacity: [0, 0],
				zIndex: [null, -1],
				transition: {
					type: "tween",
					ease: EASING.power2.out,
					duration: 0.3
				}
			}}
			animate={{
				opacity: [0, 1],
				zIndex: [100, 100],
				transition: {
					type: "tween",
					ease: EASING.power2.out,
					duration: 0.3
				}
			}}
			transition={{
				type: "tween",
				duration: 0.3,
				ease: EASING.power2.out
			}}
		>
			<m.div
				className={"flex w-fit items-center rounded-[6px] bg-button-background px-1 shadow-sm/30"}
				data-themed="background-color, box-shadow"
			>
				<div
					className={cn(
						"flex h-10 min-w-0 shrink-0 items-center bg-transparent px-[6px] py-[4px] text-sm leading-[1.2] whitespace-nowrap text-muted-faded-background/80 transition-colors duration-200 ease-out-power2 select-none"
					)}
					aria-label="Reposition cover"
				>
					Reposition cover image
				</div>
			</m.div>
		</m.div>
		<m.div
			key={"confirmOrCancel"}
			className={cn(
				"absolute top-3 right-4 flex items-center justify-center gap-[8px] bg-transparent"
			)}
			variants={{
				animate: {
					zIndex: [null, 0],
					opacity: [0, 0],
					transition: {
						type: "tween",
						ease: EASING.power2.out,
						duration: 0.3
					}
				},
				hover: {
					zIndex: [155, 155],
					opacity: [0, 1],
					transition: {
						type: "tween",
						ease: EASING.power2.out,
						duration: 0.3
					}
				}
			}}
			initial={{
				zIndex: 0,
				opacity: 0
			}}
			exit="animate"
			animate={"hover"}
		>
			<m.div
				className={"flex w-fit items-center rounded-[6px] bg-faded-background/30 shadow-md"}
			>
				<div
					className="flex h-10 min-w-0 shrink-0 overflow-hidden rounded-l-[2px] rounded-r-sm bg-faded-foreground/10 px-[8px] py-[4px] leading-[1.2] text-foreground/80 transition-colors duration-200 ease-out-power3 select-none hover:bg-faded-foreground/70 hover:text-background/60"
					onPointerDown={revertReposition}
					data-themed={"color, background-color, border-color"}
					role="button"
					aria-label="Cancel update"
				>
          <span className={"text-sm leading-normal"}>
          Cancel</span>
				</div>
				<div
					onPointerDown={finishReposition}
					role="button"
					aria-label="Confirm reposition"
					data-themed={"color, background-color, border-color"}
					style={{
						flexShrink: 0,
						lineHeight: "1.2",
						minWidth: "0px"
					}}
					className="flex h-10 min-w-0 shrink-0 overflow-hidden rounded-l-[2px] rounded-r-sm bg-faded-foreground/10 px-[8px] py-[4px] leading-[1.2] text-foreground/80 transition-colors duration-200 ease-out-power3 select-none hover:bg-faded-foreground/70 hover:text-background/60"
				>
          <span className={"text-sm leading-normal"}>
            Save position
          </span>
				</div>
			</m.div>
		</m.div>
	</>
}
