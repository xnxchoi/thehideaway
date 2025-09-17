import {RadioGroupField} from "@payloadcms/ui"
import type {RadioFieldServerComponent, RadioFieldServerProps} from "payload"

export const AdminsOnlyRadioField: RadioFieldServerComponent = (props: RadioFieldServerProps) => {
	const {user, payload, id,
		schemaPath,
		permissions, clientField, path} = props
	const isAdmin = user?.role === 'admin'
	if (isAdmin) return <RadioGroupField field={clientField} path={path} schemaPath={schemaPath} permissions={permissions} />
	return <></>
}