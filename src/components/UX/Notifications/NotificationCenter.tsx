"use client";

import {
  Archive,
  AtSignIcon,
  Bell,
  BellOff,
  CheckCircle2,
  Eye,
  MessageCircle,
  Search,
  User2,
  XCircle
} from "lucide-react";
import { AnimatePresence } from "motion/react";
import * as motion from "motion/react-m";
import { useCallback, useMemo, useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";

import { ReferencedLink } from "@/components/UX/Link/referencedLink";
import { FrontImage } from "@/components/UX/Media/FrontImage";
import { useHumanDate } from "@/payload/collections/Deltas/component/useLocaleDate";
import type { SyncedNotification } from "@/payload/collections/Notifications/hooks/types";
import { useNotifications } from "@/providers/Notifications";
import { BookmarkIcon, ExclamationTriangleIcon } from "@radix-ui/react-icons";
import { cn } from "@/lib/utils";
import dynamic from "next/dynamic";
type FilterType = "all" | "unread" | "read" | "dismissed";
type SortType = "newest" | "oldest" | "type";

interface NotificationCenterProps {
  className?: string;
}
const ScrollArea = dynamic(
  () => import("@/components/ui/scroll-area").then((m) => m.ScrollArea),
  {
    ssr: false
  }
);
export const NotificationCenter = ({ className }: NotificationCenterProps) => {
  const { notifications, isLoading, count, setRead, setDismissed, setAllRead } =
    useNotifications();

  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState<FilterType>("all");
  const [sortType, setSortType] = useState<SortType>("newest");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // Filter and sort notifications
  const filteredNotifications = useMemo(() => {
    let filtered = notifications;

    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (notification) =>
          notification.title.toLowerCase().includes(query) ||
          notification.content?.toLowerCase().includes(query) ||
          notification.type.toLowerCase().includes(query)
      );
    }

    // Apply status filter
    switch (filterType) {
      case "unread":
        filtered = filtered.filter((n) => !n.read);
        break;
      case "read":
        filtered = filtered.filter((n) => n.read && !n.dismissed);
        break;
      case "dismissed":
        filtered = filtered.filter((n) => n.dismissed);
        break;
      default:
        filtered = filtered.filter((n) => !n.dismissed);
    }

    // Apply sorting
    switch (sortType) {
      case "oldest":
        filtered = [...filtered].sort(
          (a, b) =>
            new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
        );
        break;
      case "type":
        filtered = [...filtered].sort((a, b) => a.type.localeCompare(b.type));
        break;
      default: // newest
        filtered = [...filtered].sort(
          (a, b) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
    }

    return filtered;
  }, [notifications, searchQuery, filterType, sortType]);

  // Group notifications by date
  const groupedNotifications = useMemo(() => {
    const groups: Record<string, SyncedNotification[]> = {};

    filteredNotifications.forEach((notification) => {
      const date = new Date(notification.createdAt);
      const today = new Date();
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);

      let groupKey: string;
      if (date.toDateString() === today.toDateString()) {
        groupKey = "Today";
      } else if (date.toDateString() === yesterday.toDateString()) {
        groupKey = "Yesterday";
      } else {
        groupKey = date.toLocaleDateString("en-US", {
          weekday: "long",
          month: "short",
          day: "numeric"
        });
      }

      if (!groups[groupKey]) {
        groups[groupKey] = [];
      }
      groups[groupKey].push(notification);
    });

    return groups;
  }, [filteredNotifications]);

  const unreadCount = useMemo(
    () => notifications.filter((n) => !n.read && !n.dismissed).length,
    [notifications]
  );

  const handleSelectAll = useCallback(() => {
    if (selectedIds.size === filteredNotifications.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredNotifications.map((n) => n.id)));
    }
  }, [filteredNotifications, selectedIds.size]);

  const handleBulkAction = useCallback(
    (action: "read" | "dismiss") => {
      const ids = Array.from(selectedIds);
      if (ids.length === 0) return;

      if (action === "read") {
        setRead({ ids });
      } else {
        setDismissed({ ids });
      }
      setSelectedIds(new Set());
    },
    [selectedIds, setRead, setDismissed]
  );

  const handleToggleSelect = useCallback(
    (id: string) => {
      const newSelected = new Set(selectedIds);
      if (newSelected.has(id)) {
        newSelected.delete(id);
      } else {
        newSelected.add(id);
      }
      setSelectedIds(newSelected);
    },
    [selectedIds]
  );

  return (
    <div
      className={`mx-auto my-10 mt-[10rem] flex h-full max-w-[90vw] flex-col font-sans ${className}`}
    >
      {/* Header */}
      <div className="sticky top-0 z-10 flex flex-col gap-4 border-b bg-background/50 p-6 backdrop-blur-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Bell className="h-[24px] w-[24px] text-foreground" />
            <div>
              <h1 className="text-3xl font-bold">Notifications</h1>
              <p className="text-base text-muted-foreground">
                {unreadCount > 0 ? `${unreadCount} unread` : "All caught up!"}
              </p>
            </div>
          </div>

          {unreadCount > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setAllRead()}
              disabled={isLoading}
            >
              <CheckCircle2 className="mr-2 h-[16px] w-[16px]" />
              Mark all read
            </Button>
          )}
        </div>

        {/* Search and Filters */}
        <div className="flex flex-col gap-3 sm:flex-row">
          <div className="relative flex-1">
            <Search className="absolute top-1/2 left-3 h-[16px] w-[16px] -translate-y-1/2 transform text-muted-foreground" />
            <Input
              placeholder="Search notifications..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>

          <div className="flex gap-2">
            <Select
              value={filterType}
              onValueChange={(value: FilterType) => setFilterType(value)}
            >
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="unread">Unread</SelectItem>
                <SelectItem value="read">Read</SelectItem>
                <SelectItem value="dismissed">Dismissed</SelectItem>
              </SelectContent>
            </Select>

            <Select
              value={sortType}
              onValueChange={(value: SortType) => setSortType(value)}
            >
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="newest">Newest</SelectItem>
                <SelectItem value="oldest">Oldest</SelectItem>
                <SelectItem value="type">By Type</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <div className={"relative h-[4rem] w-full"}>
          {/* Bulk Actions */}
          {selectedIds.size > 0 && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-center gap-3 rounded-lg border bg-background/5 p-3"
            >
              <span className="text-base font-medium">
                {selectedIds.size} selected
              </span>
              <Separator orientation="vertical" className="h-[16px]" />
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleBulkAction("read")}
                  disabled={isLoading}
                >
                  <Eye className="mr-1 h-[16px] w-[16px]" />
                  Mark read
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleBulkAction("dismiss")}
                  disabled={isLoading}
                >
                  <Archive className="mr-1 h-[16px] w-[16px]" />
                  Dismiss
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setSelectedIds(new Set())}
                >
                  Cancel
                </Button>
              </div>
            </motion.div>
          )}
        </div>
      </div>

      {/* Content */}
      <ScrollArea className="max-h-[75vh] flex-1">
        <div className="p-6">
          {isLoading && filteredNotifications.length === 0 ? (
            <NotificationSkeleton />
          ) : Object.keys(groupedNotifications).length === 0 ? (
            <EmptyState searchQuery={searchQuery} filterType={filterType} />
          ) : (
            <div className="space-y-6">
              {Object.entries(groupedNotifications).map(
                ([date, notifications]) => (
                  <motion.div
                    key={date}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3 }}
                  >
                    <h3 className="sticky top-0 mb-3 bg-background/80 py-2 text-base font-semibold text-muted-foreground backdrop-blur-sm">
                      {date}
                    </h3>
                    <motion.div
                      className="space-y-3"
                      initial="hidden"
                      animate="visible"
                      variants={{
                        visible: {
                          transition: {
                            staggerChildren: 0.05
                          }
                        }
                      }}
                    >
                      <AnimatePresence mode="popLayout">
                        {notifications.map((notification) => (
                          <NotificationCard
                            key={notification.id}
                            notification={notification}
                            isSelected={selectedIds.has(notification.id)}
                            onToggleSelect={handleToggleSelect}
                            onRead={setRead}
                            onDismiss={setDismissed}
                          />
                        ))}
                      </AnimatePresence>
                    </motion.div>
                  </motion.div>
                )
              )}
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
};

