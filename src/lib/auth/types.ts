import {getPayload} from "@/lib/payload";

type PayloadWithBetterAuth = Awaited<ReturnType<typeof getPayload>>
export type BetterPaidBaseSession = PayloadWithBetterAuth["betterAuth"]["$Infer"]["Session"];
export type BetterPaidSession = BetterPaidBaseSession["session"]
export type BetterPaidUser = BetterPaidBaseSession["user"]
export type ActiveOrganization = PayloadWithBetterAuth["betterAuth"]["$Infer"]["ActiveOrganization"]
export type BetterPaidInvitations = PayloadWithBetterAuth["betterAuth"]["$Infer"]["Invitation"]
export type BetterPaidAccount = Awaited<ReturnType<PayloadWithBetterAuth["betterAuth"]["api"]["listUserAccounts"]>>[number]
export type BetterPaidDeviceSession = Awaited<ReturnType<PayloadWithBetterAuth["betterAuth"]["api"]["listSessions"]>>[number]

export type BetterPaidError = PayloadWithBetterAuth["betterAuth"]["$ERROR_CODES"]