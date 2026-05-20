import { Events } from "@/payload/collections/(consumption)/Events";
import { TicketOrders } from "@/payload/collections/(consumption)/TicketOrders";
import { Tickets } from "@/payload/collections/(consumption)/Tickets";
import { Config, Plugin } from "payload";

export interface TicketingPluginConfig {
  enabled: boolean;
}

export const TicketingPlugin =
  (pluginConfig: TicketingPluginConfig): Plugin =>
  (incomingConfig: Config) => {
    const config = incomingConfig;
    if (!pluginConfig.enabled) {
      return config;
    }
    config.collections = config.collections ?? [];
    // TicketOrders must register before Tickets so Tickets.order's
    // relationTo:"ticket-orders" resolves at config-build time.
    config.collections.push(Events, TicketOrders, Tickets);
    return config;
  };
