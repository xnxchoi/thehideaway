import {CheckboxField} from "@payloadcms/ui"
import type {CheckboxFieldServerComponent, CheckboxFieldServerProps} from "payload"

export const AdminOnlyCheckboxField: CheckboxFieldServerComponent = (props: CheckboxFieldServerProps) => {
	const {user, payload, id, clientField, path} = props
	const isAdmin = user?.role === 'admin'
	if (isAdmin) return <CheckboxField field={clientField} path={path} />
	return <></>
}