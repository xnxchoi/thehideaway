"use client";

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
import { Checkbox } from "@/components/ui/checkbox";
import { PasswordInput } from "@/components/ui/password-input";
import {
  ActionButton,
  ActionField,
  ChoiceField,
  LockedField,
  Panel,
  PanelControls,
  PanelGrid,
  PanelHeader
} from "@/components/UX/Settings";
import { authClient } from "@/lib/auth/client";
import type { User } from "@/payload-types";
import { Lock, Mail } from "lucide-react";
import { useState, useTransition } from "react";
import { errorToast, successToast } from "@/components/ui/sonner";
import { setLocaleAction } from "../_helpers/setLocale";
import { RPage } from "@/components/UX/Transition";

interface AccountSectionClientProps {
  user: User;
  locale: "en" | "ko";
}

export default function AccountSectionClient({
  user,
  locale
}: AccountSectionClientProps) {
  return (
    <RPage type="account" slug={[]}>
      <div className="flex w-full flex-col gap-6">
        {/* Sign-in email */}
        <Panel>
          <PanelGrid>
            <PanelHeader
              eyebrow="Sign-in"
              title="The email you use to sign in"
              blurb="Account-critical messages go here. Editing is in preparation."
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
            <PanelHeader
              eyebrow="Password"
              title="Change the password you sign in with"
              blurb="Used only when you sign in with email and password. Passkeys and OAuth bypass this."
            />
            <PanelControls>
              <ChangePasswordField />
            </PanelControls>
          </PanelGrid>
        </Panel>

        {/* Language */}
        <Panel>
          <PanelGrid>
            <PanelHeader
              eyebrow="Language"
              title="Site-wide UI language"
              blurb="Affects only this device until your account preference is synced."
            />
            <PanelControls>
              <LocaleField current={locale} />
            </PanelControls>
          </PanelGrid>
        </Panel>
      </div>
    </RPage>
  );
}

function ResendVerificationField({ email }: { email: string }) {
  const [pending, setPending] = useState(false);

  const onClick = async () => {
    setPending(true);
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
    setPending(false);
  };

  return (
    <ActionField
      label="Resend verification"
      description="Send the verification message to this email again."
    >
      <ActionButton onClick={onClick} loading={pending} icon={<Mail size={12} />}>
        Resend
      </ActionButton>
    </ActionField>
  );
}

function LocaleField({ current }: { current: "en" | "ko" }) {
  const [pending, startTransition] = useTransition();
  const [active, setActive] = useState<"en" | "ko">(current);

  const onChange = async (next: "en" | "ko") => {
    if (next === active) return;
    setActive(next);
    return new Promise<void>((resolve, reject) => {
      startTransition(async () => {
        try {
          await setLocaleAction(next);
          resolve();
        } catch (e) {
          setActive(current);
          reject(e);
        }
      });
    });
  };

  return (
    <ChoiceField<"en" | "ko">
      label="Language"
      value={active}
      onChange={onChange}
      options={[
        { value: "en", label: "EN — English" },
        { value: "ko", label: "KO — 한국어" }
      ]}
      disabled={pending}
    />
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
    const res = await authClient.changePassword({
      newPassword,
      currentPassword,
      revokeOtherSessions: signOutOthers
    });
    setLoading(false);
    if (res?.error) {
      errorToast(res.error.message ?? "Couldn't change password");
      return;
    }
    successToast("Password changed");
    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
    setOpen(false);
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
            <p className="text-xs text-foreground/55">Security</p>
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
            <ActionButton onClick={submit} loading={loading} icon={<Lock size={12} />}>
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
