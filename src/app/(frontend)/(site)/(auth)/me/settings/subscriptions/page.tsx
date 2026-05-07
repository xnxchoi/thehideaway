import { Link } from "@/components/core/Link/Link";
import { currentUser } from "@/lib/auth/context/get-context-props";
import {
  SectionEmpty,
  SettingsGroup,
  SettingsHeader,
  SettingsRow,
  getSection
} from "@/components/UX/Settings";
import { ArrowUpRight } from "lucide-react";
import { Metadata } from "next";
import { redirect } from "next/navigation";
import { RPage } from "@/components/UX/Transition";

export const metadata: Metadata = { title: "Subscriptions · Settings" };

const section = getSection("subscriptions");

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
    <RPage slug={[]} type="account">
      <div className="flex w-full flex-col gap-6">
        <SettingsHeader section={section} />

        <SettingsGroup
          title="Current tier"
          description="Your access level today."
        >
          <SettingsRow
            label="Tier"
            meta={
              <span className="text-foreground/85 uppercase">
                {ROLE_LABEL[role] ?? role}
              </span>
            }
          >
            <span className="text-foreground/75">
              {role === "user"
                ? "Open access to public essays and the radio archive."
                : "Includes patron-tier privileges across the site."}
            </span>
          </SettingsRow>
        </SettingsGroup>

        <SectionEmpty
          eyebrow="In preparation"
          title="Self-service membership is coming."
          symbol="✦"
          body="You'll be able to subscribe, change your tier, and download invoices from this page. Until then, our concierge handles changes manually."
          action={
            <Link
              href="/plans"
              className="inline-flex items-center gap-2 border border-border/40 px-5 py-2.5 font-mono text-[11px] tracking-[0.18em] text-foreground/80 uppercase transition-colors hover:border-border hover:text-foreground"
            >
              See membership plans
              <ArrowUpRight size={12} />
            </Link>
          }
        />

        <SettingsGroup
          title="Billing"
          description="Invoices and payment method."
        >
          <SettingsRow
            label="Invoices"
            meta={
              <span className="text-foreground/60 dark:text-foreground/55">
                Coming soon
              </span>
            }
          >
            <span className="text-foreground/70">
              Past invoices will appear here as PDFs.
            </span>
          </SettingsRow>
          <SettingsRow
            label="Payment method"
            meta={
              <span className="text-foreground/60 dark:text-foreground/55">
                Coming soon
              </span>
            }
          >
            <span className="text-foreground/70">
              Add or update card on file.
            </span>
          </SettingsRow>
        </SettingsGroup>
      </div>
    </RPage>
  );
}
