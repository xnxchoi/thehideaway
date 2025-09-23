"use client";

import { useTheme } from "@/providers/Theme";
import { Cross1Icon } from "@radix-ui/react-icons";
import { useQuery } from "@tanstack/react-query";
import type { CollectionSlug } from "payload";
import { useCallback, useState, type ComponentProps } from "react";
import { Toaster as Sonner, toast as sonnerToast, ToasterProps } from "sonner";
import { useShallow } from "zustand/shallow";
import { useHumanTime } from "../../payload/collections/Deltas/component/useLocaleDate";
import type { SyncedNotification } from "../../payload/collections/Notifications/hooks/types";
import type { AuthorOverview } from "../../payload/collections/Posts/post-types";
import { useDomCursor } from "../core/cursorWrapper";
import { Button, Link } from "../UX/Link";
import { ReferencedLink } from "../UX/Link/referencedLink";
import { FrontImage } from "../UX/Media/FrontImage";
import { Avatar, AvatarFallback, AvatarImage } from "./avatar";
import { Skeleton } from "./skeleton";

export function notify({
  toast,
  notification,
  onDismiss,
  onRead
}: {
  onDismiss: ({ ids }: { ids: string[] }) => void;
  onRead: ({ ids }: { ids: string[] }) => void;
  toast: Omit<ToasterProps, "id">;
  notification: SyncedNotification;
}) {
  return sonnerToast.custom((id) => {
    switch (notification.trigger?.relationTo) {
      case "users":
        return (
          <UserNotification
            item={{
              ...notification,
              trigger: {
                relationTo: "users",
                value: notification.trigger?.value as string
              }
            }}
            id={id}
            onDismiss={onDismiss}
            onRead={onRead}
          />
        );
      default:
        return (
          <NotificationItem
            {...toast}
            item={notification}
            onDismiss={onDismiss}
            onRead={onRead}
          />
        );
    }
  });
}
const Notifier = ({ ...props }: ToasterProps) => {
  const theme = useTheme(useShallow((r) => r.theme));

  return (
    <Sonner
      theme={theme as ToasterProps["theme"]}
      position="top-right"
      className="notifier group"
      toastOptions={{
        classNames: {
          toast:
            "group toast group-[.notifier]:bg-button-background group-[.notifier]:text-foreground group-[.notifier]:border-border group-[.notifier]:shadow-lg",
          description: "group-[.toast]:text-muted-foreground",
          actionButton:
            "group-[.toast]:bg-primary group-[.toast]:text-primary-foreground font-medium",
          cancelButton:
            "group-[.toast]:bg-muted group-[.toast]:text-muted-foreground font-medium"
        }
      }}
      {...props}
    />
  );
};

export { Notifier };

const NotificationItem = (
  props: ToasterProps &
    Omit<ComponentProps<"div">, "id"> & {
      item: SyncedNotification;
      onDismiss: ({ ids }: { ids: string[] }) => void;
      onRead: ({ ids }: { ids: string[] }) => void;
    }
) => {
  const { item, id, onDismiss: oD, onRead: oR, ...rest } = props;
  const onDismiss = () => {
    oD({ ids: [item.id] });
    sonnerToast.dismiss(id);
  };
  const onRead = () => {
    oR({ ids: [item.id] });
  };
  const { dismissed, type, title, content, actionLink, thumbnail } = item;
  const [hovered, setHovered] = useState(false);
  const [mutating, setMutating] = useState(false);
  const { onMouseEnter, onMouseLeave } = useDomCursor({
    onEnter: (e) => {
      setHovered(true);
    },
    onLeave: (e) => {
      setHovered(false);
    }
  });
  return (
    <div
      key={item.id}
      className="relative h-full overflow-hidden rounded-[8px] bg-transparent max-lg:w-[90vw] max-lg:min-w-[20rem] min-lg:min-h-[6rem] min-lg:w-[15vw]"
      data-themed="background-color,border-color"
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      {...(hovered ? { "data-hovered": true } : {})}
    >
      <div className="relative flex gap-5">
        <div className="flex grow gap-5">
          <div className="absolute inset-0 z-[5] rounded-[8px] bg-transparent-base/5 backdrop-blur-[0.5px]" />
          <article
            className="relative z-20 flex flex-col gap-5"
            data-type="type"
          >
            <div className="space-y-1">
              <p className="text-sm font-medium">{title}</p>
              <p className="text-sm text-muted-foreground">{content}</p>
            </div>
            <div className="flex gap-2">
              <ReferencedLink
                onClick={onRead}
                link={actionLink}
                className="z-[5] flex h-full w-full flex-col items-start justify-start bg-transparent p-4"
                target="_blank"
                rel="noreferrer"
              ></ReferencedLink>
            </div>

            <div className="grid w-full grid-cols-[4.8rem_1fr] items-center gap-5 min-lg:items-start">
              <div className="aspect-square h-auto w-full [&_img]:block [&_img]:h-auto [&_img]:w-full [&_img]:max-w-full">
                <FrontImage resource={thumbnail} />
              </div>
              <h1
                className="mb-[6px] font-sans text-sm leading-[114%] font-semibold tracking-[-0.01em] min-lg:mb-[12px] min-lg:leading-[120%]"
                data-themed="color"
                style={{}}
              >
                {title}
              </h1>
            </div>
          </article>

          <Button
            className="group -my-1.5 -me-2 size-8 shrink-0 p-0 hover:bg-transparent"
            aria-label="Close notification"
            onClick={onDismiss}
          >
            <Cross1Icon
              className="opacity-60 transition-opacity group-hover:opacity-100"
              aria-hidden="true"
            />
          </Button>
        </div>
      </div>
    </div>
  );
};

