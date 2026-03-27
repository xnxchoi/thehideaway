import { NuqsAdapter } from "nuqs/adapters/next/app";

export default function AccountLayout({
  children
}: {
  children: React.ReactNode;
}) {
  return <NuqsAdapter>{children}</NuqsAdapter>;
}