// Notification Card Component
interface NotificationCardProps {
  notification: SyncedNotification;
  isSelected: boolean;
  onToggleSelect: (id: string) => void;
  onRead: ({ ids }: { ids: string[] }) => void;
  onDismiss: ({ ids }: { ids: string[] }) => void;
}

const NotificationCard = ({
  notification,
  isSelected,
  onToggleSelect,
  onRead,
  onDismiss
}: NotificationCardProps) => {
  const { getRelativeTime } = useHumanDate();
  const [isHovered, setIsHovered] = useState(false);

  const handleMarkRead = useCallback(() => {
    onRead({ ids: [notification.id] });
  }, [notification.id, onRead]);

  const handleDismiss = useCallback(() => {
    onDismiss({ ids: [notification.id] });
  }, [notification.id, onDismiss]);

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "follow":
        return <User2 />;
      case "comment":
        return <MessageCircle />;
      case "mention":
        return <AtSignIcon />;
      case "bookmark":
        return <BookmarkIcon />;
      default:
        return <ExclamationTriangleIcon />;
    }
  };

  const getStatusColor = (notification: SyncedNotification) => {
    if (notification.dismissed) return "text-muted-foreground";
    if (!notification.read) return "text-foreground";
    return "text-foreground";
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, x: -100 }}
      variants={{
        hidden: { opacity: 0, y: 20 },
        visible: { opacity: 1, y: 0 }
      }}
      whileHover={{ scale: 1 }}
      transition={{ duration: 0.2 }}
    >
      <Card
        className={cn(
          "group cursor-pointer transition-all duration-200",
          !notification.read && !notification.dismissed
            ? "border-muted-faded-background/20 bg-muted-faded-background/5"
            : notification.dismissed
              ? "opacity-60"
              : ""
        )}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        onClick={() => onToggleSelect(notification.id)}
      >
        <CardContent className="p-4">
          <div className="flex gap-4">
            {/* Selection Checkbox */}
            <div className="flex items-start pt-1">
              <div
                className={cn(
                  "flex h-[16px] w-[16px] items-center justify-center rounded border-2 transition-all",
                  isSelected
                    ? "border-muted-faded-background/20 bg-muted-faded-background/5"
                    : "border-muted-foreground/30 hover:border-muted-faded-background/20"
                )}
              >
                {isSelected && (
                  <CheckCircle2 className="text-foreground-foreground h-[12px] w-[12px]" />
                )}
              </div>
            </div>

            {/* Thumbnail */}
            {notification.thumbnail && (
              <div className="h-12 w-12 flex-shrink-0 overflow-hidden rounded-lg">
                <FrontImage
                  resource={notification.thumbnail}
                  className="h-full w-full object-cover"
                />
              </div>
            )}

            {/* Content */}
            <div className="min-w-0 flex-1">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1">
                  <div className="mb-1 flex items-center gap-2">
                    <span className="text-lg">
                      {getNotificationIcon(notification.type)}
                    </span>
                    <Badge variant="secondary" className="text-base">
                      {notification.type}
                    </Badge>
                    {!notification.read && !notification.dismissed && (
                      <div className="h-[8px] w-[8px] rounded-full bg-background" />
                    )}
                  </div>

                  <h4
                    className={cn(
                      "mb-1 text-base font-semibold",
                      getStatusColor(notification)
                    )}
                  >
                    {notification.actionLink ? (
                      <ReferencedLink
                        link={notification.actionLink}
                        onClick={handleMarkRead}
                        className="hover:underline"
                      >
                        {notification.title}
                      </ReferencedLink>
                    ) : (
                      notification.title
                    )}
                  </h4>

                  {notification.content && (
                    <p className="line-clamp-2 text-base text-muted-foreground">
                      {notification.content}
                    </p>
                  )}

                  <p className="mt-2 text-base text-muted-foreground">
                    {getRelativeTime({ timestamp: notification.createdAt })}
                  </p>
                </div>

                {/* Actions */}
                <AnimatePresence>
                  {(isHovered || isSelected) && (
                    <motion.div
                      initial={{ opacity: 0, translateZ: 0 }}
                      animate={{ opacity: 1, translateZ: 10 }}
                      exit={{ opacity: 0, translateZ: 0 }}
                      className="flex gap-1"
                      onClick={(e) => e.stopPropagation()}
                    >
                      {!notification.read && (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={handleMarkRead}
                          className="h-[32px] w-[32px] p-0"
                        >
                          <Eye className="h-[16px] w-[16px]" />
                        </Button>
                      )}
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={handleDismiss}
                        className="h-[32px] w-[32px] p-0 text-muted-foreground hover:text-destructive"
                      >
                        <XCircle className="h-[16px] w-[16px]" />
                      </Button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};

// Empty State Component
const EmptyState = ({
  searchQuery,
  filterType
}: {
  searchQuery: string;
  filterType: FilterType;
}) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    className="flex flex-col items-center justify-center py-12 text-center"
  >
    <BellOff className="mb-4 h-16 w-16 text-muted-foreground/50" />
    <h3 className="mb-2 text-lg font-semibold">
      {searchQuery
        ? "No notifications found"
        : filterType === "unread"
          ? "No unread notifications"
          : "No notifications"}
    </h3>
    <p className="max-w-sm text-muted-foreground">
      {searchQuery
        ? `No notifications match "${searchQuery}". Try adjusting your search.`
        : filterType === "unread"
          ? "You're all caught up! No unread notifications."
          : "You don't have any notifications yet."}
    </p>
  </motion.div>
);

// Loading Skeleton
const NotificationSkeleton = () => (
  <div className="space-y-6">
    {[1, 2, 3].map((group) => (
      <div key={group}>
        <Skeleton className="mb-3 h-[16px] w-20" />
        <div className="space-y-3">
          {[1, 2, 3].map((item) => (
            <Card key={item}>
              <CardContent className="p-4">
                <div className="flex gap-4">
                  <Skeleton className="h-[16px] w-[16px] rounded" />
                  <Skeleton className="h-12 w-12 rounded-lg" />
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center gap-2">
                      <Skeleton className="h-[16px] w-6" />
                      <Skeleton className="h-[16px] w-16" />
                    </div>
                    <Skeleton className="h-[16px] w-3/4" />
                    <Skeleton className="h-[12px] w-full" />
                    <Skeleton className="h-[12px] w-[80px]" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    ))}
  </div>
);