function UserNotification({
  item,
  onDismiss: oD,
  onRead: oR,
  id
}: {
  item: SyncedNotification & {
    trigger: { relationTo: Extract<CollectionSlug, "users">; value: string };
  };
  id: string | number;
  onDismiss: ({ ids }: { ids: string[] }) => void;
  onRead: ({ ids }: { ids: string[] }) => void;
}) {
  const { id: itemId, title, content, actionLink, createdAt } = item;
  const onDismiss = useCallback(() => {
    oD({ ids: [] });
    sonnerToast.dismiss(id);
  }, [id, oD]);
  const onRead = useCallback(() => {
    oR({ ids: [itemId] });
    sonnerToast.dismiss(id);
  }, [id, itemId, oR]);
  const { data, isLoading, isPending } = useQuery({
    placeholderData: {
      name: "",
      displayUsername: "",
      image: "",
      id: "",
      slug: ""
    } as AuthorOverview,
    queryKey: ["user", item.trigger.value],
    queryFn: async ({ queryKey }: { queryKey: ["user", string] }) => {
      const res = await fetch(`/api/users/${queryKey[1]}/overview`);
      if (!res.ok) {
        throw new Error("Failed to fetch user overview");
      }
      const r = (await res.json()) as { data: AuthorOverview };
      if ("data" in r && r.data) {
        return r.data as AuthorOverview;
      }
      throw new Error("Failed to fetch user overview");
    },
    staleTime: Infinity,
    enabled: !!item.trigger.value
  });
  const humanTime = useHumanTime(createdAt);

  return (
    // To make the notification fixed, add classes like `fixed bottom-4 right-4` to the container element.

    <div className="z-50 max-w-[400px] rounded-md border bg-background p-4 shadow-lg">
      <div className="flex gap-3">
        {(!isLoading && (
          <Avatar>
            {(data?.image && (
              <AvatarImage src={data.image} width={32} height={32} alt="" />
            )) || (
              <AvatarFallback>
                {(data?.displayUsername || data?.name)?.at(0)}
              </AvatarFallback>
            )}
          </Avatar>
        )) || <Skeleton className="size-[32px] rounded-full" />}
        <div className="flex grow flex-col gap-3">
          <div className="space-y-3">
            {(isLoading && (
              <>
                <Skeleton className="h-[12px] w-[250px]" />
                <Skeleton className="h-[12px] w-[250px]" />
              </>
            )) || (
              <>
                <p className="text-sm text-muted-foreground">
                  <Link
                    className="relative z-[4] inline-block font-medium text-foreground hover:underline"
                    href={`/@${data?.slug}`}
                  >
                    {data?.displayUsername || data?.name}
                  </Link>
                  {(item.type === "mention" && "mentioned you") ||
                    (item.type === "follow" && "followed you") ||
                    (item.type === "comment" && "commented") ||
                    (item.type === "bookmark" && "bookmarked")}
                  <ReferencedLink
                    link={actionLink}
                    onClick={onRead}
                    className={
                      "absolute inset-0 z-[0] bg-faded-foreground/10 opacity-0 transition-opacity duration-200 ease-out-power2 hover:opacity-100"
                    }
                  />
                  .
                </p>
                <p className="text-xs text-muted-foreground">{humanTime}</p>
              </>
            )}
          </div>
          {/* <div className="flex gap-2">
            <Button
              className={
                "bg-faded-foreground text-[oklch(var(--n-s-btn-inverted))]"
              }
            >
              Accept
            </Button>
            <Button
              className={
                "border-[1px] border-solid border-[oklch(var(--n-s-bb))] text-[oklch(var(--n-s-btn))]"
              }
            >
              Decline
            </Button>
          </div> */}
        </div>
        <Button
          className="group -my-1.5 -me-2 size-8 shrink-0 p-0 hover:bg-transparent"
          aria-label="Close notification"
          onClick={onDismiss}
        >
          <Cross1Icon
            className="opacity-60 transition-opacity group-hover:opacity-100"
            aria-hidden="true"
          />
        </Button>
      </div>
    </div>
  );
}
