"use client";

import { RP_Btn } from "@/components/core/Button";
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
  ActionButton,
  ActionField,
  Panel,
  PanelControls,
  PanelGrid,
  PanelHeader
} from "@/components/UX/Settings";
import { useBetterAuth } from "@/lib/auth/context";
import { authClient, signOut } from "@/lib/auth/client";
import type { User } from "@/payload-types";
import { useTransitionRouter } from "next-transition-router";
import {
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
        {/* Two-factor */}
        <Panel>
          <PanelGrid>
            <PanelHeader
              eyebrow="Two-factor"
              title="Require a TOTP code at sign-in"
              blurb="An authenticator app generates a 6-digit code that's required after your password."
              meta={
                user.twoFactorEnabled ? (
                  <span className="text-foreground/85">Enabled</span>
                ) : (
                  <span className="text-foreground/65 dark:text-foreground/60">
                    Off
                  </span>
                )
              }
            />
            <PanelControls>
              <ActionField
                label="Authenticator"
                description={
                  user.twoFactorEnabled
                    ? "2FA is active for sign-in."
                    : "Add an extra layer of security."
                }
              >
                {user.twoFactorEnabled ? <ShowQrDialog /> : null}
                <TwoFactorToggleDialog enabled={Boolean(user.twoFactorEnabled)} />
              </ActionField>
            </PanelControls>
          </PanelGrid>
        </Panel>

        {/* Active sessions */}
        <Panel>
          <PanelGrid>
            <PanelHeader
              eyebrow="Sessions"
              title="Devices currently signed in"
              blurb="If a device looks unfamiliar, terminate it. The current device is always shown first."
              meta={
                <span className="tabular-nums text-foreground/75">
                  {String(activeCount).padStart(2, "0")} active
                </span>
              }
            />
            <PanelControls>
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
                      token={s.token}
                      isCurrent={isCurrent}
                      isMobile={isMobile}
                      os={os}
                      browser={browser}
                    />
                  );
                })}
              <ActionField
                label="Sign out everywhere else"
                description="Terminate every session except the one you're using right now."
              >
                <RevokeOthers />
              </ActionField>
            </PanelControls>
          </PanelGrid>
        </Panel>

        {/* Danger */}
        <Panel>
          <PanelGrid>
            <PanelHeader
              eyebrow="Account closure"
              title="Permanently delete your account"
              blurb="Removes your access to The Hideaway. Authored content may be retained per our policy."
            />
            <PanelControls>
              <ActionField
                label="Delete account"
                description="This action is permanent."
                tone="danger"
              >
                <DeleteAccountDialog />
              </ActionField>
            </PanelControls>
          </PanelGrid>
        </Panel>
      </div>
    </RPage>
  );
}

function SessionRow({
  token,
  isCurrent,
  isMobile,
  os,
  browser
}: {
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
    try {
      const res = await authClient.revokeSession({ token });
      if (res?.error) {
        errorToast(res.error.message ?? "Couldn't terminate session");
      } else {
        successToast("Session terminated");
        router.refresh();
      }
    } catch (e) {
      errorToast(e instanceof Error ? e.message : "Couldn't terminate session");
    } finally {
      setPending(false);
    }
  };

  return (
    <div className="flex items-center justify-between gap-4 rounded-lg bg-foreground/[0.025] px-4 py-3 dark:bg-foreground/[0.03]">
      <div className="flex min-w-0 items-center gap-3">
        <span className="flex size-4 shrink-0 items-center justify-center text-foreground/55 dark:text-foreground/50">
          {isMobile ? (
            <MobileIcon className="size-4" />
          ) : (
            <MonitorSmartphone size={14} strokeWidth={1.4} />
          )}
        </span>
        <div className="flex min-w-0 flex-col">
          <span className="truncate text-sm text-foreground">
            {os}
            <span className="mx-2 text-foreground/45" aria-hidden="true">
              ·
            </span>
            {browser}
          </span>
          <span className="text-xs text-foreground/65 dark:text-foreground/60">
            {isCurrent ? "Current device" : "Signed in"}
          </span>
        </div>
      </div>
      {isCurrent ? (
        <span className="text-xs text-foreground/55" aria-hidden="true">
          —
        </span>
      ) : (
        <ActionButton tone="danger" loading={pending} onClick={onTerminate}>
          Terminate
        </ActionButton>
      )}
    </div>
  );
}

