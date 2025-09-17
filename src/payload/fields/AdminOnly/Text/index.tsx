import {TextField} from "@payloadcms/ui"
import type {TextFieldServerComponent, TextFieldServerProps} from "payload"

export const AdminOnlyTextField: TextFieldServerComponent = (props: TextFieldServerProps) => {
	const {user, payload, id,
		schemaPath,
		permissions, clientField, path} = props
	const isAdmin = user?.role === 'admin'
	if (isAdmin) return <TextField  field={clientField} path={path} schemaPath={schemaPath} permissions={permissions} />
	return <></>
}