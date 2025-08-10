"use server";
import pload, {
	CollectionAfterChangeHook,
	CollectionSlug,
	PayloadRequest,
} from "payload";
import {User} from "@/payload-types";
import {DateTime} from "luxon";
import config from "@payload-config";
import {RequireKeysAndRestOptional} from "@/utilities/typeUtilities";
import {cache} from "react";
import {createNotification} from "@collections/Notifications/hooks/createNotification";

export const afterChangeUsers: CollectionAfterChangeHook<User> = async ({
	doc,
	req,
	operation,
}) => {
	if (operation === "create") {
		const userId = doc.id;
		if (!userId) return doc;
		await onboardUser({userId, payload: req.payload});
		return doc;
	}
	return doc;
};
export const onboardUser = async (args: {
	userId: string;
	payload: PayloadRequest["payload"];
	req?: PayloadRequest;
}) => {
	const payload = args.payload;
	const userId = args.userId;
	const req = args.req;
	if (!payload) return;
	if (!userId) {
		payload.logger.error("No user ID provided");
		return;
	}
	const serverUrl =
		process.env.NEXT_PUBLIC_SERVER_URL || "http://localhost:3000";
	try {
		// Queue the job using the Local API (this still works for queuing)
		const job = await payload.jobs.queue({
			task: "welcomeUser",
			input: {
				userId,
			},
			...((req && {req}) || {}),
			waitUntil: new Date(Date.now() + 2000), // Wait 2 seconds
		});

		payload.logger.info(`Queued welcomeUser task ${job.id} for User ${userId}`);

		// Trigger job execution via HTTP endpoint
		setTimeout(async () => {
			try {
				const jobResponse = await fetch(`${serverUrl}/api/payload-jobs/run`, {
					method: "POST",
					headers: {
						"Content-Type": "application/json",
						...(process.env.CRON_SECRET && {
							Authorization: `Bearer ${process.env.CRON_SECRET}`,
						}),
					},
					credentials: "include",
				});

				if (jobResponse.ok) {
					const result = await jobResponse.json();
					payload.logger.info(
						`Successfully triggered job execution for user ${userId}: ${JSON.stringify(
							result)}`,
					);
				} else {
					const errorText = await jobResponse.text();
					payload.logger.warn(
						`Failed to trigger job execution for user ${userId}: ${jobResponse.status} ${errorText}`,
					);
				}
			} catch (jobError) {
				payload.logger.warn(
					`Error triggering job execution for user ${userId}: ${(jobError as Error).message}`,
				);
			}
		}, 2000); // Wait 2 seconds for job execution
	} catch (queueError) {
		payload.logger.error(
			`Failed to queue gallery sync task for user ${userId}: ${(queueError as Error).message}`,
		);
	}
};
export const createWelcomeNotification = async (args: {
	user: RequireKeysAndRestOptional<User, "id" | "firstName" | "role">;
	req?: PayloadRequest;
}) => {
	const user = args.user;
	const stuff =
		(args?.req && {
			onBegin: async () => {
			},
			onFail: async () => {
			},
			req: args.req,
		}) ||
		(await createAndReturnPayload({user}));
	const {req, onBegin, onFail} = stuff;
	try {
		if (!args.req) {
			const transactionID = req.transactionID;
			if (!transactionID) throw new Error("No transaction ID found");

			await createN({user, req: {...req, transactionID}});
			await onBegin();
		} else {
			await createN({user, req: args.req});
		}
	} catch (err) {
		console.error(err);
		req.payload.logger.error(err);
		await onFail();
	}
};
export const createN = async ({
	user,
	req,
}: {
	user: RequireKeysAndRestOptional<User, "id" | "firstName" | "role">;
	req:
		| RequireKeysAndRestOptional<
		Pick<PayloadRequest, "payload" | "context" | "user" | "transactionID">,
		"payload" | "context" | "user" | "transactionID"
	>
		| PayloadRequest;
}) => {
	const payload = req.payload;
	const {id, firstName} = user;
	const hour = DateTime.now().hour;
	const greeting = hour < 12 ? "Morning" : hour < 18 ? "Afternoon" : "Evening";
	await createNotification(
		{
			title: `Welcome to The Hideaway.`,
			content: `Good ${greeting}, ${firstName}!\nWe are amazed to have you!\nWe just need a few more details to get started.\nPlease visit the link below to complete your onboarding :)`,
			type: "system",
			importance: 1,
			recipient: id,
			sticky: false,
			actionLink: {
				label: "Profile Completion",
				url: `/account/onboarding`,
				type: "custom",
				newTab: false,
			},
		},
		req,
	);

	await payload.update({
		req,
		collection: "users",
		overrideAccess: true,
		context: {
			overrideAccess: true,
			user: {
				role: req.user?.role || "guest",
			},
		},
		where: {
			id: {
				equals: id,
			},
		},
		data: {
			onboarded: true,
		},
	});
};
const createAndReturnPayload = cache(
	async ({
		user,
	}: {
		user: RequireKeysAndRestOptional<User, "id" | "firstName" | "role">;
	}) => {
		const payload = pload;
		await pload.init({config});
		const transactionID = await payload.db.beginTransaction();
		const onBegin = async () => {
			transactionID && (await payload.db.commitTransaction(transactionID));
		};
		const onFail = async () => {
			transactionID && (await payload.db.rollbackTransaction(transactionID));
		};
		const userr = await payload.findByID({
			collection: "users",
			id: user.id,
		});
		const req = {
			payload,
			context: {
				overrideAccess: true,
				user: userr,
			},
			user: {
				...userr,
				collection: "users" as Extract<CollectionSlug, "users">,
			},

			transactionID,
		};
		return {
			req,
			onBegin,
			onFail,
		};
	},
);
const createNonLocalAPINotification = async ({
	greeting,
	user,
}: {
	greeting: string;
	user: User;
}) => {
	const {id, firstName} = user;
	const payload = pload;
	await pload.init({config});
	const transactionID = await payload.db.beginTransaction();
	if (!transactionID) {
		payload.logger.error(
			"Failed to create transaction at createWelcomeNotification",
		);
		return;
	}
	const req = {
		payload,
		context: {
			user,
			overrideAccess: true,
		},
		transactionID,
	};
	try {
	} catch (err) {
		console.error(err);
		payload.logger.error(err);
		await payload.db.rollbackTransaction(transactionID);
	}
};
