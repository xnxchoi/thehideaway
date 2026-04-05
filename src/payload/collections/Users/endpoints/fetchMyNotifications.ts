"use server";

import {getNotifications} from "@/payload/collections/Notifications/fetches/getNotifications";
import {NotificationResponse} from "@/payload/collections/Notifications/hooks/types";
import {PayloadHandler} from "payload";

export const fetchMyNotifications: PayloadHandler = async (req) => {
  if (!req.user) {
    return Response.json({ error: "forbidden" }, { status: 403 });
  }
  const id = req.user.id;
	const queries = req.query as {
		[x: string]: string | string[] | undefined | null | number | number[];
		timestamp?: `${number}`;
		page?: `${number}`;
  };
  const { timestamp, page } = queries;


  const notifications: NotificationResponse = await getNotifications(
	  {
		  id,
		  timestamp: timestamp ? Number(timestamp) : undefined,
		  page: page ? Number(page) : undefined
	  }
  ).catch((e) => {
    console.error(e);
    return [] as NotificationResponse;
  });
  return Response.json({
    notifications
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
