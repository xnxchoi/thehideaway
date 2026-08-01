import Plans from "@/payload/collections/(consumption)/Plans";
import { Prices } from "@/payload/collections/(consumption)/Prices";
import { Subscriptions } from "@/payload/collections/(consumption)/Subscriptions";
import { Config, Plugin } from "payload";
import { Invoices } from "@/payload/collections/(consumption)/Invoices";
import { Currency, FXRate } from "@/payload/collections/(consumption)/FXRate";
import { Holidays } from "@/payload/collections/Holidays";
import {
  ProductCategory,
  ProductSubCategory
} from "@/payload/collections/(consumption)/ProductCategory";
import { Products } from "@/payload/collections/(consumption)/Products";
import { ProductVariants } from "@/payload/collections/(consumption)/ProductVariants";
import { ProductDrops } from "@/payload/collections/(consumption)/ProductDrops";
import { ProductCarts } from "@/payload/collections/(consumption)/ProductCarts";
import { ProductOrders } from "@/payload/collections/(consumption)/ProductOrders";
import { ProductPayments } from "@/payload/collections/(consumption)/ProductPayments";
import { ProductOrderCampaigns } from "@/payload/collections/(consumption)/ProductOrderCampaigns";
import { CommerceProviderEvents } from "@/payload/collections/(consumption)/CommerceProviderEvents";
import { CommerceCommands } from "@/payload/collections/(consumption)/CommerceCommands";
import { StockLocations } from "@/payload/collections/(consumption)/StockLocations";
import { InventoryLevels } from "@/payload/collections/(consumption)/InventoryLevels";
import { InventoryMovements } from "@/payload/collections/(consumption)/InventoryMovements";
import { InventoryReceipts } from "@/payload/collections/(consumption)/InventoryReceipts";
import { InventoryReceiptLines } from "@/payload/collections/(consumption)/InventoryReceiptLines";
import { InventoryLots } from "@/payload/collections/(consumption)/InventoryLots";
import { InventoryCycleCounts } from "@/payload/collections/(consumption)/InventoryCycleCounts";
import { InventoryCycleCountLines } from "@/payload/collections/(consumption)/InventoryCycleCountLines";
import { InventoryReservationEntries } from "@/payload/collections/(consumption)/InventoryReservationEntries";
import { InventoryReservations } from "@/payload/collections/(consumption)/InventoryReservations";
import { InventoryReservationOperatorEvents } from "@/payload/collections/(consumption)/InventoryReservationOperatorEvents";

export interface MembershipPluginConfig {
  enabled: boolean;
}

export const MembershipPlugin =
  (pluginConfig: MembershipPluginConfig): Plugin =>
  (incomingConfig: Config) => {
    const config = incomingConfig;
    if (!pluginConfig.enabled) {
      return config;
    }
    config.collections = config.collections ?? [];
    config.collections.push(
      Plans,
      Invoices,
      Prices,
      Subscriptions,
      FXRate,
      Currency,
      Holidays,
      ProductCategory,
      ProductSubCategory,
      ProductDrops,
      Products,
      ProductVariants,
      ProductOrderCampaigns,
      ProductCarts,
      ProductOrders,
      ProductPayments,
      CommerceCommands,
      CommerceProviderEvents,
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
