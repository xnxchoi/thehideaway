"use server";

import {PayloadHandler} from "payload";
import {getNotifications} from "@collections/Notifications/fetches/getNotifications";
import {NotificationResponse} from "@collections/Notifications/hooks/types";

export const fetchMyNotifications: PayloadHandler = async (req) => {
	if (!req.user) {
		return Response.json({error: "forbidden"}, {status: 403});
	}
	const id = req.user.id;
	const queries = req.query;
	const args: Parameters<typeof getNotifications>[0] = {
		id,
	};
	const {timestamp, page} = queries;
	Object.entries({timestamp, page}).forEach(([a, q]) => {
		if (typeof q === "string" || typeof q === "number") {
			args[a] = Number(q);
		}
	});

	const notifications: NotificationResponse = await getNotifications(
		args,
	).catch((e) => {
		console.error(e);
		return [] as NotificationResponse;
	});
	return Response.json({
		notifications,
	});
};
/**
 *   const newHandles = generateSmartSlugCandidates({
            base: handle,
            username: user.name,
            email: user.email,
            maxAttempts: 3,
        });
        const handles = await Promise.all(
            newHandles.flatMap(async (hd) => {
                const exists = await payload.find({
                    collection: "users",
                    draft: draft.isEnabled,
                    limit: 1,
                    overrideAccess: true,
                    depth: 0,
                    where: {
                        id: {
                            not_equals: user.id,
                        },
                        slug: {
                            equals: hd,
                        },
                    },
                });
                const adminExists = await payload.find({
                    collection: "admins",
                    draft: draft.isEnabled,
                    limit: 1,
                    overrideAccess: true,
                    depth: 0,
                    where: {
                        id: {
                            not_equals: user.id,
                        },
                        slug: {
                            equals: hd,
                        },
                    },
                });
                if (adminExists.totalDocs > 0 || exists.totalDocs > 0) return;
                return hd;
            }),
        );
        if (handles.length > 0) {
            return Response.json(
                { error: "handle_exists", suggestions: handles },
                { status: 409 },
            );
        }
 */
