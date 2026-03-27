import { accountViewPaths } from "@betterauth-ui/lib/view-paths";
import { AccountView } from "@betterauth-ui/components/account/account-view";
export const dynamicParams = false;
export function generateStaticParams() {
  return Object.values(accountViewPaths).map((path) => ({ path }));
}
export default async function AccountPage({
  params
}: {
  params: Promise<{ path: string }>;
}) {
  const { path } = await params;
  return (
    <main className="container p-4 md:p-6">
      <AccountView path={path} />
    </main>
  );
}
