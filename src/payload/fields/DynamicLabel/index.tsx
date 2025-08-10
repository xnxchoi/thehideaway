"use client"

import {useField, useFormFields} from "@payloadcms/ui"
import {useEffect, useState} from "react"

export default function DynamicLabel() {
	const {setValue} = useField({path: "username"})
	const {value: userHandle} = useField<string>({path: "name"})
	const userName = useFormFields(([fields]) => {
		return fields['username']?.value as string
	})
	const userDisplayName = useFormFields(([fields]) => {
		return fields['displayUsername']?.value as string
	})
	const [valueText, setValueText] = useState("")
	const [validated, setValidated] = useState(true)

	useEffect(() => {
		if (validated) {
			setValue(`@${userHandle}`)
		}
	}, [userHandle])
	return <></>
}
