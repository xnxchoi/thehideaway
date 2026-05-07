"use client";

import { Button, RP_Btn } from "@/components/core/Button";
import {
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogRoot,
  DialogTitle,
  DialogTrigger
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PasswordInput } from "@/components/ui/password-input";
import CopyButton from "@/components/ui/copy-button";
import { errorToast, successToast } from "@/components/ui/sonner";
import {
  EditorialButton,
  SettingsGroup,
  SettingsRow
} from "@/components/UX/Settings";
import { useBetterAuth } from "@/lib/auth/context";
import { authClient, signOut } from "@/lib/auth/client";
import { cn } from "@/lib/utils";
import type { User } from "@/payload-types";
import { useTransitionRouter } from "next-transition-router";
import {
  Loader2,
  MonitorSmartphone,
  QrCode,
  ShieldCheck,
  ShieldOff
} from "lucide-react";
import { MobileIcon } from "@radix-ui/react-icons";
import QRCode from "react-qr-code";
import { use, useMemo, useState } from "react";
import { UAParser } from "ua-parser-js";
import { RPage } from "@/components/UX/Transition";

interface SecuritySectionClientProps {
  user: User;
}

export default function SecuritySectionClient({
  user
}: SecuritySectionClientProps) {
  const { sessionPromise, deviceSessionsPromise } = useBetterAuth();

  const combined = useMemo(
    () => Promise.all([sessionPromise, deviceSessionsPromise]),
    [sessionPromise, deviceSessionsPromise]
  );
  const [session, sessions] = use(combined);

  const activeCount = sessions?.filter((s) => s?.userAgent).length ?? 0;

  return (
    <RPage type="account" slug={[]}>
      <div className="flex w-full flex-col gap-6">
        {/* Two-Factor */}
        <SettingsGroup
          title="Two-factor authentication"
          description="Require a TOTP code from an authenticator app at sign-in."
          meta={
            user.twoFactorEnabled ? (
              <span className="text-foreground/85">Enabled</span>
            ) : (
              <span className="text-foreground/65 dark:text-foreground/60">
                Off
              </span>
            )
          }
        >
          <SettingsRow
            label="Authenticator"
            description={
              user.twoFactorEnabled
                ? "2FA is active for sign-in."
                : "Add an extra layer of security."
            }
          >
            <div className="flex flex-wrap items-center gap-3">
              {user.twoFactorEnabled ? <ShowQrDialog /> : null}
              <TwoFactorToggleDialog enabled={Boolean(user.twoFactorEnabled)} />
            </div>
          </SettingsRow>
        </SettingsGroup>

        {/* Active sessions */}
        <SettingsGroup
          title="Active sessions"
          description="Devices currently signed in to your account."
          meta={
            <span className="tabular-nums">
              {String(activeCount).padStart(2, "0")}
            </span>
          }
        >
          <div className="flex flex-col">
            {(sessions ?? [])
              .filter((s) => s?.userAgent)
              .map((s) => {
                const ua = new UAParser(s.userAgent || "");
                const isMobile = ua.getDevice().type === "mobile";
                const os = ua.getOS().name ?? "Unknown";
                const browser = ua.getBrowser().name ?? "Unknown";
                const isCurrent = session?.session.id === s.id;
                return (
                  <SessionRow
                    key={s.id}
                    id={s.id}
                    token={s.token}
                    isCurrent={isCurrent}
                    isMobile={isMobile}
                    os={os}
                    browser={browser}
                  />
                );
              })}
          </div>
          <div className="mt-6">
            <RevokeOthers />
          </div>
        </SettingsGroup>

        {/* Danger */}
        <SettingsGroup
          title="Account closure"
          description="Permanent. Removes your access to The Hideaway."
        >
          <SettingsRow
            label="Delete account"
            description="Authored content may be retained per our policy."
          >
            <DeleteAccountDialog />
          </SettingsRow>
        </SettingsGroup>
      </div>
    </RPage>
  );
}

