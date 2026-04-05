import { RPage } from "@/components/UX/Transition";
import { AuthView, authViewPaths } from "@betterauth-ui";

export function generateStaticParams() {
  return Object.values(authViewPaths).map((path) => ({ path }));
}
export default async function AuthPage({
  params
}: {
  params: Promise<{ path: string }>;
}) {
  const { path } = await params;

  return (
    <RPage type="auth" slug={[path]}>
      <main className="container flex grow flex-col items-center justify-center self-center p-4 md:p-6">
        <AuthView redirectTo={"/me"} path={path} />
      </main>
    </RPage>
  );
}
