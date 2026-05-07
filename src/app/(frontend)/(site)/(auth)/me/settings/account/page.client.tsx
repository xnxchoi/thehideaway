"use client";

import { Button } from "@/components/core/Button";
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
  EditorialButton,
  SaveStatus,
  type SaveState,
  SettingsGroup,
  SettingsHeader,
  SettingsRow,
  getSection
} from "@/components/UX/Settings";
import { authClient } from "@/lib/auth/client";
import { cn } from "@/lib/utils";
import type { User } from "@/payload-types";
import { Loader2, Lock, Mail } from "lucide-react";
import { useState, useTransition } from "react";
import { errorToast, successToast } from "@/components/ui/sonner";
import { setLocaleAction } from "../_helpers/setLocale";
import { RPage } from "@/components/UX/Transition";

const section = getSection("account");

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
        <SettingsHeader section={section} />

        {/* Email */}
        <SettingsGroup
          title="Sign-in email"
          description="Where account-critical messages go. Editing email is in preparation."
          meta={
            user.emailVerified ? (
              <span className="text-foreground/65 dark:text-foreground/60">
                Verified
              </span>
            ) : (
              <span className="text-rouge-500/80">Unverified</span>
            )
          }
        >
          <SettingsRow label="Email">
            <span className="font-mono text-sm tracking-wide text-foreground/85">
              {user.email}
            </span>
          </SettingsRow>
          {!user.emailVerified ? (
            <SettingsRow
              label="Verification"
              description="Re-send the verification message."
            >
              <ResendVerification email={user.email} />
            </SettingsRow>
          ) : null}
        </SettingsGroup>

        {/* Password */}
        <SettingsGroup
          title="Password"
          description="Change the password used for email sign-in."
        >
          <SettingsRow label="Password">
            <ChangePassword />
          </SettingsRow>
        </SettingsGroup>

        {/* Language */}
        <SettingsGroup
          title="Language"
          description="Site-wide UI language. Affects only this device until synced."
        >
          <SettingsRow label="Language">
            <LocaleToggle current={locale} />
          </SettingsRow>
        </SettingsGroup>
      </div>
    </RPage>
  );
}

function ResendVerification({ email }: { email: string }) {
  const [pending, setPending] = useState(false);
  const [state, setState] = useState<SaveState>("idle");
  const onClick = async () => {
    setPending(true);
    setState("saving");
    await authClient.sendVerificationEmail(
      { email },
      {
        onError(ctx) {
          setState("error");
          errorToast(ctx.error.message ?? "Couldn't send verification");
        },
        onSuccess() {
          setState("saved");
          successToast("Verification email sent");
        }
      }
    );
    setPending(false);
  };
  return (
    <div className="flex items-center gap-4">
      <EditorialButton
        loading={pending}
        onClick={onClick}
        icon={<Mail size={12} />}
      >
        Re-send verification
      </EditorialButton>
      <SaveStatus state={state} />
    </div>
  );
}

function LocaleToggle({ current }: { current: "en" | "ko" }) {
  const [pending, startTransition] = useTransition();
  const [state, setState] = useState<SaveState>("idle");

  const set = (next: "en" | "ko") => {
    if (next === current) return;
    setState("saving");
    startTransition(async () => {
      try {
        await setLocaleAction(next);
        setState("saved");
      } catch (e) {
        setState("error");
      }
    });
  };

  const Btn = ({ code, label }: { code: "en" | "ko"; label: string }) => (
    <button
      type="button"
      onClick={() => set(code)}
      disabled={pending}
      className={cn(
        "border px-4 py-2 font-mono text-[11px] tracking-[0.18em] uppercase transition-colors disabled:opacity-50",
        current === code
          ? "border-foreground text-foreground"
          : "border-border/30 text-foreground/55 hover:border-border hover:text-foreground"
      )}
    >
      {label}
    </button>
  );

  return (
    <div className="flex items-center gap-3">
      <div className="inline-flex items-center gap-0 [&>*:not(:first-child)]:-ml-px">
        <Btn code="en" label="EN — English" />
        <Btn code="ko" label="KO — 한국어" />
      </div>
      <SaveStatus state={state} />
    </div>
  );
}

function ChangePassword() {
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
    <DialogRoot open={open} onOpenChange={setOpen}>
      <DialogTrigger
        nativeButton={true}
        render={() => (
          <EditorialButton icon={<Lock size={12} />}>
            Change password
          </EditorialButton>
        )}
      />
      <DialogContent className="w-11/12 rounded-sm sm:max-w-[440px]">
        <DialogHeader>
          <p className="font-mono text-[10px] tracking-[0.22em] text-foreground/50 uppercase">
            Security
          </p>
          <DialogTitle className="mt-1 text-2xl font-light tracking-tight">
            Change password
          </DialogTitle>
          <DialogDescription className="mt-1 text-sm font-light text-foreground/65">
            Update the password you use to sign in.
          </DialogDescription>
        </DialogHeader>
        <div className="mt-4 flex flex-col gap-6">
          <FieldRow
            id="current-password"
            label="Current password"
            value={currentPassword}
            setValue={setCurrentPassword}
          />
          <FieldRow
            id="new-password"
            label="New password"
            value={newPassword}
            setValue={setNewPassword}
          />
          <FieldRow
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
            <span className="font-mono text-[10px] tracking-[0.18em] text-foreground/70 uppercase">
              Sign out from other devices
            </span>
          </label>
        </div>
        <DialogFooter className="mt-6">
          <Button
            disabled={loading}
            onClick={submit}
            className="border border-border/40 px-5 py-2.5 font-mono text-[11px] tracking-[0.18em] text-foreground/80 uppercase transition-colors hover:border-border hover:bg-transparent hover:text-foreground disabled:opacity-40"
          >
            {loading ? (
              <Loader2 size={13} className="animate-spin" />
            ) : (
              "Change password"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </DialogRoot>
  );
}

function FieldRow({
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
      <Label
        htmlFor={id}
        className="font-mono text-[10px] tracking-[0.18em] text-foreground/55 uppercase"
      >
        {label}
      </Label>
      <PasswordInput
        id={id}
        value={value}
        onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
          setValue(e.target.value)
        }
        autoComplete="new-password"
        className="border-0 border-b border-border/30 bg-transparent px-0 text-sm font-light tracking-tight placeholder:text-foreground/30 focus:border-foreground/60 focus:outline-none focus-visible:ring-0"
      />
    </div>
  );
}
