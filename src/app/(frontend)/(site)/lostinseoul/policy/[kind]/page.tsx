import { PolicyContent } from "@lostinseoul/components/policyContent";
import { redirect } from "next/navigation";
import { Metadata } from "next";

export default async function Page(args: {
  params: Promise<{ kind: string }>;
}) {
  const { kind } = await args.params;
  switch (kind) {
    case "privacy":
      return <PolicyContent kind={"privacy"} />;
    case "refund":
      return <PolicyContent kind={"refund"} />;
    case "terms":
      return <PolicyContent kind={"terms"} />;
    default:
      redirect("/lostinseoul/policy/terms");
  }
}
export async function generateMetadata(args: {
  params: Promise<{ kind: string }>;
}): Promise<Metadata> {
  const { kind = "terms" } = await args.params;
  switch (kind) {
    case "privacy":
    case "refund":
    case "terms":
      return {
        title: `LOSTINSEOUL POLICY | ${kind.toUpperCase()}`,
        description: `LOSTINSEOUL Policy: ${kind.slice(0, 1).toUpperCase()}${kind.slice(1)}`
      };
    default:
      return { title: `LOSTINSEOUL POLICY`, description: "Policies" };
  }
}
