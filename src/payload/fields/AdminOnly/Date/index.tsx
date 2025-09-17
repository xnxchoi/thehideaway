import {DateTimeField} from "@payloadcms/ui"
import type {DateFieldServerComponent, DateFieldServerProps} from "payload"

export const AdminOnlyDateField: DateFieldServerComponent = (props: DateFieldServerProps) => {
	const {user, payload, id,
		schemaPath,
		permissions, clientField, path} = props
	const isAdmin = user?.role === 'admin'
	if (isAdmin) return <DateTimeField  field={clientField} path={path} schemaPath={schemaPath} permissions={permissions} />
	return <></>
}