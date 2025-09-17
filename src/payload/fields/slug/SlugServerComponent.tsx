import type {CollectionSlug, TextFieldServerComponent, TextFieldServerProps} from "payload";
import {TextField} from "@payloadcms/ui";
import {SlugComponent} from "@/payload/fields/slug/SlugComponent";
import getConfig from "next-intl/config";
import {IndexedCollections} from "@/payload/search/beforeSync";

export const SlugServerComponent: TextFieldServerComponent = async (props: {
	fieldToUse: string;
	checkboxFieldPath: string;
} & TextFieldServerProps) => {
	const {
		field,
		readOnly,
		data,
		path,
		req,
		operation,
		schemaPath,
		permissions,
		clientField,
		user,
		checkboxFieldPath,
		fieldToUse,
		id,
		collectionSlug
	} = props
	const userIsAdmin = user.collection === 'admins' || user.role === 'admin'
	let userIsAuthor = operation === 'create'
	if (operation === 'update' && ['string', 'number'].some(
		(r) => {
			const typ = typeof id;
			return (r as "string" | "number") === typ;
		})) {
		const overrideAccess = true
		const col = req.payload.collections[collectionSlug as CollectionSlug];
		const fields = col.config.fields;
		const authorFieldExists = fields.findIndex(
			r => ('name' in r&&r.name === 'author' && r.type === 'relationship')) > -1
		if (authorFieldExists) {
			const authorId = await req.payload.findByID({
				collection: collectionSlug as Exclude<IndexedCollections, 'users'>,
				id: `${id}`,
				select: {
					author: true,
				},
				context: {
					...req.context,
					overrideAccess,
				},
				overrideAccess,
				req
			}).then(r => {
				return 'author' in r ? r.author : null
			}).catch((e) => {
				req.payload.logger.error(e)
				return null;
			})
			if (authorId) {
				userIsAuthor = (Array.isArray(authorId) ? (authorId as string[]).some(
					r => r === user.id) : (authorId === user.id))
			}
		}

	}
	const read = readOnly || !(userIsAdmin || userIsAuthor)
	return (<TextField path={path} permissions={permissions}
	                   field={() => <SlugComponent checkboxFieldPath={checkboxFieldPath}
	                                               field={clientField} path={path}
	                                               fieldToUse={fieldToUse} readOnly={read} />}
	                   readOnly={read} schemaPath={schemaPath} />)
}