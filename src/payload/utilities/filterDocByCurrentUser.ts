import type { BaseFilter, Where } from "payload";

export const filterDocByCurrentUser: BaseFilter = ({ req }) => {
	const user = req.user;
	const w1: Where & { or: Where[] } = {
		or: [
			{
				_status: {
					equals: "published",
				}
			}, { author: { exists: false } }
		]
	}
	if (!user) return w1;
	if (user.role === "admin") return null;
	return {
		author: {
			equals: user.id,
		},
	};

};
