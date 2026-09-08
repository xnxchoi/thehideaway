import {
  NotificationDoc,
  NotificationResponse,
  ResponseNotification,
  SyncedAsset,
  SyncedNotification
} from "@/payload/collections/Notifications/hooks/types";
import { RalueAsDataWithRelation } from "@types/collections/image-collections";
import { imageSelect } from "@types/payload-api-selects";
import { getFallbackImage } from "@/utilities/getFallbackImage";
import type { OptionalKeys } from "@/utilities/typeUtilities";
import config from "@payload-config";
import { NotificationsSelect } from "@payload-types";
import { getPayload, type Where } from "payload";

type RP_NotificationKeys = keyof ResponseNotification;
export const notifySelect = (): Pick<
  NotificationsSelect<true>,
  Exclude<RP_NotificationKeys, "id" | "fallbackImage">
> & {
  id: true;
} => ({
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
  recipient: true
});
type UnreliableNotificationFieldKeys = OptionalKeys<ResponseNotification>;

function makeNotification(
  notification: ResponseNotification
): SyncedNotification {
  const asIs = {
    ...notification
  } satisfies Omit<ResponseNotification, UnreliableNotificationFieldKeys>;
  const toChange: Pick<SyncedNotification, UnreliableNotificationFieldKeys> = {
    readAt: notification.readAt ?? null,
    trigger: notification.trigger || null
  };

  return {
    ...asIs,
    ...toChange
  };
}

export function makeNotifications(
  fetchResponse: NotificationResponse
): Array<SyncedNotification> {
  return fetchResponse.map(makeNotification) as SyncedNotification[];
}

export const getNotifications = async ({
  id,
  timestamp,
  page
}: {
  id: string;
  timestamp?: number;
  page?: number;
}) => {
  const payload = await getPayload({ config });
  const query: Where & { and: Where[] } = {
    and: [
      {
        recipient: {
          equals: id
        }
      },
      {
        status: {
          not_equals: "dismissed"
        }
      }
    ]
  };
  timestamp &&
    query.and.push({
      createdAt: {
        greater_than_equal: new Date(timestamp - 60 * 1000 * 2).toISOString()
      }
    });
  let params = {};
  if (page) {
    params = {
      ...params,
      page
    };
  } else {
    params = {
      pagination: false
    };
  }
  const notSelect = notifySelect();
  const not = (await payload
    .find({
      collection: "notifications",
      overrideAccess: true,

      select: notSelect,
      where: query,

      sort: ["-sticky", "-createdAt"],
      limit: 50,
      ...params
    })
    .then((r) => r.docs)
    .catch((e) => {
      console.error({
        message:
          `Error while fetching notifications for ` +
          (id ? id : "a user that was not found"),
        error: e,
        user: id,
        time: new Date().toISOString()
      });
      return [];
    })) as Array<NotificationDoc>;
  const select = imageSelect();
  const fallbackImage = await getFallbackImage();
  const res = await Promise.allSettled(
    not.map((v, i) =>
      v.thumbnail
        ? payload
            .findByID({
              collection: "assets",
              id: v.thumbnail,
              select
            })
            .then((r) => {
              const { src, url, alt } = r;
              if (!src || !url) throw new Error("No src found in thumbnail");
              const last: RalueAsDataWithRelation = {
                relationTo: "assets",
                value: {
                  src,
                  alt,
                  darkmode: r.darkmode,
                  id: r.id,

                  url
                }
              };
              return last;
            })
            .then((r) => ({
              ...v,
              thumbnail: Object.values(r).reduce(
                (p, n) => Boolean(p && n !== null),
                true
              )
                ? (r as SyncedAsset)
                : null
            }))
        : Promise.resolve({
            ...v,
            thumbnail: null
          })
    )
  );
  const final: NotificationResponse = [];
  res.forEach((v, i) => {
    if (v.status === "fulfilled") {
      final.push({
        ...v.value,
        fallbackImage
      });
    } else {
      const p = not.at(i)!;
      final.push({ ...p, thumbnail: null, fallbackImage });
    }
  });
  return final;
};
