"use client";

import { cn } from "@/lib/utils";
import type { Organization } from "better-auth/plugins/organization";
import { EllipsisIcon, Loader2, XIcon } from "lucide-react";
import { useContext, useMemo, useState } from "react";

import { AuthUIContext } from "../../lib/auth-ui-provider";
import { getLocalizedError } from "../../lib/utils";
import type { AuthLocalization } from "../../localization/auth-localization";
import type { Invitation } from "../../types/invitation";
import type { SettingsCardClassNames } from "../settings/shared/settings-card";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from "../ui/dropdown-menu";
import { UserAvatar } from "../user-avatar";

export interface InvitationCellProps {
  className?: string;
  classNames?: SettingsCardClassNames;
  invitation: Invitation;
  localization?: AuthLocalization;
  organization: Organization;
}

export function InvitationCell({
  className,
  classNames,
  invitation,
  localization: localizationProp,
  organization
}: InvitationCellProps) {
  const {
    authClient,
    hooks: { useListInvitations },
    organization: organizationOptions,
    localization: contextLocalization,
    toast
  } = useContext(AuthUIContext);

  const localization = useMemo(
    () => ({ ...contextLocalization, ...localizationProp }),
    [contextLocalization, localizationProp]
  );

  const [isLoading, setIsLoading] = useState(false);

  const builtInRoles = [
    { role: "owner", label: localization.OWNER },
    { role: "admin", label: localization.ADMIN },
    { role: "member", label: localization.MEMBER }
  ];

  const roles = [...builtInRoles, ...(organizationOptions?.customRoles || [])];
  const role = roles.find((r) => r.role === invitation.role);

  const { refetch } = useListInvitations({
    query: { organizationId: organization?.id }
  });

  const handleCancelInvitation = async () => {
    setIsLoading(true);

    try {
      await authClient.organization.cancelInvitation({
        invitationId: invitation.id,
        fetchOptions: { throw: true }
      });

      await refetch?.();

      toast({
        variant: "success",
        message: localization.INVITATION_CANCELLED
      });
    } catch (error) {
      toast({
        variant: "error",
        message: getLocalizedError({
          error,
          localization,
          localizeErrors: true
        })
      });
    }

    setIsLoading(false);
  };

  return (
    <Card
      className={cn("flex-row items-center p-4", className, classNames?.cell)}
    >
      <div className="flex flex-1 items-center gap-2">
        <UserAvatar
          className="my-0.5"
          user={invitation}
          localization={localization}
        />

        <div className="grid flex-1 text-left leading-tight">
          <span className="truncate text-sm font-semibold">
            {invitation.email}
          </span>

          <span className="truncate text-xs text-muted-foreground">
            {localization.EXPIRES} {invitation.expiresAt.toLocaleDateString()}
          </span>
        </div>
      </div>

      <span className="truncate text-sm opacity-70">{role?.label}</span>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            className={cn(
              "relative ms-auto",
              classNames?.button,
              classNames?.outlineButton
            )}
            disabled={isLoading}
            size="icon"
            type="button"
            variant="outline"
          >
            {isLoading ? (
              <Loader2 className="animate-spin" />
            ) : (
              <EllipsisIcon className={classNames?.icon} />
            )}
          </Button>
        </DropdownMenuTrigger>

        <DropdownMenuContent onCloseAutoFocus={(e) => e.preventDefault()}>
          <DropdownMenuItem
            onClick={handleCancelInvitation}
            disabled={isLoading}
            variant="destructive"
          >
            <XIcon className={classNames?.icon} />

            {localization.CANCEL_INVITATION}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </Card>
  );
}
