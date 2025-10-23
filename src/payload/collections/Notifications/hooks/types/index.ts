import type { ImageCollectionOverview } from "@/components/UX/Media/types";
import { type Asset, Notification } from "@/payload-types";
import type { RequiredAndNonNullable } from "@/utilities/typeUtilities";

export type SyncedAsset = Partial<Omit<Asset, keyof ImageCollectionOverview>> &
  RequiredAndNonNullable<ImageCollectionOverview>;

export type SyncedNotification = Omit<ResponseNotification, "trigger"> & {
  trigger: {
    relationTo: NonNullable<Notification["trigger"]>["relationTo"];
    value: string;
  } | null;
};

type ActionLinkBase = Partial<
  Omit<Notification["actionLink"], "reference" | "type" | "url">
>;
type ExternalActionLink = ActionLinkBase & {
  type: "custom";
  url: string;
  reference?: never;
};
type NotifiedCollections = NonNullable<
  Notification["actionLink"]["reference"]
>["relationTo"];
type RequiredRefe = {
  relationTo: NotifiedCollections;
  value: string;
};
export type NotificationTargets = RequiredRefe["relationTo"];
type InternalActionLink = ActionLinkBase & {
  type: "reference";
  reference: {
    relationTo: NotifiedCollections;
    value: string;
  };
  url?: string;
};

export type NotificationResponse = Array<ResponseNotification>;
export type LinkFieldParams = ExternalActionLink | InternalActionLink;

export type NotificationDoc = Omit<
  Notification,
  "recipient" | "thumbnail" | "actionLink" | "trigger"
> & {
  recipient: string;
  thumbnail?: string | null;
  trigger?: {
    relationTo: NonNullable<Notification["trigger"]>["relationTo"];
    value: string;
  } | null;
  actionLink: LinkFieldParams;
};
export type ResponseNotification = Omit<NotificationDoc, "thumbnail"> & {
  thumbnail: SyncedAsset | null;
  fallbackImage: { path: string; sizes: string } | null;
};