function SessionRow({
  id,
  token,
  isCurrent,
  isMobile,
  os,
  browser
}: {
  id: string;
  token: string;
  isCurrent: boolean;
  isMobile: boolean;
  os: string;
  browser: string;
}) {
  const router = useTransitionRouter();
  const [pending, setPending] = useState(false);
  const onTerminate = async () => {
    setPending(true);
    const res = await authClient.revokeSession({ token });
    if (res?.error) {
      errorToast(res.error.message ?? "Couldn't terminate session");
    } else {
      successToast("Session terminated");
      router.refresh();
    }
    setPending(false);
  };
  return (
    <div className="grid grid-cols-1 items-center gap-x-8 gap-y-3 border-t border-border/15 py-4 first:border-t-0 md:grid-cols-[auto_minmax(0,1fr)_auto]">
      <div className="flex h-8 w-8 items-center justify-center text-foreground/55">
        {isMobile ? (
          <MobileIcon className="size-4" />
        ) : (
          <MonitorSmartphone size={16} strokeWidth={1.2} />
        )}
      </div>
      <div className="flex min-w-0 flex-col">
        <span className="truncate text-sm font-light tracking-tight">
          {os}
          <span className="mx-2 text-foreground/45" aria-hidden="true">
            ·
          </span>
          {browser}
        </span>
        <span className="font-mono text-[10px] tracking-widest text-foreground/65 uppercase dark:text-foreground/60">
          {isCurrent ? "Current device" : "Signed in"}
        </span>
      </div>
      {isCurrent ? (
        <span className="font-mono text-[10px] tracking-[0.18em] text-foreground/55 uppercase">
          —
        </span>
      ) : (
        <EditorialButton tone="ghost" loading={pending} onClick={onTerminate}>
          Terminate
        </EditorialButton>
      )}
    </div>
  );
}

function RevokeOthers() {
  const [pending, setPending] = useState(false);
  const router = useTransitionRouter();
  const onClick = async () => {
    setPending(true);
    const res = await authClient.revokeOtherSessions();
    if (res?.error) {
      errorToast(res.error.message ?? "Couldn't sign out other devices");
    } else {
      successToast("Other devices signed out");
      router.refresh();
    }
    setPending(false);
  };
  return (
    <EditorialButton onClick={onClick} loading={pending}>
      Sign out other devices
    </EditorialButton>
  );
}

