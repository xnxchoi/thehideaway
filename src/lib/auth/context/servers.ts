import type {Account, DeviceSession, Session} from "@/lib/auth/types";
import {getPayload} from "@/lib/payload";
import {headers as requestHeaders} from "next/headers";

export const getSession = async () => {
	const payload = await getPayload();
	const headers = await requestHeaders();
	const session = await payload.betterAuth.api.getSession({headers});
	return session as Session | null;
};

export const getUserAccounts = async (): Promise<Account[]> => {
	const payload = await getPayload();
	const headers = await requestHeaders();
	const accounts = await payload.betterAuth.api.listUserAccounts({headers});
	return accounts;
};

export const getDeviceSessions = async (): Promise<DeviceSession[]> => {
	const payload = await getPayload();
	const headers = await requestHeaders();
	const sessions = await payload.betterAuth.api.listSessions({headers});
	return sessions;
};

export const currentUser = async () => {
	const payload = await getPayload();
	const headers = await requestHeaders();
	const {user} = await payload.auth({headers});
	console.log("serverProps currentUser", user);
	return user;
};
