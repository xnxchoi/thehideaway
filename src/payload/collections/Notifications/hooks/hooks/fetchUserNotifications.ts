"use server";
import type {PayloadHandler, Where} from "payload";
import {cache} from "react";
import {SyncedNotification} from "@/payload/collections/Notifications/hooks/types";

export const userNotificationHandler: PayloadHandler = cache(async (req) => {
	const user = req.user;
	if (!user) {
		req.payload.logger.error(
			"Notification fetching failed; Current user is not authenticated.",
		);
		return Response.json({error: "Unauthorized"}, {status: 401});
	}
	const params = req.query;
	const timestamp = params.timestamp;
	//if timestamp is provided, we need to fetch notifications that are newer than the timestamp
	const where: Where & { and: Where[] } = {
		and: [
			{
				recipient: {
					equals: user.id,
				},
			},
			{
				status: {
					not_equals: "dismissed",
				},
			},
		],
	};
	if (timestamp) {
		where.and.push({
			createdAt: {
				greater_than_equal: timestamp,
			},
		});
	}
	const notifications: SyncedNotification[] | null = await req.payload.find({
		collection: "notifications",
		where,
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
			status: true,
			importance: true,
			dismissed: true,
			actionLink: true,
		},
		sort: ["-sticky", "-createdAt"],
		overrideAccess: true,
	}).then((notifications) => {
		if (!notifications || !notifications.docs) {
			throw Error("Notification fetching failed");
		}
		return notifications.docs;
	}).then(async (r) => {
		const syncedNotifications: SyncedNotification[] = [];
		for (const notification of r) {
			const syncedNotification: SyncedNotification = {
					...notification,
					thumbnail: null,
					trigger: notification.trigger
						? {
							relationTo: notification.trigger.relationTo,
							value:
								typeof notification.trigger.value === "string"
									? notification.trigger.value
									: notification.trigger.value.id,
						}
						: null,
					readAt: notification.readAt ?? null,
					actionLink: notification.actionLink ? ?? null,
				};

			const thumbnail = notification.thumbnail;
			if (thumbnail) {
				const thumbnailID =
					typeof thumbnail === "string" ? thumbnail : thumbnail.id;
				const thumbnailData = await req.payload.findByID({
					collection: "assets",
					id: thumbnailID,
					select: {
						alt: true,
						id: true,
						mimeType: true,
						url: true,
						thumbnailURL: true,
						updatedAt: true,
						createdAt: true,
						darkmode: true,
					},
				}).then((thumbnailData) => {
					if (
						!thumbnailData ||
						!thumbnailData.mimeType ||
						!thumbnailData.url ||
						!thumbnailData.updatedAt ||
						!thumbnailData.createdAt
					) {
						return null;
					}
					return {
						alt: thumbnailData.alt,
						id: thumbnailData.id,
						mimeType: thumbnailData.mimeType,
						url: thumbnailData.thumbnailURL ?? thumbnailData.url,
						updatedAt: thumbnailData.updatedAt,
						createdAt: thumbnailData.createdAt,
					};
				}).catch((e) => {
					req.payload.logger.error(e);
					return null;
				});
				syncedNotification.thumbnail = thumbnailData ?? null;
			}
			syncedNotifications.push(syncedNotification);
		}
		return syncedNotifications;
	}).catch((e) => {
		req.payload.logger.error(e);
		return null;
	});
	if (!notifications) {
		return Response.json(
			{error: "Error fetching notifications for user"},
			{status: 500},
		);
	}
	return Response.json({data: notifications}, {status: 200});
});
