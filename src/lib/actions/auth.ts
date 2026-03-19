import { getPayload } from "@/lib/payload";
import type { RP_Roles } from "@/stores/Notification/NotificationStore";
import { headers } from "next/headers";

export const getSession = async () => {
  const payload = await getPayload();
  type Infer = (typeof payload.betterAuth.$Infer)["Session"];
  const session = (await payload.betterAuth.api.getSession({
    headers: await headers()
  })) as Infer;
  return session;
};

const createUser = async () => {
  const payload = await getPayload();
  const user = await payload.create({
    collection: "users",
    draft: false,
    data: {
      email: "test@example.com",
      emailVerified: true,
      name: "Test User",
      twoFactorEnabled: false,
      banned: false,
      onboarded: false,
      verified: false,
      firstName: "Test",
      lastName: "User",
      username: "testuser",
      slug: "test-user",
      role: ["user"] as unknown as RP_Roles
    }
  });
};
