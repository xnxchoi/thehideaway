import {TextareaField} from "@payloadcms/ui"
import type {TextareaFieldServerComponent, TextareaFieldServerProps} from "payload"

export const AdminOnlyTextareaField: TextareaFieldServerComponent = (props: TextareaFieldServerProps) => {
	const {user, payload, id,
		schemaPath,
		permissions, clientField, path} = props
	const isAdmin = user?.role === 'admin'
	if (isAdmin) return <TextareaField  field={clientField} path={path} schemaPath={schemaPath} permissions={permissions} />
	return <></>
}