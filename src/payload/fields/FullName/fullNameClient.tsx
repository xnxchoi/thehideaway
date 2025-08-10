"use client";
import type {TextFieldClientComponent} from "payload";

import {TextField, useField, useLocale} from "@payloadcms/ui";
import {useEffect, useState} from "react";

/**
 * This is a custom text field component that is used to display the full name of
 * the user.
 */
const NameField: TextFieldClientComponent = ({path, field, ...props}) => {
	// useField is used to get the value and set the value of the field
	const {value, setValue} = useField({path});
	const [textValue, setTextValue] = useState(value);
	const nameRegex =
		/^(?!.*(--|''|’’|\s{2,}|-'|'–|–'| -| -|' |' ))(?![-'’ ])[\p{L}]+(?:[-'’ ][\p{L}]+)*(?<![-'’ ])$/iu;
	type LocaleCode = "en" | "ko";

	const {code} = useLocale();

	// get the firstName and lastName field values from the form fields

	// if the value of the field is not the same as the value of the firstName and lastName fields,
	// set the value of the field to the value of the firstName and lastName fields
	useEffect(() => {
		if (value !== textValue) {
			setValue(textValue);
		}
	}, [textValue, setValue]);

	return <TextField path={path} field={field} {...props} />;
};

export default NameField;
