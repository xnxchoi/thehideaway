import type {CollectionAfterReadHook} from "payload";

// The `user` collection has access control locked so that users are not publicly accessible
// This means that we need to populate the author manually here to protect user privacy
// GraphQL will not return mutated user data that differs from the underlying schema
// So we use an alternative `populatedAuthors` field to populate the user data, hidden from the admin ui
export const populateAuthor: CollectionAfterReadHook = async ({
	doc,
	req,
	req: {payload},
}) => {
	if (doc?.author) {
		if (typeof doc.author === "string") {
			try {
				const a = await payload.findByID({
					collection: "users",
					id: doc.author,
					select: {
						name: true,
						id: true,
					},
					overrideAccess: true,
				}).then((result) => ({
					name: result.name as string,
					id: result.id + "",
				}));
				doc.populatedAuthor = [a];
			} catch {
			}
		} else {
			if (typeof doc.author === "object" && "id" in doc.author) {
				try {
					const a = await payload.findByID({
						collection: "users",
						id: doc.author?.id,
						select: {
							name: true,
							id: true,
						},
						overrideAccess: true,
					}).then((result) => ({
						name: result.name as string,
						id: result.id + "",
					}));
					doc.populatedAuthor = [a];
				} catch {
				}
			}
		}
	}

	return doc;
};
