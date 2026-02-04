import type {CollectionBeforeChangeHook} from "payload";

export const sanitizeAuthor = (hasMany = false) => {
	const hook: CollectionBeforeChangeHook = hasMany
		? ({data, req, operation, originalDoc}) => {
			const user = req.user;
			data.author = data.author ?? [];
			if (operation === "create") {
				if (data.author.length < 1) {
					if (user) {
						data.author = [...new Set([...(data.author ?? []), user?.id])];
					}
				}
			}
			if (operation === "update") {
				if (data.author.length < 1) {
					if (
						originalDoc &&
						originalDoc.author &&
						originalDoc.author.length > 0
					) {
						data.author = originalDoc.author;
					} else {
						if (user) {
							data.author = [user?.id];
						}
					}
				}
			}

			return data;
		}
		: ({data, req, operation, originalDoc}) => {
			const user = req.user;
			data.author = data.author ?? null;
			if (operation === "create") {
				if (!data.author) {
					if (user) {
						data.author = user?.id;
					}
				}
			}
			if (operation === "update") {
				if (originalDoc && originalDoc.author) {
					data.author = originalDoc.author;
				} else {
					if (user) {
						data.author = user?.id;
					}
				}
			}

			return data;
		};
	return hook;
};
