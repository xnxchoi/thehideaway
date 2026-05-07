import { currentUser } from "@/lib/auth/context/get-context-props";
import {
  SectionEmpty,
  SettingsGroup,
  SettingsHeader,
  SettingsRow,
  getSection
} from "@/components/UX/Settings";
import { Metadata } from "next";
import { redirect } from "next/navigation";
import { RPage } from "@/components/UX/Transition";

export const metadata: Metadata = { title: "Notifications · Settings" };

const section = getSection("notifications");

export default async function NotificationsSettingsPage() {
  const user = await currentUser();
  if (!user) return redirect("/sign-in?next=/me/settings/notifications");

  return (
    <RPage slug={[]} type="account">
      <div className="flex w-full flex-col gap-6">
        <SettingsHeader section={section} />

        <SectionEmpty
          eyebrow="In preparation"
          title="Notification preferences are coming."
          symbol="◊"
          body="You'll be able to choose what arrives by email — new essays, replies, follows, and editor picks — and tune what surfaces in the in-app inbox. For now everything follows the default."
        />

        <SettingsGroup
          title="Today's defaults"
          description="What gets sent until you have control."
        >
          <SettingsRow
            label="Email digest"
            meta={
              <span className="text-foreground/60 dark:text-foreground/55">
                Default
              </span>
            }
          >
            <span className="text-foreground/75">
              One weekly editor's brief, plus replies to your highlights.
            </span>
          </SettingsRow>
          <SettingsRow
            label="In-app"
            meta={
              <span className="text-foreground/60 dark:text-foreground/55">
                Default
              </span>
            }
          >
            <span className="text-foreground/75">
              Real-time replies, follows, and series updates via the inbox.
            </span>
          </SettingsRow>
          <SettingsRow
            label="Marketing"
            meta={
              <span className="text-foreground/60 dark:text-foreground/55">
                Off
              </span>
            }
          >
            <span className="text-foreground/75">
              We don't send marketing email.
            </span>
          </SettingsRow>
        </SettingsGroup>
      </div>
    </RPage>
  );
}
