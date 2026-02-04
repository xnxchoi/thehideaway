"use client"

import {useField,} from "@payloadcms/ui"
import {useEffect, useState} from "react"

export default function DynamicLabel() {
	const {setValue} = useField({path: "username"})
	const {value: userHandle} = useField<string>({path: "name"})

	const [validated, setValidated] = useState(true)

	useEffect(() => {
		if (validated) {
			setValue(`@${userHandle}`)
		}
	}, [setValue, userHandle, validated])
	return <></>
}
