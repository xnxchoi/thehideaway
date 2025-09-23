"use client";

import {
  DataTableActionBar,
  DataTableActionBarAction,
  DataTableActionBarSelection
} from "@/components/data-table/data-table-action-bar";
import { Separator } from "@/components/ui/separator";
import type { SyncedNotification } from "@/payload/collections/Notifications/hooks/types";
import { useNotifications } from "@/providers/Notifications";
import { Cross2Icon, EyeClosedIcon, EyeOpenIcon } from "@radix-ui/react-icons";
import type { Table } from "@tanstack/react-table";
import { useCallback, useTransition, useState } from "react";

const actions = ["mark-as-unread", "mark-as-read", "dismiss"] as const;

type Action = (typeof actions)[number];

interface NorTableActionBarProps {
  table: Table<SyncedNotification>;
}

export function NAction({ table }: NorTableActionBarProps) {
  const rows = table.getFilteredSelectedRowModel().rows;

  const [currentAction, setCurrentAction] = useState<Action | null>(null);
  const { setDismissed, setRead, isLoading } = useNotifications();

  const onNotificationUpdate = useCallback(
    ({
      field,
      value
    }: {
      field: "status";
      value: Extract<SyncedNotification["status"], "read" | "unread">;
    }) => {
      const rows = table.getFilteredSelectedRowModel().rows;
      setCurrentAction(`mark-as-${value}`);
      switch (value) {
        case "read":
          setRead({ ids: rows.map((row) => row.original.id) });
          break;
        case "unread":
          setRead({ ids: rows.map((row) => row.original.id) });
          break;
      }
    },
    [setRead, table]
  );

  const onNotificationDismiss = useCallback(() => {
    setCurrentAction("dismiss");
    setDismissed({ ids: rows.map((row) => row.original.id) });
    table.toggleAllRowsSelected(false);
  }, [rows, table, setDismissed]);

  return (
    <DataTableActionBar table={table} visible={rows.length > 0}>
      <DataTableActionBarSelection table={table} />
      <Separator
        orientation="vertical"
        className="hidden data-[orientation=vertical]:h-5 sm:block"
      />
      <div className="flex items-center gap-1.5">
        <DataTableActionBarAction
          size="icon"
          tooltip="Set as Read"
          isPending={currentAction === "mark-as-read" && isLoading}
          onClick={() =>
            onNotificationUpdate({
              field: "status",
              value: "read"
            })
          }
        >
          <EyeOpenIcon />
        </DataTableActionBarAction>
        <DataTableActionBarAction
          size="icon"
          tooltip="Set as Unread"
          isPending={currentAction === "mark-as-unread" && isLoading}
          onClick={() =>
            onNotificationUpdate({
              field: "status",
              value: "unread"
            })
          }
        >
          <EyeClosedIcon />
        </DataTableActionBarAction>
        <DataTableActionBarAction
          size="icon"
          tooltip="Dismiss"
          isPending={currentAction === "dismiss" && isLoading}
          onClick={onNotificationDismiss}
        >
          <Cross2Icon />
        </DataTableActionBarAction>
      </div>
    </DataTableActionBar>
  );
}
