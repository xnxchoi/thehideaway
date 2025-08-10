import type {PayloadRequest, Where} from "payload";

type Args = {
	req: PayloadRequest;
};
export const filterDocByCurrentUser = ({req}: Args): null | Where => {
	const user = req.user;
	if (!user) return null;
	if (user?.role === "admin") return {};
	const userID = user.id;
	if (userID) {
		return {
			author: {
				equals: userID,
			},
		};
	}

	return {
		_status: {
			equals: "published",
		},
	};
};
