/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */
import * as React from "react";
import {JSX, useEffect, useRef, useState} from "react";
import {calculateZoomLevel} from "@payloadcms/richtext-lexical/lexical/utils";
import type {LexicalEditor} from "@payloadcms/richtext-lexical/lexical";
import {VaultButton} from "@/components/ui/button";
import {cn} from "@/lib/utils"

function clamp(value: number, min: number, max: number) {
	return Math.min(Math.max(value, min), max)
}

const Direction = {
	east: 1 << 0,
	north: 1 << 3,
	south: 1 << 1,
	west: 1 << 2,
}

export function ImageResizer({
	                             onResizeStart,
	                             onResizeEnd,
	                             buttonRef,
	                             imageRef,
	                             maxWidth,
	                             editor, draggingAllowed,
	                             showCaption, width, height,
	                             setShowCaption,
	                             captionsEnabled,
                             }: {
	editor: LexicalEditor
	buttonRef: { current: null | HTMLButtonElement }
	imageRef: { current: null | HTMLElement }
	draggingAllowed?: boolean
	maxWidth?: number
	width?: number;
	height?: number;
	onResizeEnd: (width: number, height: number) => void
	onResizeStart: () => void
	setShowCaption: (show: boolean) => void
	showCaption: boolean
	captionsEnabled: boolean
}): JSX.Element {
	const [enabled, setEnabled] = useState(draggingAllowed)
	useEffect(() => {
		setEnabled(draggingAllowed)
	}, [draggingAllowed])
	const controlWrapperRef = useRef<HTMLDivElement>(null)
	const userSelect = useRef({
		priority: "",
		value: "default",
	})
	const positioningRef = useRef<{
		currentHeight: number
		currentWidth: number
		direction: number
		isResizing: boolean
		ratio: number
		startHeight: number
		startWidth: number
		startX: number
		startY: number
	}>({
		currentHeight: 0,
		currentWidth: 0,
		direction: 0,
		isResizing: false,
		ratio: 0,
		startHeight: 0,
		startWidth: 0,
		startX: 0,
		startY: 0,
	})
	const editorRootElement = editor.getRootElement()
	// Find max width, accounting for editor padding.
	const maxWidthContainer = maxWidth
		? maxWidth
		: editorRootElement !== null
			? editorRootElement.getBoundingClientRect().width - 20
			: 100
	const maxHeightContainer =
		editorRootElement !== null
			? editorRootElement.getBoundingClientRect().height - 20
			: 100

	const minWidth = 100
	const minHeight = 100

	const setStartCursor = (direction: number) => {
		const ew = direction === Direction.east || direction === Direction.west
		const ns = direction === Direction.north || direction === Direction.south
		const nwse =
			(direction & Direction.north && direction & Direction.west) ||
			(direction & Direction.south && direction & Direction.east)

		const cursorDir = ew ? "ew" : ns ? "ns" : nwse ? "nwse" : "nesw"

		if (editorRootElement !== null) {
			editorRootElement.style.setProperty(
				"cursor",
				`${cursorDir}-resize`,
				"important"
			)
		}
		if (document.body !== null) {
			document.body.style.setProperty(
				"cursor",
				`${cursorDir}-resize`,
				"important"
			)
			userSelect.current.value = document.body.style.getPropertyValue(
				"-webkit-user-select"
			)
			userSelect.current.priority = document.body.style.getPropertyPriority(
				"-webkit-user-select"
			)
			document.body.style.setProperty(
				"-webkit-user-select",
				`none`,
				"important"
			)
		}
	}

	const setEndCursor = () => {
		if (editorRootElement !== null) {
			editorRootElement.style.setProperty("cursor", "text")
		}
		if (document.body !== null) {
			document.body.style.setProperty("cursor", "default")
			document.body.style.setProperty(
				"-webkit-user-select",
				userSelect.current.value,
				userSelect.current.priority
			)
		}
	}

	const handlePointerDown = (
		event: React.PointerEvent<HTMLDivElement>,
		direction: number
	) => {
		if (!editor.isEditable()) {
			return
		}

		const image = imageRef.current
		const controlWrapper = controlWrapperRef.current

		if (image !== null && controlWrapper !== null) {
			event.preventDefault()
			const {width, height} = image.getBoundingClientRect()
			const zoom = calculateZoomLevel(image)
			const positioning = positioningRef.current
			positioning.startWidth = width
			positioning.startHeight = height
			positioning.ratio = width / height
			positioning.currentWidth = width
			positioning.currentHeight = height
			positioning.startX = event.clientX / zoom
			positioning.startY = event.clientY / zoom
			positioning.isResizing = true
			positioning.direction = direction

			setStartCursor(direction)
			onResizeStart()

			controlWrapper.classList.add("touch-action-none")

			image.style.width = `${width}px`

			document.addEventListener("pointermove", handlePointerMove)
			document.addEventListener("pointerup", handlePointerUp)
		}
	}
	const handlePointerMove = (event: PointerEvent) => {
		const image = imageRef.current
		const positioning = positioningRef.current

		const isHorizontal =
			positioning.direction & (Direction.east | Direction.west)
		const isVertical =
			positioning.direction & (Direction.south | Direction.north)

		if (image !== null && positioning.isResizing) {
			const zoom = calculateZoomLevel(image)
			// Corner cursor
			if (isHorizontal && isVertical) {
				let diff = Math.floor(positioning.startX - event.clientX / zoom)
				diff = positioning.direction & Direction.east ? -diff : diff

				const width = clamp(
					positioning.startWidth + diff,
					minWidth,
					maxWidthContainer
				)

				const height = width / positioning.ratio
				image.style.width = `${width}px`
				positioning.currentHeight = image.offsetHeight;
				positioning.currentWidth = width
			} else if (isVertical) {
				let diff = Math.floor(positioning.startY - event.clientY / zoom)
				diff = positioning.direction & Direction.south ? -diff : diff

				const height = clamp(
					positioning.startHeight + diff,
					minHeight,
					maxHeightContainer
				)

				image.style.height = `${height}px`
				positioning.currentHeight = height
			} else {
				let diff = Math.floor(positioning.startX - event.clientX / zoom)
				diff = positioning.direction & Direction.east ? -diff : diff

				const width = clamp(
					positioning.startWidth + diff,
					minWidth,
					maxWidthContainer
				)

				image.style.width = `${width}px`
				positioning.currentWidth = width
			}
		}
	}
	const handlePointerUp = () => {
		const image = imageRef.current
		const positioning = positioningRef.current
		const controlWrapper = controlWrapperRef.current
		if (image !== null && controlWrapper !== null && positioning.isResizing) {
			const width = positioning.currentWidth
			const height = positioning.currentHeight
			positioning.startWidth = 0
			positioning.startHeight = 0
			positioning.ratio = 0
			positioning.startX = 0
			positioning.startY = 0
			positioning.currentWidth = 0
			positioning.currentHeight = 0
			positioning.isResizing = false

			controlWrapper.classList.remove("touch-action-none")

			setEndCursor()
			onResizeEnd(width, height)

			document.removeEventListener("pointermove", handlePointerMove)
			document.removeEventListener("pointerup", handlePointerUp)
		}
	}
	return (
		<div className={"grow relative overflow-hidden"} ref={controlWrapperRef}>
			{!showCaption && captionsEnabled && (
				<VaultButton
					className="image-caption-button absolute bottom-1 left-1/2 -translate-x-1/2"
					ref={buttonRef}
					variant={"outline"}
					onClick={() => {
						setShowCaption(!showCaption)
					}}
				>
					Add Caption
				</VaultButton>
			)}

			<div
				className={cn("image-resizer image-resizer-e  absolute top-0 flex cursor-ew-resize h-full w-6 items-center justify-center right-0 z-1 group", !draggingAllowed && "pointer-events-none")}

			>
				<div
					className={"group-hover:opacity-100 transition-opacity duration-200 ease-out-power2 w-2.5 h-[48px] max-h-1/2 rounded-[20px] border border-solid border-foreground/90 opacity-0"}
					role="button"
					onPointerDown={(event) => {
						handlePointerDown(event, Direction.east)
					}}
				/>
			</div>

			<div
				className={cn("image-resizer image-resizer-w  absolute top-0 flex cursor-ew-resize h-full w-6 items-center justify-center left-0 z-1 group", !draggingAllowed && "pointer-events-none")}

			>
				<div
					className={"group-hover:opacity-100 transition-opacity duration-200 ease-out-power2 w-2.5 h-[48px] max-h-1/2 rounded-[20px] border border-solid border-foreground/90 opacity-0"}
					role="button"
					onPointerDown={(event) => {
						handlePointerDown(event, Direction.west)
					}}
				/>
			</div>

		</div>
	)
}