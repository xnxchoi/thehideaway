import { Events } from "@/payload/collections/(consumption)/Events";
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
    config.collections.push(Events, Tickets);
    return config;
  };
