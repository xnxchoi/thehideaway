"use client";

import {
  EditableField,
  EditableLink,
  EditableLocation,
  Panel,
  PanelBento,
  PanelControls,
  PanelGrid,
  PanelHeader,
  SubRouteHeader
} from "@/components/UX/Settings";
import type { User } from "@/payload-types";
import { searchPlaces } from "../_helpers/searchPlaces";
import { updateUserField } from "../_helpers/updateProfile";
import { RPage } from "@/components/UX/Transition";

interface ProfileSectionClientProps {
  user: User;
}

export default function ProfileSectionClient({
  user
}: ProfileSectionClientProps) {
  return (
    <RPage type="account" slug={[]}>
      <div className="flex w-full flex-col gap-8">
        <SubRouteHeader
          title="Profile"
          blurb="Your public face — name, bio, location, and link. Changes appear immediately on your profile and across bylines."
        />

        <PanelBento>
          <Panel>
            <PanelGrid>
              <PanelHeader eyebrow="Identity" />
              <PanelControls>
                <EditableField
                  label="First name"
                  value={user.firstName ?? ""}
                  emptyHint="First name"
                  maxLength={48}
                  onSave={(v) => updateUserField("firstName", v)}
                />
                <EditableField
                  label="Last name"
                  value={user.lastName ?? ""}
                  emptyHint="Last name"
                  maxLength={48}
                  onSave={(v) => updateUserField("lastName", v)}
                />
                <EditableField
                  label="Bio"
                  description="240 characters."
                  align="stack"
                  multiline
                  rows={3}
                  value={user.bio ?? ""}
                  emptyHint="A member of The Hideaway."
                  maxLength={240}
                  onSave={(v) => updateUserField("bio", v)}
                />
              </PanelControls>
            </PanelGrid>
          </Panel>

          <Panel>
            <PanelGrid>
              <PanelHeader eyebrow="Locator" />
              <PanelControls>
                {/* Location uses the autocomplete-aware primitive. The
                  searchPlaces helper hits our /api/places/search proxy,
                  which holds the Mapbox secret token and filters to
                  city-grade results only. */}
                <EditableLocation
                  label="Location"
                  value={user.location ?? ""}
                  emptyHint="Seoul"
                  searchPlaces={searchPlaces}
                  onSave={(v) => updateUserField("location", v)}
                />
                <EditableLink
                  label="Link"
                  value={user.link ?? ""}
                  emptyHint="https://"
                  onSave={(v) => updateUserField("link", v)}
                />
              </PanelControls>
            </PanelGrid>
          </Panel>
        </PanelBento>
      </div>
    </RPage>
  );
}
