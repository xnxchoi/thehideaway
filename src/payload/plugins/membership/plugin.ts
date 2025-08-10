import Plans from "@/payload/collections/(consumption)/Plans";
import {Prices} from "@/payload/collections/(consumption)/Prices";
import {
	Subscriptions,
	SubscriptionSchedule,
} from "@/payload/collections/(consumption)/Subscriptions";
import {Config, Plugin} from "payload";
import {Invoices} from "@/payload/collections/(consumption)/Invoices";
import {Currency, FXRate} from "@/payload/collections/(consumption)/FXRate";
import {Holidays} from "@collections/Holidays";

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
				SubscriptionSchedule,
			);

			return config;
		};
