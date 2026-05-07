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
import { authClient } from "@/lib/auth/client";
import { Fingerprint, Loader2, Plus, Trash2 } from "lucide-react";
import { use, useMemo, useState } from "react";
import { RPage } from "@/components/UX/Transition";

const PROVIDER_LABEL: Record<string, string> = {
  google: "Google",
  naver: "Naver",
  credential: "Email & Password",
  passkey: "Passkey",
  "credential-2fa": "2FA"
};

const PROVIDER_BLURB: Record<string, string> = {
  google: "Sign in with your Google account.",
  naver: "Sign in with your Naver account.",
  credential: "Email and password sign-in.",
  passkey: "Hardware-backed sign-in via passkeys."
};

export default function ConnectedSectionClient() {
  const { userAccountsPromise } = useBetterAuth();
  const accounts = use(userAccountsPromise);
  const passkeys = authClient.useListPasskeys();

  const linked = useMemo(() => {
    const set = new Set<string>();
    accounts?.forEach((a) => {
      if (a.providerId) set.add(a.providerId);
      a.scopes?.forEach((s) => set.add(s));
    });
    return set;
  }, [accounts]);

  return (
    <RPage type="account" slug={[]}>
      <div className="flex w-full flex-col gap-6">
        {/* Sign-in providers */}
        <Panel>
          <PanelGrid>
            <PanelHeader
              eyebrow="Providers"
              title="Identity providers connected to your account"
              blurb="Sign in with any of these. The first time you use a provider it links to your account automatically."
            />
            <PanelControls>
              <ProviderRow
                slug="credential"
                isLinked={linked.has("credential")}
              />
              <ProviderRow slug="google" isLinked={linked.has("google")} />
              <ProviderRow slug="naver" isLinked={linked.has("naver")} />
            </PanelControls>
          </PanelGrid>
        </Panel>

        {/* Passkeys */}
        <Panel>
          <PanelGrid>
            <PanelHeader
              eyebrow="Passkeys"
              title="Hardware-backed sign-in"
              blurb="Use Face ID, Touch ID, Windows Hello, or a security key. No password required."
              meta={
                <span className="tabular-nums text-foreground/75">
                  {String(passkeys.data?.length ?? 0).padStart(2, "0")} added
                </span>
              }
            />
            <PanelControls>
              {(passkeys.data ?? []).length === 0 ? (
                <div className="rounded-lg bg-foreground/[0.025] px-4 py-3 text-sm text-foreground/65 dark:bg-foreground/[0.03] dark:text-foreground/60">
                  No passkeys yet. Add one to skip the password.
                </div>
              ) : (
                passkeys.data?.map((pk) => (
                  <PasskeyRow
                    key={pk.id}
                    id={pk.id}
                    name={pk.name ?? "My Passkey"}
                    createdAt={pk.createdAt as unknown as string | undefined}
                  />
                ))
              )}
              <ActionField
                label="Add a passkey"
                description="Register a new device or security key."
              >
                <AddPasskeyDialog />
              </ActionField>
            </PanelControls>
          </PanelGrid>
        </Panel>
      </div>
    </RPage>
  );
}

function ProviderRow({ slug, isLinked }: { slug: string; isLinked: boolean }) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-lg bg-foreground/[0.025] px-4 py-3 dark:bg-foreground/[0.03]">
      <div className="flex min-w-0 flex-col">
        <span className="text-sm text-foreground">
          {PROVIDER_LABEL[slug] ?? slug}
        </span>
        <span className="text-xs text-foreground/65 dark:text-foreground/60">
          {PROVIDER_BLURB[slug] ?? ""}
        </span>
      </div>
      <span
        className={
          isLinked
            ? "text-xs text-foreground/85"
            : "text-xs text-foreground/55 dark:text-foreground/50"
        }
      >
        {isLinked ? "Linked" : "Available"}
      </span>
    </div>
  );
}

function PasskeyRow({
  id,
  name,
  createdAt
}: {
  id: string;
  name: string;
  createdAt?: string;
}) {
  const [pending, setPending] = useState(false);
  const onDelete = async () => {
    setPending(true);
    const res = await authClient.passkey.deletePasskey({ id });
    if (res?.error) {
      errorToast(res.error.message ?? "Couldn't delete passkey");
    } else {
      successToast("Passkey removed");
    }
    setPending(false);
  };
  const date = createdAt
    ? new Date(createdAt).toLocaleDateString(undefined, {
        year: "numeric",
        month: "short",
        day: "numeric"
      })
    : null;
  return (
    <div className="flex items-center justify-between gap-4 rounded-lg bg-foreground/[0.025] px-4 py-3 dark:bg-foreground/[0.03]">
      <div className="flex min-w-0 items-center gap-3">
        <span className="flex size-4 shrink-0 items-center justify-center text-foreground/55 dark:text-foreground/50">
          <Fingerprint size={14} strokeWidth={1.4} />
        </span>
        <div className="flex min-w-0 flex-col">
          <span className="truncate text-sm text-foreground">{name}</span>
          {date ? (
            <span className="text-xs text-foreground/60 dark:text-foreground/55">
              Added {date}
            </span>
          ) : null}
        </div>
      </div>
      <RP_Btn
        onClick={onDelete}
        aria-label={`Remove passkey ${name}`}
        className="flex size-7 items-center justify-center rounded-md text-foreground/65 transition-colors hover:bg-foreground/[0.06] hover:text-rouge-700 dark:text-foreground/60"
      >
        {pending ? (
          <Loader2 size={14} className="animate-spin" />
        ) : (
          <Trash2 size={14} />
        )}
      </RP_Btn>
    </div>
  );
}

function AddPasskeyDialog() {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [pending, setPending] = useState(false);

  const onAdd = async () => {
    if (!name.trim()) {
      errorToast("Name your passkey first");
      return;
    }
    setPending(true);
    const res = await authClient.passkey.addPasskey({ name: name.trim() });
    if (res?.error) {
      errorToast(res.error.message ?? "Couldn't add passkey");
    } else {
      successToast("Passkey added");
      setName("");
      setOpen(false);
    }
    setPending(false);
  };

  return (
    <DialogRoot open={open} onOpenChange={setOpen}>
      <DialogTrigger
        nativeButton={true}
        render={() => (
          <ActionButton icon={<Plus size={12} />}>Add a passkey</ActionButton>
        )}
      />
      <DialogContent className="w-11/12 rounded-2xl sm:max-w-[440px]">
        <DialogHeader>
          <p className="text-xs text-foreground/55">Security</p>
          <DialogTitle className="mt-1 text-2xl font-light tracking-tight">
            Add a passkey
          </DialogTitle>
          <DialogDescription className="mt-1 text-sm font-light text-foreground/65">
            Give it a memorable name — like the device you&#39;ll use it on.
          </DialogDescription>
        </DialogHeader>
        <div className="mt-4 flex flex-col gap-2">
          <Label htmlFor="passkey-name" className="text-xs text-foreground/65">
            Name
          </Label>
          <Input
            id="passkey-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="MacBook Pro"
            className="border-0 border-b border-foreground/30 bg-transparent px-0 text-sm font-light tracking-tight placeholder:text-foreground/30 focus:border-foreground/60 focus:outline-none focus-visible:ring-0"
          />
        </div>
        <DialogFooter className="mt-6">
          <ActionButton
            onClick={onAdd}
            loading={pending}
            icon={<Fingerprint size={12} />}
          >
            Create passkey
          </ActionButton>
        </DialogFooter>
      </DialogContent>
    </DialogRoot>
  );
}
