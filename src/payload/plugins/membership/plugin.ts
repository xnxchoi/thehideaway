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
import { ProductDrops } from "@/payload/collections/(consumption)/ProductDrops";
import { ProductCarts } from "@/payload/collections/(consumption)/ProductCarts";
import { ProductOrders } from "@/payload/collections/(consumption)/ProductOrders";
import { ProductPayments } from "@/payload/collections/(consumption)/ProductPayments";
import { ProductOrderCampaigns } from "@/payload/collections/(consumption)/ProductOrderCampaigns";

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
      ProductOrderCampaigns,
      ProductCarts,
      ProductOrders,
      ProductPayments
    );

    return config;
  };
