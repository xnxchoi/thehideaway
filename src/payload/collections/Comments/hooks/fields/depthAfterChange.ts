"use server";
import {FieldHook} from "payload";
import {cache} from "react";

export const depthAfterChange: FieldHook = cache(
	async ({value, data, siblingData, req}) => {
		const parentId = data?.parent || siblingData?.parent;
		if (!parentId) return 0;
		const parentDepth = await req.payload.findByID({
			overrideAccess: true,
			collection: "comments",
			id: parentId,
			select: {
				depth: true,
			},
		}).then((r) => (typeof r.depth === "number" ? r.depth : 0)).catch((r) => {
			req.payload.logger.error(r);
			return 0;
		});
		return parentDepth + 1;
	},
);
