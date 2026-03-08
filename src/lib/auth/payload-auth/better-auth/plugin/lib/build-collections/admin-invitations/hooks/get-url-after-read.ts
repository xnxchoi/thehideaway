import type { FieldHook } from "payload";
import type { GenerateAdminInviteUrlFn } from "@payload-auth/better-auth/plugin/types";

export const getAdminInviteUrlAfterReadHook = ({
  generateAdminInviteUrlFn
}: {
  generateAdminInviteUrlFn: GenerateAdminInviteUrlFn;
}) => {
  const hook: FieldHook = async ({ req, data }) => {
    return generateAdminInviteUrlFn({
      payload: req.payload,
      token: data?.token
    });
  };
  return hook;
};
