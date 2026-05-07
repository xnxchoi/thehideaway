import { Link } from "@/components/core/Link/Link";
import { currentUser } from "@/lib/auth/context/get-context-props";
import {
  ActionButton,
  Panel,
  PanelControls,
  PanelGrid,
  PanelHeader,
  SectionEmpty
} from "@/components/UX/Settings";
import { ArrowUpRight } from "lucide-react";
import { Metadata } from "next";
import { redirect } from "next/navigation";
import { RPage } from "@/components/UX/Transition";

export const metadata: Metadata = { title: "Subscriptions · Settings" };

const ROLE_LABEL: Record<string, string> = {
  user: "Standard",
  patron: "Patron",
  author: "Author",
  editor: "Editor",
  admin: "Steward"
};

export default async function SubscriptionsSettingsPage() {
  const user = await currentUser();
  if (!user) return redirect("/sign-in?next=/me/settings/subscriptions");

  const role = (user as { role?: string }).role ?? "user";

  return (
    <RPage type="account" slug={[]}>
      <div className="flex w-full flex-col gap-6">
        <Panel>
          <PanelGrid>
            <PanelHeader
              eyebrow="Tier"
              title="Your access today"
              blurb={
                role === "user"
                  ? "Open access to public essays and the radio archive."
                  : "Includes patron-tier privileges across the site."
              }
              meta={
                <span className="text-foreground/85">
                  {ROLE_LABEL[role] ?? role}
                </span>
              }
            />
            <PanelControls>
              <div className="flex items-center justify-between gap-4 rounded-lg bg-foreground/[0.025] px-4 py-3 dark:bg-foreground/[0.03]">
                <div className="flex min-w-0 flex-col">
                  <span className="text-sm text-foreground">Current tier</span>
                  <span className="text-xs text-foreground/65 dark:text-foreground/60">
                    {role === "user"
                      ? "Open membership."
                      : "Includes patron benefits."}
                  </span>
                </div>
                <span className="text-xs text-foreground/85">
                  {ROLE_LABEL[role] ?? role}
                </span>
              </div>
            </PanelControls>
          </PanelGrid>
        </Panel>

        <SectionEmpty
          eyebrow="In preparation"
          title="Self-service membership is coming."
          symbol="✦"
          body="You'll be able to subscribe, change your tier, and download invoices from this page. Until then, our concierge handles changes manually."
          action={
            <Link href="/plans">
              <ActionButton icon={<ArrowUpRight size={12} />}>
                See membership plans
              </ActionButton>
            </Link>
          }
        />

        <Panel>
          <PanelGrid>
            <PanelHeader
              eyebrow="Billing"
              title="Invoices and payment method"
              blurb="Self-service billing tools land in a later release."
            />
            <PanelControls>
              <div className="flex items-center justify-between gap-4 rounded-lg bg-foreground/[0.025] px-4 py-3 dark:bg-foreground/[0.03]">
                <div className="flex min-w-0 flex-col">
                  <span className="text-sm text-foreground">Invoices</span>
                  <span className="text-xs text-foreground/65 dark:text-foreground/60">
                    Past invoices will appear here as PDFs.
                  </span>
                </div>
                <span className="text-xs text-foreground/55">Coming soon</span>
              </div>
              <div className="flex items-center justify-between gap-4 rounded-lg bg-foreground/[0.025] px-4 py-3 dark:bg-foreground/[0.03]">
                <div className="flex min-w-0 flex-col">
                  <span className="text-sm text-foreground">Payment method</span>
                  <span className="text-xs text-foreground/65 dark:text-foreground/60">
                    Add or update card on file.
                  </span>
                </div>
                <span className="text-xs text-foreground/55">Coming soon</span>
              </div>
            </PanelControls>
          </PanelGrid>
        </Panel>
      </div>
    </RPage>
  );
}
