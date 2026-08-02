import type { authClient as applicationAuthClient } from "@/lib/auth/client";
import type { apiKeyClient } from "@better-auth/api-key/client";
import type { ReactAuthClient } from "better-auth/react";

type ApiKeyAuthClient = ReactAuthClient<{
  plugins: [ReturnType<typeof apiKeyClient>];
}>;

export type AuthClient = typeof applicationAuthClient &
  Partial<Pick<ApiKeyAuthClient, "apiKey">> & {
    oneTap?: (options: Record<string, unknown>) => Promise<unknown>;
  };

export type Session = AuthClient["$Infer"]["Session"]["session"];
export type User = AuthClient["$Infer"]["Session"]["user"];
