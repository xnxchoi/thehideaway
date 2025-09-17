import {SelectField} from "@payloadcms/ui"
import type {SelectFieldServerComponent, SelectFieldServerProps} from "payload"

export const AdminsOnlySelectField: SelectFieldServerComponent = (props: SelectFieldServerProps) => {
	const {user, payload, id,
		schemaPath,
		permissions, clientField, path} = props
	const isAdmin = user?.role === 'admin'
	if (isAdmin) return <SelectField  field={clientField} path={path} schemaPath={schemaPath} permissions={permissions} />
	return <></>
}