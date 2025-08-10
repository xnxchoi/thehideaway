"use client"
import {
	TextInputProps,
	useConfig,
	useField,
	useLocale,
	withCondition,
} from "@payloadcms/ui"

import {useCallback, useEffect, useMemo, useState} from "react"
import {TextFieldClientComponent} from "payload"
import {isFieldRTL} from "@payloadcms/ui/fields/shared"
import {mergeFieldStyles} from "@payloadcms/ui/shared"
import {Validate} from "payload"
import {TextInput} from "./TextInput"

export type {TextInputProps}
export {TextInput}
const TextFieldComponent: TextFieldClientComponent = (props) => {
	const {
		field,
		field: {
			admin: {className, description, placeholder, rtl} = {} as any,
			hasMany,
			label,
			localized,
			maxLength,
			maxRows,
			minLength,
			minRows,
			required,
		},
		inputRef,
		path: pathFromProps,
		readOnly,
		validate,
	} = props

	const locale = useLocale()

	const {
		config: {localization: localizationConfig},
	} = useConfig()

	const memoizedValidate = useCallback(
		(value, options) => {
			if (typeof validate === "function") {
				return validate(value, {...options, maxLength, minLength, required})
			}
		},
		[validate, minLength, maxLength, required],
	)

	const {
		customComponents: {
			AfterInput,
			BeforeInput,
			Description,
			Error,
			Label,
		} = {},
		disabled,
		path,
		setValue,

		showError,
		value,
	} = useField({
		potentiallyStalePath: pathFromProps,
		validate: memoizedValidate as Validate,
	})

	const renderRTL = isFieldRTL({
		fieldLocalized: localized ?? false,
		fieldRTL: rtl ?? false,
		locale,
		localizationConfig: localizationConfig || undefined,
	})

	const [valueToRender, setValueToRender] = useState<
		{ id: string; label: string; value: { value: string } }[]
	>([]) // Only for hasMany

	const handleHasManyChange = useCallback(
		(selectedOption) => {
			if (!(readOnly || disabled)) {
				let newValue
				if (!selectedOption) {
					newValue = []
				} else if (Array.isArray(selectedOption)) {
					newValue = selectedOption.map(
						(option) => option.value?.value || option.value,
					)
				} else {
					newValue = [selectedOption.value?.value || selectedOption.value]
				}

				setValue(newValue)
			}
		},
		[readOnly, setValue, disabled],
	)

	// useEffect update valueToRender:
	useEffect(() => {
		if (hasMany && Array.isArray(value)) {
			setValueToRender(
				value.map((val, index) => {
					return {
						id: `${val}${index}`, // append index to avoid duplicate keys but allow duplicate numbers
						label: `${val}`,
						value: {
							// React-select automatically uses "label-value" as a key, so we will get that react duplicate key warning if we just pass in the value as multiple values can be the same. So we need to append the index to the toString() of the value to avoid that warning, as it uses that as the key.
							toString: () => `${val}${index}`,
							value: val?.value || val,
						},
					}
				}),
			)
		}
	}, [value, hasMany])

	const styles = useMemo(() => mergeFieldStyles(field), [field])

	return (
		<TextInput AfterInput={AfterInput} BeforeInput={BeforeInput} className={className}
		           Description={Description} description={description} Error={Error}
		           hasMany={hasMany} inputRef={inputRef} Label={Label} label={label}
		           localized={localized} maxRows={maxRows} minRows={minRows} onChange={
			hasMany
				? handleHasManyChange
				: (e) => {
					setValue(e.target.value)
				}
		} path={path} placeholder={placeholder} readOnly={readOnly || disabled} required={required}
		           rtl={renderRTL} showError={showError} style={styles}
		           value={(value as string) || ""} valueToRender={valueToRender} />
	)
}

export default withCondition(TextFieldComponent)
