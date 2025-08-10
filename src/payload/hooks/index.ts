import type {
	CollectionBeforeOperationHook,
	CollectionSlug,
	DataFromCollectionSlug,
} from "payload";

export function autoincrement<
	T extends CollectionSlug,
	U extends keyof DataFromCollectionSlug<T>,
>(collection: T, field: U): CollectionBeforeOperationHook {
	return async ({operation, args, req: {payload, user}}) => {
		if (operation !== "create") return args;
		const fieldName = field.toString();
		const highest = await payload.find({
			collection: collection,
			limit: 1,
			sort: "-" + fieldName,
		});
		const next = (parseInt(highest.docs[0]?.[fieldName]) || 0) + 1;
		return {...args, data: {...args.data, [fieldName]: next}};
	};
}
