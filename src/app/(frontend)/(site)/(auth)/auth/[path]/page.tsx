import { connection } from "next/server";
import { redirect } from "next/navigation";

export const instant = false;

const AUTH_PATH_REDIRECTS: Record<string, string> = {
  "sign-in": "/sign-in",
  "sign-up": "/sign-up",
  "forgot-password": "/forgot-password",
  "reset-password": "/reset-password",
  "two-factor": "/two-factor"
};

export default async function AuthPage({
  params
}: {
  params: Promise<{ path: string }>;
}) {
  await connection();
  const { path } = await params;
  const target = AUTH_PATH_REDIRECTS[path] ?? "/sign-in";
  redirect(target);
}
