import type {CollectionBeforeChangeHook} from 'payload'
import {RP_Roles} from "@/stores/Notification/NotificationStore";
import {roleToAuthority} from "@/payload/plugins/locker/fields/authority/utils";
import {Post} from "@/payload-types";

export const populatePublishedAt: CollectionBeforeChangeHook = async ({
	data: d, operation, originalDoc, req, context
}) => {
	const data = d as Post;
	if (operation === 'create' || operation === 'update') {
		if (data._status === 'published') {
			const author = data.author as string | undefined;
			if (!context.overrideAccess && req.user?.role !== 'admin') {
				if (!author) {
					if (roleToAuthority(req.user?.role || 'guest') < 2) {
						data._status = 'draft';
					}
				} else {
					if (author === req.user?.id) {
						if (roleToAuthority(req.user?.role || 'guest') < 2) {
							data._status = 'draft';
						}
					} else {
						const role = await req.payload.findByID({
							collection: 'users', id: author, select: {role: true}
						}).then(r => r.role).catch(e => {
							req.payload.logger.error(e)
							return 'user' as RP_Roles
						})
						if (roleToAuthority(role) < 2) {
							data._status = 'draft';
						}
					}
				}
			}

		}
		if (data._status === 'published' && !data.publishedAt) {
			if (operation === 'create') {
				data.publishedAt = new Date() as unknown as string
			} else {
				if (originalDoc._status !== 'published') {
					data.publishedAt = new Date() as unknown as string
				} else {
					data.publishedAt = originalDoc.publishedAt || new Date() as unknown as string
				}
			}
		}

	}
	return data
}