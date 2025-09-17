import {ArrayField} from "@payloadcms/ui"
import type {ArrayFieldServerComponent, ArrayFieldServerProps} from "payload"

export const AdminOnlyArrayField: ArrayFieldServerComponent = (props: ArrayFieldServerProps) => {
	const {user, payload, id,
		schemaPath,
		permissions, clientField, path} = props
	const isAdmin = user?.role === 'admin'
	if (isAdmin) return <ArrayField  field={clientField} path={path} schemaPath={schemaPath} permissions={permissions} />
	return <></>
}