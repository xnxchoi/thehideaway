import type {BetterPaidAccount, BetterPaidDeviceSession} from "@/lib/auth/types"
import {getPayload} from "@/lib/payload"
import {headers as requestHeaders} from "next/headers"

export const getSession = async () => {
	try {
		const payload = await getPayload()
		const headers = await requestHeaders()
		return await payload.betterAuth.api.getSession({headers})
	} catch {
		return null
	}
}

export const getUserAccounts = async (): Promise<BetterPaidAccount[] | null> => {
	try {
		const payload = await getPayload()
		const headers = await requestHeaders()
		const accounts = await payload.betterAuth.api.listUserAccounts({headers})
		return accounts
	} catch {
		return null
	}
}

export const getDeviceSessions = async (): Promise<BetterPaidDeviceSession[] | null> => {
	try {
		const payload = await getPayload()
		const headers = await requestHeaders()
		const sessions = await payload.betterAuth.api.listSessions({headers})
		return sessions
	} catch {
		return null
	}
}

export const currentUser = async () => {
	try {
		const payload = await getPayload()
		const headers = await requestHeaders()
		const {user} = await payload.auth({headers})
		return user
	} catch {
		return null
	}
}

export const getContextProps = () => {
	const sessionPromise = getSession()
	const userAccountsPromise = getUserAccounts()
	const deviceSessionsPromise = getDeviceSessions()
	const currentUserPromise = currentUser()
	return {sessionPromise, userAccountsPromise, deviceSessionsPromise, currentUserPromise}
}
