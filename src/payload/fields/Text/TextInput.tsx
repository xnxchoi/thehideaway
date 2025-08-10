'use client'
import {fieldBaseClass, ReactSelect, TextInputProps, useTranslation} from "@payloadcms/ui"
import {ReactSelectAdapterProps} from "node_modules/@payloadcms/ui/dist/elements/ReactSelect/types"
import {ChangeEvent} from "react"

export const TextInput: React.FC<TextInputProps> = (props) => {
	const {
		AfterInput,
		BeforeInput,
		className,
		Description,
		description,
		Error,
		hasMany,
		inputRef,
		Label,
		label,
		localized,
		maxRows,
		onChange,
		onKeyDown,
		path,
		placeholder,
		readOnly,
		required,
		rtl,
		showError,
		style,
		value,
		valueToRender,
	} = props

	const {i18n, t} = useTranslation()

	const editableProps: NonNullable<ReactSelectAdapterProps['customProps']>['editableProps'] = (
		data,
		className,
		selectProps,
	) => {
		const editableClassName = `${className}--editable`

		return {
			onBlur: (event: React.FocusEvent<HTMLDivElement>) => {
				event.currentTarget.contentEditable = 'false'
			},
			onClick: (event: React.MouseEvent<HTMLDivElement>) => {
				event.currentTarget.contentEditable = 'true'
				event.currentTarget.classList.add(editableClassName)
				event.currentTarget.focus()
			},
			onKeyDown: (event: React.KeyboardEvent<HTMLDivElement>) => {
				if (event.key === 'Enter' || event.key === 'Tab' || event.key === 'Escape') {
					event.currentTarget.contentEditable = 'false'
					event.currentTarget.classList.remove(editableClassName)
					data.value.value = event.currentTarget.innerText
					data.label = event.currentTarget.innerText

					if (data.value.value.replaceAll('\n', '')) {
						selectProps?.onChange?.(selectProps.value, {
							action: 'create-option',
							option: data,
						})
					} else {
						if (Array.isArray(selectProps.value)) {
							const newValues = selectProps.value.filter((v) => v.id !== data.id)
							selectProps?.onChange?.(newValues, {
								action: 'pop-value',
								removedValue: data,
							})
						}
					}

					event.preventDefault()
				}
				event.stopPropagation()
			},
		}
	}

	return (
		<div className={[
			fieldBaseClass,
			'text',
			className,
			showError && 'error',
			readOnly && 'read-only',
			hasMany && 'has-many',
		].filter(Boolean).join(' ')} style={style}>
			<div className={`${fieldBaseClass}__wrap`}>
				{hasMany ? (
					<ReactSelect className={`field-${path.replace(/\./g, '__')}`}
					             components={{DropdownIndicator: null as any}} customProps={{
						editableProps,
					}} disabled={readOnly}
						// prevent adding additional options if maxRows is reached
						         filterOption={() =>
							         !maxRows ? true : !(Array.isArray(
								         value) && maxRows && value.length >= maxRows)
						         } isClearable={false} isCreatable isMulti isSortable
						         menuIsOpen={false} noOptionsMessage={() => {
						const isOverHasMany = Array.isArray(value) && value.length >= (maxRows ?? 1)
						if (isOverHasMany) {
							return t('validation:limitReached',
								{max: maxRows, value: value.length + 1})
						}
						return ''
					}} onChange={onChange} options={[]} placeholder={t('general:enterAValue')}
						         showError={showError} value={valueToRender} />
				) : (
					<div className={'relative form-field active col-span-full mb-8'}>
						<input data-rtl={rtl} disabled={readOnly}
						       id={`field-${path?.replace(/\./g, '__')}`} name={path}
						       onChange={onChange as (e: ChangeEvent<HTMLInputElement>) => void}
						       onKeyDown={onKeyDown} placeholder={''} className={'w-input'}
						       ref={inputRef} type="text" value={value || ''} />
						<div data-form={'baseline'} />
						<label className={'input-label'}>{label as string}</label>
					</div>
				)}
			</div>
		</div>
	)
}
