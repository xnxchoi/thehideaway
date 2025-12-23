import { PayloadSDK } from "@payloadcms/sdk";
import type { Config, UserAuthOperations } from "@/payload-types";
import type { ForgotPasswordOptions } from "node_modules/@payloadcms/sdk/dist/auth/forgotPassword";
import type {PayloadGeneratedTypes} from "node_modules/@payloadcms/sdk/dist/types";
type EstateGeneratedTypes = PayloadGeneratedTypes & {
  auth: {
    [key: string]:
      | UserAuthOperations
      | PayloadGeneratedTypes["auth"][keyof PayloadGeneratedTypes["auth"]];
  };
};
class EstateSDK<T extends EstateGeneratedTypes> extends PayloadSDK<T> {
  override forgotPassword<TSlug extends string>(
    options: ForgotPasswordOptions<PayloadGeneratedTypes, TSlug>,
    init?: RequestInit
  ): Promise<{ message: string }> {
    return fetch(`${process.env.NEXT_PUBLIC_SERVER_URL}/auth/forgot-password`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(options)
    }).then((r) => {
      if (!r.ok) {
        return {
          message: "Nah"
        };
      }
      return r.json().then((t) => {
        return {
          message: t.message
        };
      });
    });
  }
}
const sdk = new EstateSDK<Config>({
  baseURL: `${process.env.NEXT_PUBLIC_SERVER_URL}/api`
});

export default sdk;
