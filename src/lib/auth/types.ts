import {getPayload} from "@/lib/payload";
import type {RP_Roles} from "@/stores/Notification/NotificationStore";

type PayloadWithBetterAuth = Awaited<ReturnType<typeof getPayload>>;
type BaseSession = PayloadWithBetterAuth["betterAuth"]["$Infer"]["Session"];
export type Session = {
	user: {
		role: RP_Roles;
		id: string;
		email: string;
		name: string;
		firstName: string;
		lastName: string;
		username: string;
		onboarded: boolean | null;
		portrait: string | null;
		location?: string | null;
		bio?: string | null | undefined;
		link?: string | null;
		slug: string;
		banned: boolean | null;
		meta?: Record<string, any>;
	};
	session: BaseSession["session"];
};

export type ActiveOrganization =
	PayloadWithBetterAuth["betterAuth"]["$Infer"]["ActiveOrganization"];
export type Invitation =
	PayloadWithBetterAuth["betterAuth"]["$Infer"]["Invitation"];
export type Account = Awaited<
	ReturnType<PayloadWithBetterAuth["betterAuth"]["api"]["listUserAccounts"]>
>[number];
export type DeviceSession = Awaited<
	ReturnType<PayloadWithBetterAuth["betterAuth"]["api"]["listSessions"]>
>[number];
