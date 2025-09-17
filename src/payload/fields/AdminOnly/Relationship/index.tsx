import {RelationshipField} from "@payloadcms/ui"
import type {RelationshipFieldServerComponent, RelationshipFieldServerProps} from "payload"

export const AdminOnlyRelationshipField: RelationshipFieldServerComponent = (props: RelationshipFieldServerProps) => {
	const {user, payload, id,
		schemaPath,
		permissions, clientField, path} = props
	const isAdmin = user?.role === 'admin'
	if (isAdmin) return <RelationshipField  field={clientField} path={path} schemaPath={schemaPath} permissions={permissions} />
	return <></>
}