import {useCallback, useRef} from "react"
import {parseBlob} from "music-metadata"
import {toast, UploadInput, useConfig, useField, type FieldType} from "@payloadcms/ui"
import type {UploadFieldClientProps} from "payload"
import {validate} from "uuid"


export default function TrackUploadComponent(props: UploadFieldClientProps) {
	const {
		field: {admin: {allowCreate} = {}, label, localized, relationTo, required},

		readOnly,
	} = props

	const {
		config: {
			routes: {api},
			serverURL,
		},
		getEntityConfig,
	} = useConfig()
	const metaData = useRef<any>(null)
	const {
		customComponents: {Error, Label} = {},
		filterOptions,
		path,
		setValue,
		showError,
		value,
	}: FieldType<string> = useField()

	const collection = getEntityConfig({collectionSlug: relationTo})
	const {value: track, setValue: setTrack} = useField({
		path: 'track'
	})
	const onTrackUpload = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
		const file = e.target.files?.[0]
		if (file) {
			try {
				metaData.current = await parseBlob(file)

			} catch (error) {
				console.error(error)

			}
		}
	}, [])
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
			const response = await fetch(`${url}/api/tracks`, {
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
	}, [])
	useCallback(
		(fileList?: FileList) => {
			let fileListToUse = fileList
			if (fileList && fileList.length > 0) {
				const file = fileList[0]
				if (!file) return
				if (file.type.startsWith("audio/")) {

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
		[],
	)
	return <div className={'w-full h-full flex items-start justify-center'}><input type="file"
	                                                                               onChange={onTrackUpload} />
	</div>
}
