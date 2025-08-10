"use server";
import {HANDLE_TEST_REGEX} from "@/payload/fields/handle/formatUserHandle";
import {draftMode} from "next/headers";
import {PayloadHandler, Where} from "payload";
import {cache} from "react";

export const validateHandler: PayloadHandler = cache(async (req) => {
	if (!req.user) {
		return Response.json({error: "forbidden"}, {status: 403});
	}

	const body = req.query;
	if (!body) {
		return Response.json(
			{
				error:
					"Required parameters missing... More like entirely: req.data is empty",
			},
			{status: 400},
		);
	}
	const {operation, user: userID, id, handle} = body;
	console.log(operation, userID, id, handle);
	if (!operation || !userID || !handle || typeof handle !== "string") {
		const missing = {
			operation: Boolean(operation),
			user: Boolean(userID),
			handle: Boolean(handle),
		};
		let missingKeys = Object.keys(missing).filter((key) => !missing[key]).join(", ");
		if (typeof handle !== "string") {
			missingKeys += "; Handle is not a string";
		}
		return Response.json(
			{
				error: `Required parameters missing - ${missingKeys}`,
			},
			{status: 400},
		);
	}
	if (operation === "update" && !id) {
		return Response.json(
			{error: "id is required for update operation"},
			{status: 400},
		);
	}
	if (!HANDLE_TEST_REGEX.test(handle)) {
		return Response.json({error: "Invalid handle format"}, {status: 400});
	}
	const draft = await draftMode();
	const payload = req.payload;
	const lQ: Where =
		operation === "update"
			? {
				and: [
					{
						id: {
							not_in: [id],
						},
					},
					{
						or: [
							{
								slug: {
									equals: handle,
								},
							},
							{
								name: {
									equals: handle,
								},
							},
						],
					},
				],
			}
			: {
				or: [
					{
						slug: {
							equals: handle,
						},
					},
					{
						name: {
							equals: handle,
						},
					},
				],
			};
	const existsPromise = payload.find({
		collection: "users",
		draft: draft.isEnabled,
		limit: 1,
		where: lQ,
		depth: 1,
		overrideAccess: true,
		pagination: false,
	}).then((r) => r.totalDocs > 0).catch((e) => {
		console.error({
			message: `Error while checking if handle ${handle} exists`,
			error: e,
		});
		return false;
	});

	const exists = await existsPromise;
	if (exists) {
		return Response.json({error: "handle already exists"}, {status: 409});
	}
	return Response.json({message: "ok", handle: handle}, {status: 200});
});
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
