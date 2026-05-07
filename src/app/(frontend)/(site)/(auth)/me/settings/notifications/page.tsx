import { currentUser } from "@/lib/auth/context/get-context-props";
import {
  Panel,
  PanelControls,
  PanelGrid,
  PanelHeader,
  SectionEmpty
} from "@/components/UX/Settings";
import { Metadata } from "next";
import { redirect } from "next/navigation";
import { RPage } from "@/components/UX/Transition";

export const metadata: Metadata = { title: "Notifications · Settings" };

export default async function NotificationsSettingsPage() {
  const user = await currentUser();
  if (!user) return redirect("/sign-in?next=/me/settings/notifications");

  return (
    <RPage type="account" slug={[]}>
      <div className="flex w-full flex-col gap-6">
        <SectionEmpty
          eyebrow="In preparation"
          title="Notification preferences are coming."
          symbol="◊"
          body="You'll be able to choose what arrives by email — new essays, replies, follows, and editor picks — and tune what surfaces in the in-app inbox. For now everything follows the default."
        />

        <Panel>
          <PanelGrid>
            <PanelHeader
              eyebrow="Defaults"
              title="What gets sent today"
              blurb="Until preferences ship, every member receives the defaults below."
            />
            <PanelControls>
              <div className="flex items-center justify-between gap-4 rounded-lg bg-foreground/[0.025] px-4 py-3 dark:bg-foreground/[0.03]">
                <div className="flex min-w-0 flex-col">
                  <span className="text-sm text-foreground">Email digest</span>
                  <span className="text-xs text-foreground/65 dark:text-foreground/60">
                    One weekly editor's brief, plus replies to your highlights.
                  </span>
                </div>
                <span className="text-xs text-foreground/55">Default</span>
              </div>
              <div className="flex items-center justify-between gap-4 rounded-lg bg-foreground/[0.025] px-4 py-3 dark:bg-foreground/[0.03]">
                <div className="flex min-w-0 flex-col">
                  <span className="text-sm text-foreground">In-app inbox</span>
                  <span className="text-xs text-foreground/65 dark:text-foreground/60">
                    Real-time replies, follows, and series updates.
                  </span>
                </div>
                <span className="text-xs text-foreground/55">Default</span>
              </div>
              <div className="flex items-center justify-between gap-4 rounded-lg bg-foreground/[0.025] px-4 py-3 dark:bg-foreground/[0.03]">
                <div className="flex min-w-0 flex-col">
                  <span className="text-sm text-foreground">Marketing</span>
                  <span className="text-xs text-foreground/65 dark:text-foreground/60">
                    We don't send marketing email.
                  </span>
                </div>
                <span className="text-xs text-foreground/55">Off</span>
              </div>
            </PanelControls>
          </PanelGrid>
        </Panel>
      </div>
    </RPage>
  );
}
