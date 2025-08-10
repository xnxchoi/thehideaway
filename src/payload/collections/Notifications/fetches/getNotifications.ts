import type {OptionalKeys} from "@/utilities/typeUtilities";
import {getPayload, type Where} from "payload";
import config from "@payload-config";
import {
	NotificationDoc,
	NotificationResponse,
	ResponseNotification,
	SyncedAsset,
	SyncedNotification,
} from "@collections/Notifications/hooks/types";

type RP_NotificationKeys = keyof ResponseNotification;
const NotificationFields: Record<RP_NotificationKeys, true> = {
	thumbnail: true,
	content: true,
	readAt: true,
	id: true,
	type: true,
	importance: true,
	status: true,
	read: true,
	dismissed: true,
	title: true,
	createdAt: true,
	updatedAt: true,
	sticky: true,
	trigger: true,
	actionLink: true,
	recipient: true,
};
type UnreliableNotificationFieldKeys = OptionalKeys<ResponseNotification>;

function makeNotification(
	notification: ResponseNotification,
): SyncedNotification {
	const asIs = {
		...notification,
	} satisfies Omit<ResponseNotification, UnreliableNotificationFieldKeys>;
	const toChange: Pick<SyncedNotification, UnreliableNotificationFieldKeys> = {
		readAt: notification.readAt ?? null,
		trigger: notification.trigger || null,
	};

	return {
		...asIs,
		...toChange,
	};
}

export function makeNotifications(
	fetchResponse: NotificationResponse,
): Array<SyncedNotification> {
	return fetchResponse.map(makeNotification) as SyncedNotification[];
}

export const getNotifications = async ({
	id,
	timestamp,
	page,
}: {
	id: string;
	timestamp?: number;
	page?: number;
}) => {
	const payload = await getPayload({config});
	const query: Where & { and: Where[] } = {
		and: [
			{
				recipient: {
					equals: id,
				},
			},
			{
				status: {
					not_equals: "dismissed",
				},
			},
		],
	};
	timestamp &&
	query.and.push({
		createdAt: {
			greater_than_equal: new Date(timestamp - 60 * 1000 * 2).toISOString(),
		},
	});
	let params = {};
	if (page) {
		params = {
			...params,
			page,
		};
	}
	const not = (await payload.find({
		collection: "notifications",
		overrideAccess: true,

		select: {
			type: true,
			thumbnail: true,
			content: true,
			title: true,
			createdAt: true,
			sticky: true,
			trigger: true,
			updatedAt: true,
			readAt: true,
			read: true,
			recipient: true,
			status: true,
			importance: true,
			dismissed: true,
			actionLink: true,
		},
		where: query,

		sort: ["-sticky", "-createdAt"],
		limit: 50,
		...params,
	}).then((r) => r.docs).catch((e) => {
		console.error({
			message:
				`Error while fetching notifications for ` +
				(id ? id : "a user that was not found"),
			error: e,
			user: id,
			time: new Date().toISOString(),
		});
		return [];
	})) as Array<NotificationDoc>;

	const res = await Promise.allSettled(
		not.map((v, i) =>
			v.thumbnail
				? payload.findByID({
					collection: "assets",
					id: v.thumbnail,
					select: {
						alt: true,
						mimeType: true,
						url: true,
						thumbnailURL: true,
						darkmode: true,
					},
				}).then((r) => {
					let mimeType = r.mimeType || null;
					if (!mimeType) {
						const ur = r.url || r.thumbnailURL;
						if (ur) {
							const extension = ur.split(".").at(-1);
							mimeType = (extension && "image/" + extension) || null;
						}
					}
					const last = {
						id: r.id,
						mimeType,
						thumbnailURL: r.thumbnailURL || null,
						url: r.url || null,
						darkmode: r.darkmode ?? false,
						alt: r.alt ?? "",
					};
					return last;
				}).then((r) => ({
					...v,
					thumbnail: Object.values(r).reduce(
						(p, n) => Boolean(p && n !== null),
						true,
					)
						? (r as SyncedAsset)
						: null,
				}))
				: Promise.resolve({
					...v,
					thumbnail: null,
				}),
		),
	);
	const final: NotificationResponse = [];
	res.forEach((v, i) => {
		if (v.status === "fulfilled") {
			final.push(v.value);
		} else {
			const p = not.at(i)!;
			final.push({...p, thumbnail: null});
		}
	});
	return final;
};