function TwoFactorToggleDialog({ enabled }: { enabled: boolean }) {
  const [open, setOpen] = useState(false);
  const [password, setPassword] = useState("");
  const [verifyURI, setVerifyURI] = useState("");
  const [pending, setPending] = useState(false);
  const router = useTransitionRouter();

  const onSubmit = async () => {
    if (!verifyURI && password.length < 8) {
      errorToast("Password must be at least 8 characters");
      return;
    }
    setPending(true);
    if (enabled) {
      // Disabling
      const res = await authClient.twoFactor.disable({
        password,
        fetchOptions: {
          onSuccess: () => {
            successToast("2FA disabled");
            setOpen(false);
            router.refresh();
          },
          onError: (ctx: { error: { message?: string } }) => {
            errorToast(ctx.error.message ?? "Couldn't disable 2FA");
          }
        }
      });
    } else {
      if (verifyURI) {
        await authClient.twoFactor.verifyTotp({
          code: password,
          fetchOptions: {
            onSuccess: () => {
              successToast("2FA enabled");
              setVerifyURI("");
              setPassword("");
              setOpen(false);
              router.refresh();
            },
            onError: (ctx) => {
              errorToast(ctx.error.message ?? "Code didn't match");
            }
          }
        });
      } else {
        await authClient.twoFactor.enable({
          password,
          fetchOptions: {
            onSuccess: (ctx) => {
              setVerifyURI(ctx.data.totpURI);
            },
            onError: (ctx) => {
              errorToast(ctx.error.message ?? "Couldn't initialize 2FA");
            }
          }
        });
      }
    }
    setPending(false);
    setPassword("");
  };

  return (
    <DialogRoot open={open} onOpenChange={setOpen}>
      <DialogTrigger
        nativeButton={true}
        render={() => (
          <EditorialButton
            icon={enabled ? <ShieldOff size={12} /> : <ShieldCheck size={12} />}
            tone={enabled ? "danger" : "default"}
          >
            {enabled ? "Disable 2FA" : "Enable 2FA"}
          </EditorialButton>
        )}
      />
      <DialogContent className="w-11/12 rounded-sm sm:max-w-[440px]">
        <DialogHeader>
          <p className="font-mono text-[10px] tracking-[0.22em] text-foreground/50 uppercase">
            Security
          </p>
          <DialogTitle className="mt-1 text-2xl font-light tracking-tight">
            {enabled ? "Disable 2FA" : "Enable 2FA"}
          </DialogTitle>
          <DialogDescription className="mt-1 text-sm font-light text-foreground/65">
            {enabled
              ? "Confirm your password to disable two-factor authentication."
              : verifyURI
                ? "Scan with your authenticator app, then enter the 6-digit code."
                : "Confirm your password to begin setup."}
          </DialogDescription>
        </DialogHeader>
        {verifyURI ? (
          <div className="mt-4 flex flex-col items-center gap-4">
            <div className="rounded-sm border border-border/30 bg-background p-3">
              <QRCode value={verifyURI} size={180} />
            </div>
            <Input
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="6-digit code"
              autoComplete="one-time-code"
              className="border-0 border-b border-border/30 bg-transparent px-0 text-center font-mono text-base tracking-[0.4em] focus:border-foreground/60 focus:outline-none focus-visible:ring-0"
            />
            <div className="flex items-center gap-2">
              <span className="font-mono text-[10px] tracking-widest text-foreground/60 uppercase dark:text-foreground/55">
                Or copy URI
              </span>
              <CopyButton textToCopy={verifyURI} />
            </div>
          </div>
        ) : (
          <div className="mt-4 flex flex-col gap-2">
            <Label
              htmlFor="twofa-pw"
              className="font-mono text-[10px] tracking-[0.18em] text-foreground/55 uppercase"
            >
              Password
            </Label>
            <PasswordInput
              id="twofa-pw"
              value={password}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                setPassword(e.target.value)
              }
              className="border-0 border-b border-border/30 bg-transparent px-0 text-sm font-light tracking-tight placeholder:text-foreground/30 focus:border-foreground/60 focus:outline-none focus-visible:ring-0"
            />
          </div>
        )}
        <DialogFooter className="mt-6">
          <Button
            disabled={pending}
            onClick={onSubmit}
            className={cn(
              "border px-5 py-2.5 font-mono text-[11px] tracking-[0.18em] uppercase transition-colors disabled:opacity-40",
              enabled
                ? "border-rouge-700/40 text-rouge-700/85 hover:border-rouge-700 hover:text-rouge-700"
                : "border-border/40 text-foreground/80 hover:border-border hover:text-foreground"
            )}
          >
            {pending ? (
              <Loader2 size={13} className="animate-spin" />
            ) : enabled ? (
              "Disable 2FA"
            ) : verifyURI ? (
              "Verify code"
            ) : (
              "Continue"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </DialogRoot>
  );
}

function ShowQrDialog() {
  const [open, setOpen] = useState(false);
  const [password, setPassword] = useState("");
  const [verifyURI, setVerifyURI] = useState("");
  return (
    <DialogRoot open={open} onOpenChange={setOpen}>
      <DialogTrigger
        nativeButton={true}
        render={() => (
          <EditorialButton tone="ghost" icon={<QrCode size={12} />}>
            Show QR
          </EditorialButton>
        )}
      />
      <DialogContent className="w-11/12 rounded-sm sm:max-w-[440px]">
        <DialogHeader>
          <p className="font-mono text-[10px] tracking-[0.22em] text-foreground/50 uppercase">
            Security
          </p>
          <DialogTitle className="mt-1 text-2xl font-light tracking-tight">
            Authenticator QR
          </DialogTitle>
          <DialogDescription className="mt-1 text-sm font-light text-foreground/65">
            Confirm your password to reveal the setup QR code.
          </DialogDescription>
        </DialogHeader>
        {verifyURI ? (
          <div className="mt-4 flex flex-col items-center gap-4">
            <QRCode value={verifyURI} size={180} />
            <div className="flex items-center gap-2">
              <span className="font-mono text-[10px] tracking-widest text-foreground/60 uppercase dark:text-foreground/55">
                Copy URI
              </span>
              <CopyButton textToCopy={verifyURI} />
            </div>
          </div>
        ) : (
          <div className="mt-4 flex flex-col gap-3">
            <PasswordInput
              value={password}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                setPassword(e.target.value)
              }
              placeholder="Password"
              className="border-0 border-b border-border/30 bg-transparent px-0 text-sm font-light tracking-tight placeholder:text-foreground/30 focus:border-foreground/60 focus:outline-none focus-visible:ring-0"
            />
            <EditorialButton
              onClick={async () => {
                if (password.length < 8) {
                  errorToast("Password must be at least 8 characters");
                  return;
                }
                await authClient.twoFactor.getTotpUri(
                  { password },
                  {
                    onSuccess(ctx) {
                      setVerifyURI(ctx.data.totpURI);
                      setPassword("");
                    }
                  }
                );
              }}
            >
              Show QR
            </EditorialButton>
          </div>
        )}
      </DialogContent>
    </DialogRoot>
  );
}

