"use server";
import {auth} from "@/lib/auth";
import {getHeaders} from "@better-fetch/fetch";

export const getUserServer = async (_timestamp?: number) => {
	const sess = await auth.api.getSession({headers: await getHeaders()});
	return sess ? sess.user : null;
};