function RevokeOthers() {
  const [pending, setPending] = useState(false);
  const router = useTransitionRouter();
  const onClick = async () => {
    setPending(true);
    try {
      const res = await authClient.revokeOtherSessions();
      if (res?.error) {
        errorToast(res.error.message ?? "Couldn't sign out other devices");
      } else {
        successToast("Other devices signed out");
        router.refresh();
      }
    } catch (e) {
      errorToast(
        e instanceof Error ? e.message : "Couldn't sign out other devices"
      );
    } finally {
      setPending(false);
    }
  };
  return (
    <ActionButton onClick={onClick} loading={pending}>
      Sign out everywhere else
    </ActionButton>
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
    try {
    if (enabled) {
      await authClient.twoFactor.disable({
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
    } catch (e) {
      errorToast(e instanceof Error ? e.message : "2FA action failed");
    } finally {
      setPending(false);
      setPassword("");
    }
  };

  return (
    <DialogRoot open={open} onOpenChange={setOpen}>
      <DialogTrigger
        nativeButton={true}
        render={() => (
          <ActionButton
            icon={enabled ? <ShieldOff size={12} /> : <ShieldCheck size={12} />}
            tone={enabled ? "danger" : "neutral"}
          >
            {enabled ? "Disable 2FA" : "Enable 2FA"}
          </ActionButton>
        )}
      />
      <DialogContent className="w-11/12 rounded-2xl sm:max-w-[440px]">
        <DialogHeader>
          <p className="text-xs text-foreground/55">Security</p>
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
            <div className="rounded-lg border border-foreground/15 bg-background p-3">
              <QRCode value={verifyURI} size={180} />
            </div>
            <Input
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="6-digit code"
              autoComplete="one-time-code"
              className="border-0 border-b border-foreground/30 bg-transparent px-0 text-center text-base tracking-[0.4em] focus:border-foreground/60 focus:outline-none focus-visible:ring-0"
            />
            <div className="flex items-center gap-2">
              <span className="text-xs text-foreground/65">Or copy URI</span>
              <CopyButton textToCopy={verifyURI} />
            </div>
          </div>
        ) : (
          <div className="mt-4 flex flex-col gap-2">
            <Label htmlFor="twofa-pw" className="text-xs text-foreground/65">
              Password
            </Label>
            <PasswordInput
              id="twofa-pw"
              value={password}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                setPassword(e.target.value)
              }
              className="border-0 border-b border-foreground/30 bg-transparent px-0 text-sm font-light tracking-tight placeholder:text-foreground/30 focus:border-foreground/60 focus:outline-none focus-visible:ring-0"
            />
          </div>
        )}
        <DialogFooter className="mt-6">
          <ActionButton
            onClick={onSubmit}
            loading={pending}
            tone={enabled ? "danger" : "neutral"}
          >
            {enabled ? "Disable 2FA" : verifyURI ? "Verify code" : "Continue"}
          </ActionButton>
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
          <ActionButton icon={<QrCode size={12} />}>Show QR</ActionButton>
        )}
      />
      <DialogContent className="w-11/12 rounded-2xl sm:max-w-[440px]">
        <DialogHeader>
          <p className="text-xs text-foreground/55">Security</p>
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
              <span className="text-xs text-foreground/65">Copy URI</span>
              <CopyButton textToCopy={verifyURI} />
            </div>
          </div>
        ) : (
          <div className="mt-4 flex flex-col gap-3">
            <Label htmlFor="show-qr-pw" className="text-xs text-foreground/65">
              Password
            </Label>
            <PasswordInput
              id="show-qr-pw"
              value={password}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                setPassword(e.target.value)
              }
              placeholder="Password"
              className="border-0 border-b border-foreground/30 bg-transparent px-0 text-sm font-light tracking-tight placeholder:text-foreground/30 focus:border-foreground/60 focus:outline-none focus-visible:ring-0"
            />
            <ShowQrButton
              password={password}
              onSuccess={(uri) => {
                setVerifyURI(uri);
                setPassword("");
              }}
            />
          </div>
        )}
      </DialogContent>
    </DialogRoot>
  );
}

function ShowQrButton({
  password,
  onSuccess
}: {
  password: string;
  onSuccess: (uri: string) => void;
}) {
  const [pending, setPending] = useState(false);
  const onClick = async () => {
    if (password.length < 8) {
      errorToast("Password must be at least 8 characters");
      return;
    }
    setPending(true);
    try {
      await authClient.twoFactor.getTotpUri(
        { password },
        {
          onSuccess(ctx) {
            onSuccess(ctx.data.totpURI);
          },
          onError(ctx) {
            errorToast(ctx.error.message ?? "Couldn't fetch QR");
          }
        }
      );
    } catch (e) {
      errorToast(e instanceof Error ? e.message : "Couldn't fetch QR");
    } finally {
      setPending(false);
    }
  };
  return (
    <ActionButton onClick={onClick} loading={pending}>
      Show QR
    </ActionButton>
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
    } finally {
      setPending(false);
    }
  };

  return (
    <DialogRoot open={open} onOpenChange={setOpen}>
      <DialogTrigger
        nativeButton={true}
        render={() => <ActionButton tone="danger">Delete account</ActionButton>}
      />
      <DialogContent className="w-11/12 rounded-2xl sm:max-w-[440px]">
        <DialogHeader>
          <p className="text-xs text-rouge-700/70">Danger</p>
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
            className="border-0 border-b border-foreground/30 bg-transparent px-0 text-sm font-light tracking-tight placeholder:text-foreground/30 focus:border-foreground/60 focus:outline-none focus-visible:ring-0"
          />
        </div>
        <DialogFooter className="mt-6 flex items-center gap-3">
          <RP_Btn
            onClick={() => setOpen(false)}
            className="text-xs text-foreground/60 hover:text-foreground"
          >
            Cancel
          </RP_Btn>
          <ActionButton
            tone="danger"
            onClick={onConfirm}
            loading={pending}
            disabled={!canDelete}
          >
            Permanently delete
          </ActionButton>
        </DialogFooter>
      </DialogContent>
    </DialogRoot>
  );
}
