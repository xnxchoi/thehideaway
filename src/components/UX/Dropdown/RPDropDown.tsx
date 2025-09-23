"use client";

import {
  DropOutButton,
  LinkedDropdownItem
} from "@/components/ui/dropdown-menu";
import { UserAvatar } from "@/lib/auth/betterauth-ui/src";
import { useRPSession } from "@/lib/auth/session/RP_SessionProvider";
import { cn } from "@/lib/utils";
import { useRPStore } from "@/providers/RP_Pro";
import { Popover } from "@base-ui-components/react";
import * as m from "motion/react-m";
import {
  ButtonHTMLAttributes,
  HTMLAttributes,
  useEffect,
  useState
} from "react";
import { Button, Link, RP_Btn } from "src/components/UX/Link";
import { useShallow } from "zustand/shallow";
import { Separator } from "../../ui/separator";
import { signOut } from "../../../lib/auth/client";
import { SignOutButton } from "../SignOutButton";

interface SlitProps extends HTMLAttributes<HTMLDivElement> {
  style: HTMLAttributes<HTMLDivElement>["style"] & {
    "--orz": string;
    "--id": number;
    "--ol": string;
    "--tm": string;
    "--thx": string;
  };
  size: "T" | "S";
}

// const Slit = forwardRef<HTMLDivElement, SlitProps>((props, ref) => {
//   let { size, ...rest } = props
//   return <div className={cn({ sh: size === 'S', tl: size === 'T' })} ref={ref} {...rest} />
// })
export type RP_DDProps = HTMLAttributes<HTMLDivElement> & {
  moves: HTMLElement[];
};

export interface DD_ToggleButtonProps
  extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, "style"> {
  style: HTMLAttributes<HTMLButtonElement>["style"] & {
    "--of"?: string | number;
  };
}

interface DDUser {
  name: string;
  role: string;
  slug: string;
  id: string;
  image?: string | null;
}

export function UserDropdown() {
  const name = useRPSession(useShallow((r) => r.name));
  const slug = useRPSession(useShallow((r) => r.slug));
  const id = useRPSession(useShallow((r) => r.id));
  const dropdownOpen = useRPStore(useShallow((store) => store.dropdownOpen));
  const setD = useRPStore((store) => store.setDropdownOpen);
  const [isOpen, setIsOpen] = useState(false);
  useEffect(() => {
    if (dropdownOpen) {
      setIsOpen(true);
    } else {
      setIsOpen(false);
    }
  }, [dropdownOpen]);
  const onSignOut = () => {
    signOut();
  };

  return (
    <m.div
      initial={{ opacity: 0, scaleX: 0.01 }}
      animate={{ opacity: 1, scaleX: 1 }}
      exit={{ opacity: 0, scaleX: 0.01 }}
      key={id}
      transition={{ duration: 0.3, ease: "easeOut" }}
    >
      <Popover.Root>
        <Popover.Trigger
          render={
            <RP_Btn
              className={
                "rp_btn bt-sm flex !aspect-square items-center justify-center"
              }
              style={{ display: "flex" }}
              aria-label={`@${name}`}
            >
              <UserAvatar
                classNames={{ skeleton: "bg-muted-faded-background/10" }}
                user={{ name, id }}
              />
            </RP_Btn>
          }
        />
        <Popover.Portal>
          <Popover.Positioner sideOffset={15}>
            <Popover.Popup className="relative min-w-[15rem] origin-[var(--transform-origin)] rounded-md bg-button-background px-4.5 py-4 font-sans font-light text-faded-foreground/90 shadow-lg shadow-muted-faded-background/30 backdrop-blur-xs transition-[transform,scale,opacity,background-color,color,box-shadow] data-[ending-style]:scale-90 data-[ending-style]:opacity-0 data-[starting-style]:scale-90 data-[starting-style]:opacity-0">
              <Popover.Title
                className={cn(
                  "flex items-center px-3 py-3 font-sans text-sm leading-[1] font-light"
                )}
              >
                <span className="text-xs">@</span>
                <span className="text-sm">{name}</span>
              </Popover.Title>
              <Separator />
              <div className="flex flex-col">
                <Link className={""} href={`/@${slug}`} title={"Profile"}>
                  Profile
                </Link>
                <Link href={`/prive`} title={"Settings"}>
                  Settings
                </Link>
                <Link href={"/vault/collections/posts"} title="Your Posts">
                  Your Posts
                </Link>

                <Separator />
                <Button
                  onClick={async (e) => {
                    e.preventDefault();
                    await fetch("/api/users/logout", {
                      method: "POST",
                      headers: {
                        "content-type": "application/json"
                      }
                    });
                    location.reload();
                  }}
                  title="Logout"
                >
                  Sign Out
                </Button>
              </div>
            </Popover.Popup>
          </Popover.Positioner>
        </Popover.Portal>
      </Popover.Root>
    </m.div>
  );
}
