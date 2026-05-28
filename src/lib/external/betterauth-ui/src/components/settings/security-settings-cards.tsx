"use client";

import {
  ChangePasswordCard,
  DeleteAccountCard,
  PasskeysCard,
  ProvidersCard,
  SessionsCard,
  TwoFactorCard
} from "@/lib/external/betterauth-ui/src";
import { cn } from "@/lib/utils";
import { useContext } from "react";
import { AuthUIContext } from "../../lib/auth-ui-provider";
import type { AuthLocalization } from "../../localization/auth-localization";
import { SettingsCardClassNames } from "./shared/settings-card";

export function SecuritySettingsCards({
  className,
  classNames,
  localization
}: {
  className?: string;
  classNames?: {
    card?: SettingsCardClassNames;
    cards?: string;
  };
  localization?: Partial<AuthLocalization>;
}) {
  const {
    credentials,
    deleteUser,
    hooks,
    localization: contextLocalization,
    passkey,
    social,
    genericOAuth,
    twoFactor
  } = useContext(AuthUIContext);

  localization = { ...contextLocalization, ...localization };

  const { useListAccounts } = hooks;

  const {
    data: accounts,
    isPending: accountsPending,
    refetch: refetchAccounts
  } = useListAccounts();

  const credentialsLinked = accounts?.some(
    (acc) => acc.providerId === "credential"
  );

  return (
    <div
      className={cn(
        "flex w-full flex-col gap-4 md:gap-6",
        className,
        classNames?.cards
      )}
    >
      {credentials && (
        <ChangePasswordCard
          accounts={accounts}
          classNames={classNames?.card}
          isPending={accountsPending}
          localization={localization}
          skipHook
        />
      )}

      {(social?.providers?.length || genericOAuth?.providers?.length) && (
        <ProvidersCard
          accounts={accounts}
          classNames={classNames?.card}
          isPending={accountsPending}
          localization={localization}
          refetch={refetchAccounts}
          skipHook
        />
      )}

      {twoFactor && credentialsLinked && (
        <TwoFactorCard
          classNames={classNames?.card}
          localization={localization}
        />
      )}

      {passkey && (
        <PasskeysCard
          classNames={classNames?.card}
          localization={localization}
        />
      )}

      <SessionsCard classNames={classNames?.card} localization={localization} />

      {deleteUser && (
        <DeleteAccountCard
          accounts={accounts}
          classNames={classNames?.card}
          isPending={accountsPending}
          localization={localization}
          skipHook
        />
      )}
    </div>
  );
}
