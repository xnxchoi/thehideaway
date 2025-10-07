"use client";

import { CircleCheckIcon, XIcon } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { RP_Btn } from "@/components/UX/Link/Link";
import {
  ComponentProps,
  EventHandler,
  MouseEventHandler,
  ReactNode
} from "react";

export function ResponseButton(
  props: ComponentProps<"button"> & {
    onClick: (e?: MouseEvent) => Promise<void> | void;
    errorToast?: ReactNode;
    successToast?: ReactNode;
    successMessage: string;
  }
) {
  const { successMessage, onClick, className, ...rest } = props;
  return (
    <RP_Btn
      className={className}
      onClick={(e) => {
        e.preventDefault();

        toast.custom((t) => (
          <div className="w-full rounded-md border bg-background px-4 py-3 text-foreground shadow-lg sm:w-[var(--width)]">
            <div className="flex gap-2">
              <div className="flex grow gap-3">
                <CircleCheckIcon
                  className="mt-0.5 shrink-0 text-bleu-500"
                  size={16}
                  aria-hidden="true"
                />
                <div className="flex grow justify-between gap-12">
                  <p className="text-sm">{successMessage}</p>
                  <div className="text-sm whitespace-nowrap">
                    <RP_Btn className="text-sm font-medium hover:underline">
                      View
                    </RP_Btn>{" "}
                    <span className="mx-1 text-muted-foreground">·</span>{" "}
                    <RP_Btn
                      className="text-sm font-medium hover:underline"
                      onClick={() => toast.dismiss(t)}
                    >
                      Undo
                    </RP_Btn>
                  </div>
                </div>
              </div>
              <Button
                variant="ghost"
                className="group -my-1.5 -me-2 size-8 shrink-0 p-0 hover:bg-transparent"
                onClick={() => toast.dismiss(t)}
                aria-label="Close banner"
              >
                <XIcon
                  size={16}
                  className="opacity-60 transition-opacity group-hover:opacity-100"
                  aria-hidden="true"
                />
              </Button>
            </div>
          </div>
        ));
      }}
    >
      Custom sonner
    </RP_Btn>
  );
}
