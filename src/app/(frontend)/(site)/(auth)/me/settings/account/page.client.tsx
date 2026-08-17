"use client";

import { ArrowUpRight, Lock, Mail } from "lucide-react";
import { useState } from "react";

import { Link } from "@/components/core/Link/Link";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogRoot,
  DialogTitle,
  DialogTrigger
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { PasswordInput } from "@/components/ui/password-input";
import { errorToast, successToast } from "@/components/ui/sonner";
import {
  ActionButton,
  ActionField,
  LockedField,
  Panel,
  PanelBento,
  PanelControls,
  PanelGrid,
  PanelHeader,
  SubRouteHeader
} from "@/components/UX/Settings";
import { authClient } from "@/lib/auth/client";
import type { User } from "@payload-types";
import { RPage } from "@/components/UX/Transition";

interface AccountSectionClientProps {
  user: User;
}

const ROLE_LABEL: Record<string, string> = {
  user: "Standard",
  member: "Member",
  patron: "Patron",
  author: "Author",
  editor: "Editor",
  admin: "Steward"
};

/**
 * Account — administrative surface.
 *
 * Holds the fields that are either administratively impactful (handle =
 * your URL, mention target) or contractually-bound (sign-in email,
 * password, billing address, subscription tier). Identity-display fields
 * live in Profile; protections around the credential live in Security;
 * interface preferences live in General.
 *
 * The address field is a structural placeholder until the Payload schema
 * adds a `streetAddress` / `addressLines` block to Users — kept in the
 * panel so the layout reads correctly today.
 */
export default function AccountSectionClient({
  user
}: AccountSectionClientProps) {
  const role = (user.role ?? "user") as keyof typeof ROLE_LABEL;

  return (
    <RPage type="account" slug={[]}>
      <div className="flex w-full flex-col gap-8">
        <SubRouteHeader title="Account" />

        <PanelBento>
          {/* Identity (administrative) — handle is administratively
            impactful and lives here, not on Profile. */}
          <Panel>
            <PanelGrid>
              <PanelHeader eyebrow="Handle" />
              <PanelControls>
                <LockedField
                  label="Handle"
                  description="@-prefixed identifier used in URLs and mentions. Renaming is in preparation."
                  value={`@${user.slug ?? "—"}`}
                  reason="Renaming the handle is in preparation."
                />
              </PanelControls>
            </PanelGrid>
          </Panel>

          {/* Sign-in email */}
          <Panel>
            <PanelGrid>
              <PanelHeader
                eyebrow="Sign-in email"
                meta={
                  user.emailVerified ? (
                    <span className="text-foreground/75">Verified</span>
                  ) : (
                    <span className="text-rouge-500/85">Unverified</span>
                  )
                }
              />
              <PanelControls>
                <LockedField
                  label="Email"
                  value={user.email}
                  reason="Editing your sign-in email is in preparation."
                />
                {!user.emailVerified ? (
                  <ResendVerificationField email={user.email} />
                ) : null}
              </PanelControls>
            </PanelGrid>
          </Panel>

          {/* Password */}
          <Panel>
            <PanelGrid>
              <PanelHeader eyebrow="Password" />
              <PanelControls>
                <ChangePasswordField />
              </PanelControls>
            </PanelGrid>
          </Panel>

          {/* Address — placeholder until the Payload schema lands the
            structured address block. */}
          <Panel>
            <PanelGrid>
              <PanelHeader eyebrow="Address" />
              <PanelControls>
                <LockedField
                  label="Address"
                  value={<span className="text-foreground/55">Not set</span>}
                  reason="Address editing is in preparation."
                />
              </PanelControls>
            </PanelGrid>
          </Panel>

          {/* Subscriptions — folded in from the retired /subscriptions
            route. Self-service tools land in a later release; this panel
            shows the current tier and links out to the public plans
            page. */}
          <Panel>
            <PanelGrid>
              <PanelHeader
                eyebrow="Subscriptions"
                meta={
                  <span className="text-foreground/85">{ROLE_LABEL[role]}</span>
                }
              />
              <PanelControls>
                <div className="flex items-center justify-between gap-4 rounded-lg bg-foreground/[0.025] px-4 py-3 dark:bg-foreground/[0.03]">
                  <div className="flex min-w-0 flex-col">
                    <span className="text-sm text-foreground">
                      Current tier
                    </span>
                    <span className="text-xs text-foreground/65 dark:text-foreground/60">
                      {role === "user"
                        ? "Open membership."
                        : "Includes patron-tier privileges."}
                    </span>
                  </div>
                  <span className="text-xs text-foreground/85">
                    {ROLE_LABEL[role]}
                  </span>
                </div>
                <div className="flex items-center justify-between gap-4 rounded-lg bg-foreground/[0.025] px-4 py-3 dark:bg-foreground/[0.03]">
                  <div className="flex min-w-0 flex-col">
                    <span className="text-sm text-foreground">Invoices</span>
                    <span className="text-xs text-foreground/65 dark:text-foreground/60">
                      Past invoices will appear here as PDFs.
                    </span>
                  </div>
                  <span className="text-xs text-foreground/55">
                    Coming soon
                  </span>
                </div>
                <div className="flex items-center justify-between gap-4 rounded-lg bg-foreground/[0.025] px-4 py-3 dark:bg-foreground/[0.03]">
                  <div className="flex min-w-0 flex-col">
                    <span className="text-sm text-foreground">
                      Payment method
                    </span>
                    <span className="text-xs text-foreground/65 dark:text-foreground/60">
                      Add or update card on file.
                    </span>
                  </div>
                  <span className="text-xs text-foreground/55">
                    Coming soon
                  </span>
                </div>
                <ActionField
                  label="See membership plans"
                  description="Browse available tiers on the public plans page."
                >
                  <Link href="/plans">
                    <ActionButton icon={<ArrowUpRight size={12} />}>
                      Plans
                    </ActionButton>
                  </Link>
                </ActionField>
              </PanelControls>
            </PanelGrid>
          </Panel>
        </PanelBento>
      </div>
    </RPage>
  );
}

