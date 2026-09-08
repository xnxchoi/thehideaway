import { connection } from "next/server";
import { redirect } from "next/navigation";

export const instant = false;

const ACCOUNT_PATH_REDIRECTS: Record<string, string> = {
  settings: "/me/settings",
  security: "/me/settings/security",
  teams: "/me/settings",
  "api-keys": "/me/settings",
  organizations: "/me/settings"
};

export default async function AccountPage({
  params
}: {
  params: Promise<{ path: string }>;
}) {
  await connection();
  const { path } = await params;
  redirect(ACCOUNT_PATH_REDIRECTS[path] ?? "/me/settings");
}