function DeleteAccountDialog() {
  const [open, setOpen] = useState(false);
  const [confirmText, setConfirmText] = useState("");
  const [pending, setPending] = useState(false);
  const router = useTransitionRouter();
  const canDelete = confirmText.trim().toLowerCase() === "delete my account";

  const onConfirm = async () => {
    if (!canDelete) return;
    setPending(true);
    try {
      const res = await authClient.deleteUser?.();
      if (res?.error) {
        errorToast(res.error.message ?? "Couldn't delete account");
      } else {
        await signOut();
        router.push("/");
      }
    } catch (e) {
      errorToast(e instanceof Error ? e.message : "Couldn't delete account");
    }
    setPending(false);
  };

  return (
    <DialogRoot open={open} onOpenChange={setOpen}>
      <DialogTrigger
        nativeButton={true}
        render={() => (
          <EditorialButton tone="danger">Delete account</EditorialButton>
        )}
      />
      <DialogContent className="w-11/12 rounded-sm sm:max-w-[440px]">
        <DialogHeader>
          <p className="font-mono text-[10px] tracking-[0.22em] text-rouge-700/70 uppercase">
            Danger
          </p>
          <DialogTitle className="mt-1 text-2xl font-light tracking-tight">
            Delete account
          </DialogTitle>
          <DialogDescription className="mt-1 text-sm font-light text-foreground/65">
            This permanently removes your account access. To confirm, type{" "}
            <span className="font-mono text-foreground/85">
              delete my account
            </span>
            .
          </DialogDescription>
        </DialogHeader>
        <div className="mt-4">
          <Input
            value={confirmText}
            onChange={(e) => setConfirmText(e.target.value)}
            placeholder="delete my account"
            className="border-0 border-b border-border/30 bg-transparent px-0 text-sm font-light tracking-tight placeholder:text-foreground/30 focus:border-foreground/60 focus:outline-none focus-visible:ring-0"
          />
        </div>
        <DialogFooter className="mt-6 flex items-center gap-3">
          <RP_Btn
            onClick={() => setOpen(false)}
            className="font-mono text-[10px] tracking-[0.18em] text-foreground/60 uppercase hover:text-foreground"
          >
            Cancel
          </RP_Btn>
          <Button
            disabled={!canDelete || pending}
            onClick={onConfirm}
            className="border border-rouge-700/40 px-5 py-2.5 font-mono text-[11px] tracking-[0.18em] text-rouge-700/85 uppercase transition-colors hover:border-rouge-700 hover:text-rouge-700 disabled:opacity-40"
          >
            {pending ? (
              <Loader2 size={13} className="animate-spin" />
            ) : (
              "Permanently delete"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </DialogRoot>
  );
}
