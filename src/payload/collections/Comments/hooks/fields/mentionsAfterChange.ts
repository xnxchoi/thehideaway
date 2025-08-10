"use server";
import {arraysEqualContents} from "../../../../../utilities/compareArrays";
import {createNote} from "../../../Notifications/hooks/createNotification";
import {buildNotification} from "../../../Notifications/hooks/helpers/buildNotificationData";
import {FieldHook} from "payload";
import {NotificationTargets} from "../../../Notifications/hooks/types";

export const mentionsAfterChange: FieldHook = async ({
	operation,
	value,
	data,
	req,
	previousValue,
	originalDoc,
	siblingData,
}) => {
	if (!value || !Array.isArray(value) || value.length < 1) return value;
	const comparedArr: string[] =
		operation === "update" ? [...previousValue] : [];
	if (arraysEqualContents(value, comparedArr)) return value;
	const payload = req.payload;

	if (!(siblingData?.document || data?.document)) {
		payload.logger.error(
			`Error trying to create notifications for mentions in ${data?.id}; Document info was unavailable in the passed doc data`,
		);
		return value;
	}
	const documentColl = (siblingData?.document || data?.document) as {
		relationTo: NotificationTargets;
		value: string;
	};

	const authorId =
		(siblingData?.author ||
			(operation === "update" && originalDoc?.author) ||
			data) ??
		null;
	if (!authorId) {
		payload.logger.error(
			`Error trying to create notifications for mentions in ${data?.id}; Author id was unavailable in the passed doc data`,
		);
		return value;
	}
	const author = await payload.findByID({
		req,
		collection: "users",
		id: authorId,
		overrideAccess: true,
		select: {
			name: true,
		},
	}).catch((e) => (payload.logger.error(e), null));
	if (!author) {
		payload.logger.error(
			`Error trying to create notifications for mentions in ${data?.id}; Author with id ${authorId} was not found`,
		);
		return value;
	}
	const toR = value.flatMap((mention) => {
		if (comparedArr.some((r) => r === mention)) return [];

		return buildNotification({
			recipient: mention,
			title: `@${author.name} mentioned you`,
			content: `You were mentioned by @${author.name} in a comment.`,
			type: "mention",
			sticky: false,
			importance: 1,
			actionLink: {
				type: "reference",
				reference: {
					...documentColl,
				},
			},
		});
	});
	await Promise.allSettled(toR.map((data) => createNote({req, data}))).then(
		(r) => {
			r.forEach((s, i) => {
				if (s.status === "rejected") {
					payload.logger.error(
						toR[i]!,
						"> was rejected during batched creation of notifications, reason:" +
						s.reason,
					);
				}
			});
		},
	);
	return value;
};
