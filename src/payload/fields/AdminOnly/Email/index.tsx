import {EmailField} from "@payloadcms/ui"
import type {EmailFieldServerComponent, EmailFieldServerProps} from "payload"

export const AdminOnlyEmailField: EmailFieldServerComponent = (props: EmailFieldServerProps) => {
	const {user, payload, id,
		schemaPath,
		permissions, clientField, path} = props
	const isAdmin = user?.role === 'admin'
	if (isAdmin) return <EmailField  field={clientField} path={path} schemaPath={schemaPath} permissions={permissions} />
	return <></>
}