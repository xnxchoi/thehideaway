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
  EditorialButton,
  SettingsGroup,
  SettingsHeader,
  SettingsRow,
  getSection
} from "@/components/UX/Settings";
import { useBetterAuth } from "@/lib/auth/context";
import { authClient } from "@/lib/auth/client";
import { Fingerprint, Loader2, Plus, Trash2 } from "lucide-react";
import { use, useMemo, useState } from "react";
import { RPage } from "@/components/UX/Transition";

const section = getSection("connected");

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
    <RPage slug={[]} type="account">
      <div className="flex w-full flex-col gap-6">
        <SettingsHeader section={section} />

        <SettingsGroup
          title="Sign-in providers"
          description="Identity providers connected to your account."
        >
          <ProviderRow slug="credential" isLinked={linked.has("credential")} />
          <ProviderRow slug="google" isLinked={linked.has("google")} />
          <ProviderRow slug="naver" isLinked={linked.has("naver")} />
        </SettingsGroup>

        <SettingsGroup
          title="Passkeys"
          description="Hardware-backed sign-in via Face ID, Touch ID, or a security key."
          meta={
            <span className="tabular-nums">
              {String(passkeys.data?.length ?? 0).padStart(2, "0")}
            </span>
          }
        >
          {(passkeys.data ?? []).length === 0 ? (
            <p className="border-t border-border/15 pt-5 font-mono text-[11px] tracking-wide text-foreground/45">
              No passkeys yet. Add one to skip the password.
            </p>
          ) : (
            <div className="flex flex-col">
              {passkeys.data?.map((pk) => (
                <PasskeyRow
                  key={pk.id}
                  id={pk.id}
                  name={pk.name ?? "My Passkey"}
                  createdAt={pk.createdAt as unknown as string | undefined}
                />
              ))}
            </div>
          )}
          <div className="mt-6">
            <AddPasskeyDialog />
          </div>
        </SettingsGroup>
      </div>
    </RPage>
  );
}

function ProviderRow({ slug, isLinked }: { slug: string; isLinked: boolean }) {
  return (
    <SettingsRow
      label={PROVIDER_LABEL[slug] ?? slug}
      description={PROVIDER_BLURB[slug] ?? ""}
      meta={
        isLinked ? (
          <span className="text-foreground/85">Linked</span>
        ) : (
          <span className="text-foreground/60 dark:text-foreground/55">
            Available
          </span>
        )
      }
    >
      <span className="text-foreground/70">
        {isLinked ? "Active" : "Sign in with this provider once to link."}
      </span>
    </SettingsRow>
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
    <div className="grid grid-cols-1 items-center gap-x-8 gap-y-2 border-t border-border/15 py-4 first:border-t-0 md:grid-cols-[auto_minmax(0,1fr)_auto_auto]">
      <div className="flex h-8 w-8 items-center justify-center text-foreground/55">
        <Fingerprint size={15} strokeWidth={1.2} />
      </div>
      <span className="truncate text-sm font-light tracking-tight">{name}</span>
      <span className="font-mono text-[10px] tracking-widest text-foreground/60 uppercase dark:text-foreground/55">
        {date ?? ""}
      </span>
      <RP_Btn
        onClick={onDelete}
        className="text-foreground/65 transition-colors hover:text-rouge-700 dark:text-foreground/60"
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
          <EditorialButton icon={<Plus size={12} />}>
            Add a passkey
          </EditorialButton>
        )}
      />
      <DialogContent className="w-11/12 rounded-sm sm:max-w-[440px]">
        <DialogHeader>
          <p className="font-mono text-[10px] tracking-[0.22em] text-foreground/50 uppercase">
            Security
          </p>
          <DialogTitle className="mt-1 text-2xl font-light tracking-tight">
            Add a passkey
          </DialogTitle>
          <DialogDescription className="mt-1 text-sm font-light text-foreground/65">
            Give it a memorable name — like the device you&#39;ll use it on.
          </DialogDescription>
        </DialogHeader>
        <div className="mt-4 flex flex-col gap-2">
          <Label
            htmlFor="passkey-name"
            className="font-mono text-[10px] tracking-[0.18em] text-foreground/55 uppercase"
          >
            Name
          </Label>
          <Input
            id="passkey-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="MacBook Pro"
            className="border-0 border-b border-border/30 bg-transparent px-0 text-sm font-light tracking-tight placeholder:text-foreground/30 focus:border-foreground/60 focus:outline-none focus-visible:ring-0"
          />
        </div>
        <DialogFooter className="mt-6">
          <EditorialButton
            onClick={onAdd}
            loading={pending}
            icon={<Fingerprint size={12} />}
          >
            Create passkey
          </EditorialButton>
        </DialogFooter>
      </DialogContent>
    </DialogRoot>
  );
}
