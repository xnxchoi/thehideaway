import type React from "react";
import {TextField} from "@payloadcms/ui";
import type {TextFieldServerComponent} from "payload";
import {isHangul} from "@/utilities/rp_utils";
import {capitalize} from "lodash-es";

const CustomFullNameTextFieldServer: TextFieldServerComponent = ({
	clientField,
	path,
	schemaPath,
	permissions,
	siblingData,
	payload,
}) => {
	// Get the current values directly from siblingData
	const {firstName, lastName, fullName} = siblingData;
	let newFirstName = firstName.trim();
	const firstnameHangul = isHangul(newFirstName);
	if (!firstnameHangul) {
		newFirstName = capitalize(newFirstName);
	}
	let newLastName = lastName.trim();
	const lastnameHangul = isHangul(newLastName);
	if (!lastnameHangul) {
		newLastName = capitalize(newLastName);
	}

	const newFullName =
		firstnameHangul || lastnameHangul
			? `${newFirstName}${newLastName}`.trim()
			: `${newLastName} ${newFirstName}`.trim();
	// Only update if the values don't match
	if (fullName !== newFullName) {
		payload.update({
			id: siblingData.id,
			collection: "users",
			data: {
				fullName: newFullName,
			},
		});
	}

	return (
		<TextField field={clientField} path={path} schemaPath={schemaPath} permissions={permissions}
		           readOnly={clientField.admin?.readOnly} />
	);
};

export default CustomFullNameTextFieldServer;
