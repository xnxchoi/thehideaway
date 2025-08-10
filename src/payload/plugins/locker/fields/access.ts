import {FieldAccessArgs} from "node_modules/payload/dist/fields/config/types"
import {FieldAccess} from "payload"

type AuthorAdminEditorProps = FieldAccessArgs & {
	editor?: boolean
	author?: boolean
}
const isAuthorOrAdmin = (props: AuthorAdminEditorProps) => {
	const {req, data, editor, author: doAuthor} = props
	const {user} = req
	if (user?.role === "admin") return true
	if (editor) {
		if (user?.role === "editor") return true
	}
	if (doAuthor) {
		if (user?.role === "author") return true
	}
	const author = data?.author

	if (Array.isArray(author)) {
		return author.length > 0 && author.some((au) => au === req.user?.id)
	} else if (author === req.user?.id) return true
	return false
}
const adminAccess = ({req}: FieldAccessArgs) => {
	const {user} = req
	if (!user) return false
	if (user?.role === "admin") return true
	return false
}
export const createStdRadioFieldAccess: FieldAccess = ({req}) => {
	const {user} = req
	if (!user) return false
	if (user?.role === "admin") return true
	if (user?.role === "editor") return true
	if (user?.role === "author") return true
	return false
}
export const updateStdRadioFieldAccess: FieldAccess = ({req, data}) => {
	const {user} = req
	if (!user) return false
	if (user?.role === "admin") return true
	if (user?.role === "editor") return true
	if (user?.role === "author") {
		const author = data?.author
		if (Array.isArray(author)) {
			return author.length > 0 && author.some((au) => au === req.user?.id)
		} else if (author === req.user?.id) return true
		return false
	}
	return false
}

export const createPagesRadioFieldAccess: FieldAccess = ({req}) => {
	const {user} = req
	if (!user) return false
	if (user?.role === "admin") return true
	return false
}
export const updatePagesRadioFieldAccess: FieldAccess = ({req}) => {
	const {user} = req
	if (!user) return false
	if (user?.role === "admin") return true
	return false
}
export const updateStdCheckboxFieldAccess: FieldAccess = ({req, data}) => {
	return isAuthorOrAdmin({req, data, editor: true})
}
export const createStdCheckboxFieldAccess: FieldAccess = ({req}) => {
	return isAuthorOrAdmin({req, editor: true, author: true})
}

export const createPagesCheckboxFieldAcess: FieldAccess = ({req}) => {
	return adminAccess({req})
}
export const updatePagesCheckboxFieldAcess: FieldAccess = ({req}) => {
	return adminAccess({req})
}

//For fields that are relationship fields, and is part of a collection with the "author" property
export const updateStdRelFieldAccess: FieldAccess = ({req, data}) => {
	return isAuthorOrAdmin({req, data, editor: true})
}
export const createStdRelFieldAccess: FieldAccess = ({req}) => {
	return isAuthorOrAdmin({req, editor: true, author: true})
}
export const createPagesRelFieldAcess: FieldAccess = ({req}) => {
	return adminAccess({req})
}
export const updatePagesRelFieldAcess: FieldAccess = ({req}) => {
	return adminAccess({req})
}
