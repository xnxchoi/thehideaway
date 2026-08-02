import type { authClient as applicationAuthClient } from "@/lib/auth/client";

export type AnyAuthClient = Omit<
  typeof applicationAuthClient,
  "signUp" | "getSession"
>;
