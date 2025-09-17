"use client"

import {
	ChangeEventHandler,
	ClipboardEventHandler,
	DragEventHandler,
	useCallback, useState
} from "react"
import { cn } from "@/lib/utils"
import { useCursorHandlers } from "@/components/core/cursorWrapper"
import { AnimatePresence } from "motion/react"

import { UserMedia } from "@/payload-types"
import Image from "next/image"
import { toast } from "sonner"
import { getClientSideURL } from "@/utilities/getURL"
import * as m from "motion/react-m"

export type ProfileImageProps = {
	readonly path?: string


	readonly value: string | null
}
export default function ProfileImageField(props: ProfileImageProps) {
	const {
		path = 'image',
		value,
	} = props



	const [image, setImage] = useState<string>(value || "")
	const [dragging, setDragging] = useState(false)
	const [inserted, setInserted] = useState<boolean>(Boolean(value))
	const [hover, setHover] = useState<boolean>(false)


	const url = getClientSideURL()
	const onChange = useCallback(
		async (newValue: string | null) => {
			if (newValue) {
				setInserted(true)
				setImage(newValue)
			} else {
				setImage("")
				setInserted(false)
			}
		},
		[],
	)


	const [removeImage, setRemoveImage] = useState<boolean>(false)
	const onUploadSuccess = useCallback(
		(newDocs: Pick<UserMedia, "url" | "id" | "thumbnailURL" | "blurDataUrl">[]) => {
			const firstDoc = newDocs[0]
			const firstDc = firstDoc?.thumbnailURL || firstDoc?.url || firstDoc?.blurDataUrl
			if (firstDc) {
				toast.success("Image uploaded successfully")
				onChange(firstDc)
			}
		},
		[onChange],
	)
	const doUpload = useCallback(async (file: File) => {
		const formD = new FormData()
		formD.append("file", file)
		formD.append(
			"_payload",
			JSON.stringify({
				alt: "",
				caption: "An optional description for the file",
				_status: "published",
			}),
		)
		try {
			const response = await fetch(`${url}/api/userMedia`, {
				method: "POST",
				body: formD,
				credentials: "include",
			})
			if (response.ok) {
				const json = await response.json()
				onUploadSuccess([json.doc])
			}
		} catch (e) {
			toast.error("Welp, something went wrong. Try again?")
			console.log(e)
		}
	}, [onUploadSuccess, url])
	const onLocalFileSelection = useCallback(
		(fileList?: FileList) => {
			let fileListToUse = fileList
			if (fileList && fileList.length > 0) {
				const file = fileList[0]
				if (!file) return
				if (file.type.startsWith("image/")) {
					if (file.size > Number(process.env.NEXT_PUBLIC_IMAGE_MAX_FILE_SIZE)) {
						toast.error("Image is too large, select a file with 1mb or less")
						return
					}
					const dataTransfer = new DataTransfer()
					dataTransfer.items.add(file)
					fileListToUse = dataTransfer.files

					setImage(URL.createObjectURL(file))
					doUpload(file)
				} else {
					toast.error("File is not an image")
				}
			}
		},
		[doUpload],
	)


	const handleDragEnter: DragEventHandler<HTMLDivElement> = useCallback((e) => {
		e.preventDefault()
		e.stopPropagation()
		setDragging(true)
	}, [])

	const handleDragLeave: DragEventHandler<HTMLDivElement> = useCallback((e) => {
		e.preventDefault()
		e.stopPropagation()
		setDragging(false)
	}, [])
	const handleDrop: DragEventHandler<HTMLDivElement> = useCallback(
		(e) => {
			e.preventDefault()
			e.stopPropagation()
			setDragging(false)
			if (e.dataTransfer) {
				if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
					onLocalFileSelection(e.dataTransfer.files)
					setDragging(false)

					e.dataTransfer.clearData()
				}
			}
		},
		[onLocalFileSelection],
	)
	const onClickRemove = useCallback(() => {
		setRemoveImage(true)
		onChange(null)
	}, [onChange])
	const { onMouseEnter, onMouseLeave } = useCursorHandlers("dom")
	const handleDragOver: DragEventHandler<HTMLDivElement> = useCallback((e) => {
		e.preventDefault()
		e.stopPropagation()
	}, [])
	const handlePaste: ClipboardEventHandler<HTMLDivElement> = useCallback(
		(e) => {
			e.preventDefault()
			e.stopPropagation()

			if (e.clipboardData?.files && e.clipboardData.files.length > 0) {
				onLocalFileSelection(e.clipboardData.files)
			}
		},
		[onLocalFileSelection],
	)

	return (
		<div className="relative w-full flex items-center flex-col my-10">
			<div className={
				"w-full aspect-[3/2] relative flex items-center justify-center overflow-hidden rounded-lg border border-[oklch(var(--faded-bg)/.6)] bg-transparent transition-all duration-300"
			} onDragEnter={handleDragEnter} onDragOver={handleDragOver}
				onDragLeave={handleDragLeave} onDrop={handleDrop}
				onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)}
				onPaste={handlePaste}>

				<div
					className={cn("text-center relative p-5 transition-[z-index,opacity,border-color,background-color,color] duration-200 ease rounded-xl border-solid border-[1px] border-off-background px-3.5 py-1 hover:bg-muted-faded-background hover:text-off-background leading-[1.5]",)}
					onMouseEnter={onMouseEnter} onMouseLeave={onMouseLeave}>
					<input id={"user_settings_photo_file"} name={"user_settings[photo][file]"}
						className={cn(
							"cursor-none absolute inset-0 z-[10] h-full w-full overflow-hidden opacity-0",
							{ hidden: inserted },
						)} onChange={(e) => {
							if (e.target.files) {
								onLocalFileSelection(e.target.files)
							}
						}} accept="image/*" type={"file"} />
					<label className={"flex gap-2 items-center py-1 px-2"}
						htmlFor="user_settings_photo_file">
						<span className="text-lg">
							Upload File</span>
						<svg
							className="relative inline-block outline-none h-auto transition-colors bg-transparent duration-300"
							viewBox="0 0 20 20" width="25">
							<path xmlns="http://www.w3.org/2000/svg"
								d="M16.3,8.2C15.9,5.3,13.2,3,10,3C7.4,3,5.2,4.5,4.2,6.6C1.8,7.2,0,9.2,0,11.7c0,3,2.5,5.3,5.5,5.3 c0.6,0,1-0.4,1-1c0-0.6-0.4-1-1-1c-2,0-3.5-1.5-3.5-3.3c0-1.6,1.3-3,3-3.2c0.4,0,0.7-0.3,0.8-0.6C6.4,6.2,8,5,10,5 c2.5,0,4.4,1.9,4.4,4.1c0,0.6,0.4,1,1,1c1.5,0,2.6,1.1,2.6,2.4c0,1.3-1.1,2.4-2.6,2.4c-0.6,0-1,0.4-1,1c0,0.6,0.4,1,1,1 c2.5,0,4.6-1.9,4.6-4.4C20,10.4,18.4,8.7,16.3,8.2z"
								fill={"currentColor"} />
						</svg>
					</label>
				</div>
				<AnimatePresence initial={true} mode={"wait"}>
					{image && (
						<m.div initial={{
							visibility: "hidden",
							opacity: 0,
						}} animate={{
							visibility: "visible",
							opacity: 1,
							transition: {
								duration: 0.2,
								ease: "easeIn",
							},
						}} exit={{
							visibility: "hidden",
							opacity: 0,
							transition: {
								duration: 0.2,
								ease: "easeOut",
							},
						}} className="absolute inset-[0.5px] z-[1]">
							<Image className={cn("h-full w-full object-cover duration-200 transition-[filter]", hover && 'brightness-75 blur-lg')} src={image!} height={400}
								width={400} alt="" />
						</m.div>
					)}
				</AnimatePresence>
				{image && (
					<div className={cn(
						"absolute inset-0 flex items-center justify-center gap-[8px] bg-transparent transition-[z-index,opacity] duration-300", hover ? 'opacity-100 z-[55]' : 'opacity-0 z-[0]',
					)}>

						<span onMouseEnter={onMouseEnter} onMouseLeave={onMouseLeave}
							className="cursor-none rounded-xl relative z-[5] inline-flex h-[42px] min-w-[42px] items-center justify-center px-[20px] py-0 text-center leading-[42px] transition-colors duration-300 hover:bg-off-background/50 hover:text-rouge-700/85"
							onClick={onClickRemove}>
							<svg
								className="relative cursor-none bg-transparent mr-[.5em] inline-block w-[21px] h-auto fill-current align-middle transition-[fill] duration-300 border-none outline-none"
								viewBox="0 0 20 20" width="16">
								<path xmlns="http://www.w3.org/2000/svg"
									d="M12.4,0H7.6v2h4.8V0z M20,3.1H0v2h20V3.1z M8,6.9H6v9.3h2V6.9z M12,6.9h2v9.3h-2V6.9z M16.8,18 c0.6,0,1.2-0.5,1.2-1.2V7.1l2,0.6v9.1c0,1.7-1.4,3.2-3.2,3.2H3.2C1.4,20,0,18.6,0,16.8V7.8l2-0.6v9.7C2,17.5,2.5,18,3.2,18H16.8z" />
							</svg>

							<span>Remove</span>
						</span>
					</div>
				)}
			</div>
		</div>
	)
}
