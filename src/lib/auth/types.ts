import { getPayload } from "@/lib/payload";

type PayloadWithBetterAuth = Awaited<ReturnType<typeof getPayload>>;
type InferredBetterAuthSession =
  PayloadWithBetterAuth["betterAuth"]["$Infer"]["Session"];

// The admin plugin's custom-role inference models `role` as its permission
// object union, while this application persists and returns one role slug.
// Keep the shared server-session contract aligned with the actual schema.
export type BetterPaidBaseSession = Omit<InferredBetterAuthSession, "user"> & {
  user: Omit<InferredBetterAuthSession["user"], "role"> & { role: string };
};
export type BetterPaidSession = BetterPaidBaseSession["session"];
export type BetterPaidUser = BetterPaidBaseSession["user"];
export type ActiveOrganization =
  PayloadWithBetterAuth["betterAuth"]["$Infer"]["ActiveOrganization"];
export type BetterPaidInvitations =
  PayloadWithBetterAuth["betterAuth"]["$Infer"]["Invitation"];
export type BetterPaidAccount = Awaited<
  ReturnType<PayloadWithBetterAuth["betterAuth"]["api"]["listUserAccounts"]>
>[number];
export type BetterPaidDeviceSession = Awaited<
  ReturnType<PayloadWithBetterAuth["betterAuth"]["api"]["listSessions"]>
>[number];

export type BetterPaidError =
  PayloadWithBetterAuth["betterAuth"]["$ERROR_CODES"];
