"use server";
import { User } from "@/payload-types";
import { createNotification } from "@/payload/collections/Notifications/hooks/createNotification";
import { RequireKeysAndRestOptional } from "@/utilities/typeUtilities";
import config from "@payload-config";
import { DateTime } from "luxon";
import pload, {
  CollectionAfterChangeHook,
  CollectionSlug,
  PayloadRequest
} from "payload";
import { cache } from "react";

export const afterChangeUsers: CollectionAfterChangeHook<User> = async ({
  doc,
  data,
  req,
  operation
}) => {
  if (operation === "create") {
    const userId = doc.id;
    if (!userId) return doc;
    await onboardUser({ userId, payload: req.payload });
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

  try {
    // Queue the welcome task. The job is durable — it survives restarts
    // because Payload persists it before queue() returns.
    const job = await payload.jobs.queue({
      task: "welcomeUser",
      input: { userId },
      ...((req && { req }) || {})
    });

    payload.logger.info(`Queued welcomeUser task ${job.id} for User ${userId}`);

    // Run the queue in-process via the local API. The previous implementation
    // self-HTTP'd `/api/payload-jobs/run` with the CRON_SECRET as a Bearer
    // token, which (a) exposed the secret to any reverse proxy or APM tool
    // sitting between the server and itself, (b) used `setTimeout` so a
    // restart mid-flight dropped the trigger silently, and (c) added a
    // pointless network round-trip for an operation that runs in the same
    // process. The local API call is durable, synchronous-ish (awaited),
    // and never touches the network.
    payload.jobs
      .run({ allQueues: false })
      .then((result) => {
        payload.logger.info(
          `Ran welcomeUser queue for user ${userId}: ${JSON.stringify(result)}`
        );
      })
      .catch((runErr) => {
        payload.logger.warn(
          `Error running welcomeUser job for user ${userId}: ${
            (runErr as Error).message
          }`
        );
      });
  } catch (queueError) {
    payload.logger.error(
      `Failed to queue welcomeUser task for user ${userId}: ${(queueError as Error).message}`
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
      onBegin: async () => {},
      onFail: async () => {},
      req: args.req
    }) ||
    (await createAndReturnPayload({ user }));
  const { req, onBegin, onFail } = stuff;
  try {
    if (!args.req) {
      const transactionID = req.transactionID;
      if (!transactionID) throw new Error("No transaction ID found");

      await createN({ user, req: { ...req, transactionID } });
      await onBegin();
    } else {
      await createN({ user, req: args.req });
    }
  } catch (err) {
    console.error(err);
    req.payload.logger.error(err);
    await onFail();
  }
};
export const createN = async ({
  user,
  req
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
  const { id, firstName } = user;
  const hour = DateTime.now().hour;
  const greeting = hour < 12 ? "Morning" : hour < 18 ? "Afternoon" : "Evening";
  await createNotification(
    {
      title: `Welcome to The Hideaway.`,
      content: `Good ${greeting}, ${firstName}!\nWe are glad to have you here.\nAn onboarding guide will walk you through the essentials — you can revisit it any time by pressing ?.`,
      type: "system",
      importance: 1,
      recipient: id,
      sticky: false,
      actionLink: {
        label: "Explore",
        url: `/`,
        type: "custom",
        newTab: false
      }
    },
    req
  );
  // onboarded is intentionally left as false here.
  // The in-app registration tour sets it to true once the user completes it.
};
const createAndReturnPayload = cache(
  async ({
    user
  }: {
    user: RequireKeysAndRestOptional<User, "id" | "firstName" | "role">;
  }) => {
    const payload = pload;
    await pload.init({ config });
    const transactionID = await payload.db.beginTransaction();
    const onBegin = async () => {
      transactionID && (await payload.db.commitTransaction(transactionID));
    };
    const onFail = async () => {
      transactionID && (await payload.db.rollbackTransaction(transactionID));
    };
    const userr = await payload.findByID({
      collection: "users",
      id: user.id
    });
    const req = {
      payload,
      context: {
        overrideAccess: true,
        user: userr
      },
      user: {
        ...userr,
        collection: "users" as Extract<CollectionSlug, "users">
      },

      transactionID
    };
    return {
      req,
      onBegin,
      onFail
    };
  }
);
const createNonLocalAPINotification = async ({
  greeting,
  user
}: {
  greeting: string;
  user: User;
}) => {
  const { id, firstName } = user;
  const payload = pload;
  await pload.init({ config });
  const transactionID = await payload.db.beginTransaction();
  if (!transactionID) {
    payload.logger.error(
      "Failed to create transaction at createWelcomeNotification"
    );
    return;
  }
  const req = {
    payload,
    context: {
      user,
      overrideAccess: true
    },
    transactionID
  };
  try {
  } catch (err) {
    console.error(err);
    payload.logger.error(err);
    await payload.db.rollbackTransaction(transactionID);
  }
};