function ResendVerificationField({ email }: { email: string }) {
  const [pending, setPending] = useState(false);

  const onClick = async () => {
    setPending(true);
    try {
      await authClient.sendVerificationEmail(
        { email },
        {
          onError(ctx) {
            errorToast(ctx.error.message ?? "Couldn't send verification");
          },
          onSuccess() {
            successToast("Verification email sent");
          }
        }
      );
    } catch (e) {
      errorToast(e instanceof Error ? e.message : "Couldn't send verification");
    } finally {
      setPending(false);
    }
  };

  return (
    <ActionField
      label="Resend verification"
      description="Send the verification message to this email again."
    >
      <ActionButton
        onClick={onClick}
        loading={pending}
        icon={<Mail size={12} />}
      >
        Resend
      </ActionButton>
    </ActionField>
  );
}

function ChangePasswordField() {
  const [open, setOpen] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [signOutOthers, setSignOutOthers] = useState(false);
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    if (newPassword !== confirmPassword) {
      errorToast("Passwords do not match");
      return;
    }
    if (newPassword.length < 8) {
      errorToast("Password must be at least 8 characters");
      return;
    }
    setLoading(true);
    try {
      const res = await authClient.changePassword({
        newPassword,
        currentPassword,
        revokeOtherSessions: signOutOthers
      });
      if (res?.error) {
        errorToast(res.error.message ?? "Couldn't change password");
        return;
      }
      successToast("Password changed");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setOpen(false);
    } catch (e) {
      errorToast(e instanceof Error ? e.message : "Couldn't change password");
    } finally {
      setLoading(false);
    }
  };

  return (
    <ActionField
      label="Password"
      description="Update the password used for email sign-in."
    >
      <DialogRoot open={open} onOpenChange={setOpen}>
        <DialogTrigger
          nativeButton={true}
          render={() => (
            <ActionButton icon={<Lock size={12} />}>
              Change password
            </ActionButton>
          )}
        />
        <DialogContent className="w-11/12 rounded-2xl sm:max-w-[440px]">
          <DialogHeader>
            <p className="text-xs text-foreground/55">Account</p>
            <DialogTitle className="mt-1 text-2xl font-light tracking-tight">
              Change password
            </DialogTitle>
            <DialogDescription className="mt-1 text-sm font-light text-foreground/65">
              Update the password you use to sign in.
            </DialogDescription>
          </DialogHeader>
          <div className="mt-4 flex flex-col gap-6">
            <FieldRowDialog
              id="current-password"
              label="Current password"
              value={currentPassword}
              setValue={setCurrentPassword}
            />
            <FieldRowDialog
              id="new-password"
              label="New password"
              value={newPassword}
              setValue={setNewPassword}
            />
            <FieldRowDialog
              id="confirm-password"
              label="Confirm new password"
              value={confirmPassword}
              setValue={setConfirmPassword}
            />
            <label className="flex cursor-pointer items-center gap-3 pt-1">
              <Checkbox
                checked={signOutOthers}
                onCheckedChange={(c) => setSignOutOthers(Boolean(c))}
              />
              <span className="text-sm text-foreground/75">
                Sign out from other devices
              </span>
            </label>
          </div>
          <DialogFooter className="mt-6">
            <ActionButton
              onClick={submit}
              loading={loading}
              icon={<Lock size={12} />}
            >
              Change password
            </ActionButton>
          </DialogFooter>
        </DialogContent>
      </DialogRoot>
    </ActionField>
  );
}

function FieldRowDialog({
  id,
  label,
  value,
  setValue
}: {
  id: string;
  label: string;
  value: string;
  setValue: (v: string) => void;
}) {
  return (
    <div className="flex flex-col gap-2">
      <Label htmlFor={id} className="text-xs text-foreground/65">
        {label}
      </Label>
      <PasswordInput
        id={id}
        value={value}
        onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
          setValue(e.target.value)
        }
        autoComplete="new-password"
        className="border-0 border-b border-foreground/30 bg-transparent px-0 text-sm font-light tracking-tight placeholder:text-foreground/30 focus:border-foreground/60 focus:outline-none focus-visible:ring-0"
      />
    </div>
  );
}
