import { authViewPaths } from "@/lib/auth/betterauth-ui/src/lib/view-paths";
import { AuthView } from "./view";
export const dynamicParams = false;
export function generateStaticParams() {
  return Object.values(authViewPaths).map((pathname) => ({ pathname }));
}

export default async function AuthPage({
  params
}: {
  params: Promise<{ pathname: string }>;
}) {
  const { pathname } = await params;
  return <AuthView pathname={pathname} />;
}
