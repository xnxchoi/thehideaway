import {AccessArgs, AccessResult, CollectionSlug, Where} from "payload";
import {LockedAccessCollection} from "@/payload/plugins/locker/access/index";

export const lockedOrQ = ({req: {user}}: AccessArgs): boolean | Where[] => {
	const orArgs: Where[] = [
		{
			locked: {
				equals: false,
			},
		},
		{
			locked: {
				exists: false,
			},
		},
	];
	if (user) {
		if (user?.role === "admin") return true;
		orArgs.push({
			and: [
				{
					locked: {
						equals: true,
					},
				},
				{
					allowList: {
						contains: user?.id,
					},
				},
			],
		});
	}
	return orArgs;
};
export const lockedRead = (
	props: AccessArgs & { collection: LockedAccessCollection },
): AccessResult => {
	const {req, collection} = props;
	const {user} = req;

	const orArgs: Where[] = [
		{
			locked: {
				equals: false,
			},
		},
		{
			locked: {
				exists: false,
			},
		},
	];
	if (user) {
		if (user?.role === "admin") return true;

		if (collection !== "pages") {
			if (user?.role === "editor") return true;
		}

		orArgs.push({
			and: [
				{
					locked: {
						equals: true,
					},
				},
				{
					allowList: {
						contains: user?.id,
					},
				},
			],
		});
	}
	return {
		or: [
			{
				and: [
					{
						_status: {
							equals: "published",
						},
					},
					{
						or: orArgs,
					},
				],
			},
			(collection !== "pages" &&
				user?.role === "author" && {
					author: {
						equals: user?.id,
					},
				}) ||
			{},
		],
	};
};
