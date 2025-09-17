import {NumberField} from "@payloadcms/ui"
import type {NumberFieldServerComponent, NumberFieldServerProps} from "payload"

export const AdminOnlyNumberField: NumberFieldServerComponent = (props: NumberFieldServerProps) => {
	const {user, payload, id,
		schemaPath,
		permissions, clientField, path} = props
	const isAdmin = user?.role === 'admin'
	if (isAdmin) return <NumberField  field={clientField} path={path} schemaPath={schemaPath} permissions={permissions} />
	return <></>
}