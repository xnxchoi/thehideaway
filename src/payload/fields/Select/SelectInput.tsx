"use client";
import type {
	LabelFunction,
	OptionObject,
	StaticDescription,
	StaticLabel,
} from "payload";

import {getTranslation} from "@payloadcms/translations";
import React, {CSSProperties, FC, ReactNode} from "react";

import {
	fieldBaseClass,
	FieldDescription,
	FieldError,
	FieldLabel,
	RenderCustomComponent,
	useTranslation,
} from "@payloadcms/ui";
import {useCursorStore} from "@/providers/RP_Pro";
import {ReactSelectAdapterProps} from "@payloadcms/ui/dist/elements/ReactSelect/types";

export type SelectInputProps = {
	readonly AfterInput?: ReactNode;
	readonly BeforeInput?: ReactNode;
	readonly className?: string;
	readonly Description?: ReactNode;
	readonly description?: StaticDescription;
	readonly Error?: ReactNode;
	readonly hasMany?: boolean;
	readonly isClearable?: boolean;
	readonly isSortable?: boolean;
	readonly Label?: ReactNode;
	readonly label?: StaticLabel;
	readonly localized?: boolean;
	readonly name: string;
	readonly onChange?: ReactSelectAdapterProps["onChange"];
	readonly onInputChange?: ReactSelectAdapterProps["onInputChange"];
	readonly options?: OptionObject[];
	readonly path: string;
	readonly placeholder?: LabelFunction | string;
	readonly readOnly?: boolean;
	readonly required?: boolean;
	readonly showError?: boolean;
	readonly style?: CSSProperties;
	readonly value?: string | string[];
};

export const SelectInput: FC<SelectInputProps> = (props) => {
	const {
		AfterInput,
		BeforeInput,
		className,
		Description,
		description,
		Error,
		hasMany = false,
		isClearable = true,
		isSortable = true,
		label,
		Label,
		localized,
		onChange,
		onInputChange,
		options,
		path,
		placeholder,
		readOnly,
		required,
		showError,
		style,
		value,
	} = props;

	const {i18n} = useTranslation();

	let valueToRender;

	if (hasMany && Array.isArray(value)) {
		valueToRender = value.map((val) => {
			const matchingOption = options?.find((option) => option.value === val);
			return {
				label: matchingOption
					? getTranslation(matchingOption.label, i18n)
					: val,
				value: matchingOption?.value ?? val,
			};
		});
	} else if (value) {
		const matchingOption = options?.find((option) => option.value === value);
		valueToRender = {
			label: matchingOption
				? getTranslation(matchingOption.label, i18n)
				: value,
			value: matchingOption?.value ?? value,
		};
	} else {
		// If value is not present then render nothing, allowing select fields to reset to their initial 'Select an option' state
		valueToRender = null;
	}
	const setCursor = useCursorStore((r) => r.setCursorState);

	return (
		<div className={[
			fieldBaseClass,
			"select",
			className,
			showError && "error",
			readOnly && "read-only",
		].filter(Boolean).join(" ")} id={`field-${path.replace(/\./g, "__")}`} style={style}>
			<RenderCustomComponent CustomComponent={Label} Fallback={
				<FieldLabel label={label} localized={localized} path={path} required={required} />
			} />
			<div className={`${fieldBaseClass}__wrap`} onMouseEnter={() => {
				setCursor(readOnly ? null : "FOCUS");
			}} onMouseLeave={() => {
				setCursor(null);
			}}>
				<RenderCustomComponent CustomComponent={Error} Fallback={<FieldError path={path}
				                                                                     showError={showError} />} />
				{BeforeInput}
				<ReactSelect disabled={readOnly} isClearable={isClearable} isMulti={hasMany}
				             isSortable={isSortable} onChange={onChange}
				             onInputChange={onInputChange} options={
					options?.map((option) => ({
						...option,
						label: getTranslation(option.label, i18n),
					})) ?? []
				} placeholder={placeholder} showError={showError}
				             value={valueToRender as OptionObject} />
				{AfterInput}
			</div>
			<RenderCustomComponent CustomComponent={Description}
			                       Fallback={<FieldDescription description={description}
			                                                   path={path} />} />
		</div>
	);
};
