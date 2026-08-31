import { Config, Plugin } from "payload";

import { StockLocations } from "@/payload/collections/(consumption)/StockLocations";
import { InventoryLevels } from "@/payload/collections/(consumption)/InventoryLevels";
import { InventoryMovements } from "@/payload/collections/(consumption)/InventoryMovements";
import { InventoryReceipts } from "@/payload/collections/(consumption)/InventoryReceipts";
import { InventoryReceiptLines } from "@/payload/collections/(consumption)/InventoryReceiptLines";
import { InventoryLots } from "@/payload/collections/(consumption)/InventoryLots";
import { InventoryCycleCounts } from "@/payload/collections/(consumption)/InventoryCycleCounts";
import { InventoryCycleCountLines } from "@/payload/collections/(consumption)/InventoryCycleCountLines";
import { InventoryReservations } from "@/payload/collections/(consumption)/InventoryReservations";
import { InventoryReservationOperatorEvents } from "@/payload/collections/(consumption)/InventoryReservationOperatorEvents";
import { InventoryReservationEntries } from "@/payload/collections/(consumption)/InventoryReservationEntries";

export interface InventoryPluginConfig {
  enabled: boolean;
}

export const InventoryPlugin =
  (pluginConfig: InventoryPluginConfig): Plugin =>
  (incomingConfig: Config) => {
    const config = incomingConfig;
    if (!pluginConfig.enabled) {
      return config;
    }
    config.collections = config.collections ?? [];
    config.collections.push(
      StockLocations,
      InventoryLevels,
      InventoryMovements,
      InventoryReceipts,
      InventoryReceiptLines,
      InventoryLots,
      InventoryCycleCounts,
      InventoryCycleCountLines,
      InventoryReservations,
      InventoryReservationOperatorEvents,
      InventoryReservationEntries
    );

    return config;
  };
