"use client"
import type {
	Option,
	OptionObject,
	SelectFieldClientComponent,
	SelectFieldClientProps,
} from "payload"

import React, {useCallback, useMemo} from "react"

import type {SelectInputProps} from "./SelectInput"
import {SelectInput} from "./SelectInput"

import {useField, withCondition} from "@payloadcms/ui"
import {mergeFieldStyles} from "node_modules/@payloadcms/ui/dist/fields/mergeFieldStyles"

const formatOptions = (options: Option[]): OptionObject[] =>
	options.map((option) => {
		if (typeof option === "object" && (option.value || option.value === "")) {
			return option
		}

		return {
			label: option,
			value: option,
		} as OptionObject
	})

const SelectFieldComponent: SelectFieldClientComponent = (props) => {
	const {
		field,
		field: {
			name,
			admin: {
				/** @ts-expect-error payload stuff**/
				className /** @ts-expect-error payload stuff**/,
				description /** @ts-expect-error payload stuff**/,
				isClearable = true /** @ts-expect-error payload stuff**/,
				isSortable = true /** @ts-expect-error payload stuff**/,
				placeholder,
			} = {} as SelectFieldClientProps["field"]["admin"],
			hasMany = false,
			label,
			localized,
			options: optionsFromProps = [],
			required,
		},
		onChange: onChangeFromProps,
		path: pathFromProps,
		readOnly,
		validate,
	} = props

	const options = useMemo(
		() => formatOptions(optionsFromProps),
		[optionsFromProps],
	)

	const memoizedValidate = useCallback(
		(value, validationOptions) => {
			if (typeof validate === "function") {
				return validate(value, {
					...validationOptions,
					hasMany,
					options,
					required,
				})
			}
		},
		[validate, required, hasMany, options],
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
		potentiallyStalePath: pathFromProps /** @ts-expect-error payload stuff**/,
		validate: memoizedValidate,
	})

	const onChange: ReactSelectAdapterProps["onChange"] = useCallback(
		(selectedOption: OptionObject | OptionObject[]) => {
			if (!readOnly || disabled) {
				/** @ts-expect-error payload stuff**/
				let newValue: string | string[] = null
				if (selectedOption && hasMany) {
					if (Array.isArray(selectedOption)) {
						newValue = selectedOption.map((option) => option.value)
					} else {
						newValue = []
					}
				} else if (selectedOption && !Array.isArray(selectedOption)) {
					newValue = selectedOption.value
				}

				if (typeof onChangeFromProps === "function") {
					onChangeFromProps(newValue)
				}

				setValue(newValue)
			}
		},
		[readOnly, disabled, hasMany, setValue, onChangeFromProps],
	)

	const styles = useMemo(() => mergeFieldStyles(field), [field])

	return (
		<SelectInput AfterInput={AfterInput} BeforeInput={BeforeInput} className={className}
		             Description={Description} description={description} Error={Error}
		             hasMany={hasMany} isClearable={isClearable} isSortable={isSortable}
		             Label={Label} label={label} localized={localized} name={name}
		             onChange={onChange} options={options} path={path} placeholder={placeholder}
		             readOnly={readOnly || disabled} required={required} showError={showError}
		             style={styles} value={value as string | string[]} />
	)
}

export const SelectField = withCondition(SelectFieldComponent)

export {SelectInput, type SelectInputProps}
