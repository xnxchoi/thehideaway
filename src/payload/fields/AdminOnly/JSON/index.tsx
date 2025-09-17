import {JSONField} from "@payloadcms/ui"
import type {JSONFieldServerComponent, JSONFieldServerProps} from "payload"

export const AdminOnlyJSONField: JSONFieldServerComponent = (props: JSONFieldServerProps) => {
	const {user, payload, id,
		schemaPath,
		permissions, clientField, path} = props
	const isAdmin = user?.role === 'admin'
	if (isAdmin) return <JSONField  field={clientField} path={path} schemaPath={schemaPath} permissions={permissions} />
	return <></>
}