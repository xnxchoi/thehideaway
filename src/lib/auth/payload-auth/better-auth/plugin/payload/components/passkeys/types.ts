import type { UIFieldServerProps } from "payload";
import type {
  PayloadAuthOptions,
  BuiltBetterAuthSchema
} from "@payload-auth/better-auth/types";
import type { Passkey } from "@payload-auth/better-auth/generated-types";

export type PasskeyWithId = Passkey & { id: string; createdAt: Date };

export type PasskeysServerComponentProps = UIFieldServerProps & {
  schema: BuiltBetterAuthSchema;
  passkeySlug: string;
  passkeyUserIdFieldName: string;
  pluginOptions: PayloadAuthOptions;
};

export type PasskeysClientComponentProps = {
  initialPasskeys: PasskeyWithId[];
  documentId: string | number;
  currentUserId: string | number;
  passkeySlug: string;
  passkeyUserIdFieldName: string;
  baseURL?: string;
  basePath?: string;
};
