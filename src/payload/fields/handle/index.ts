import { User } from "@/payload-types";
import { formatUserHandleHook } from "@/payload/fields/handle/formatUserHandle";
import { nanoid } from "nanoid";
import { FieldAccessArgs } from "node_modules/payload/dist/fields/config/types";
import type { TextField } from "payload";

export class HandleError extends Error {
  public data?: { alts?: string[] };
  constructor(message: string, data?: { alts?: string[] }) {
    super(message);
    this.name = "HandleError";
    this.data = data;
    Object.setPrototypeOf(this, HandleError.prototype);
  }
}
type Overrides = {
  userHandleOverrides?: Partial<TextField>;
};

// type UserHandle = (overrides?: Overrides) => [TextField, TextField];
type UserHandle = (overrides?: Overrides) => [TextField];

export const userHandleField: UserHandle = (overrides = {}) => {
  const { userHandleOverrides } = overrides;

  // Expect ts error here because of typescript mismatching Partial<TextField> with TextField
  // @ts-expect-error
  const userHandleField: TextField = {
    name: "slug",
    unique: true,
    required: true,
    type: "text",
    index: true,
    access: {
      update: ({ data, req, id, doc }: FieldAccessArgs<User>) => {
        const docId = id || doc?.id || data?.id;
        if (req.context.overrideAccess === true) return true;
        if (!docId || !req.user) return false;
        if (req.user.role === "admin") return true;
        if (req.user.id === docId) return true;
        return false;
      }
    },

    saveToJWT: true,
    ...(userHandleOverrides || {}),
    hooks: {
      // Kept this in for hook or API based updates
      beforeValidate: [formatUserHandleHook]
    },

    admin: {
      ...(userHandleOverrides?.admin || {}),
      components: {
        Field: {
          path: "@/payload/fields/handle/ServerHandle.tsx",
          serverProps: {
            fieldToUse: "username"
          }
        }
      }
    }
  };
  const hashId: TextField = {
    type: "text",
    name: "hashId",
    defaultValue: () => nanoid(11),
    access: {
      update: () => false
    },
    required: true,
    label: "Your ID",
    admin: {
      readOnly: true
    }
  };
  return [userHandleField];
};
