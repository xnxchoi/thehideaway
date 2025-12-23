"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "./UX/Button";
import {
  Command,
  CommandGroup,
  CommandItem,
  CommandList,
  CommandSeparator
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger
} from "@/components/ui/popover";
import { authClient } from "@/lib/auth/client";
import { useBetterAuth } from "@/lib/auth/context";
import { ChevronDown, PlusCircle } from "lucide-react";
import { useTransitionRouter } from "next-transition-router";
import { use, useState } from "react";
import { User } from "@/payload-types";

export default function AccountSwitcher() {
  const { currentUserPromise, deviceSessionsPromise } = useBetterAuth();
  const currentUser = use(currentUserPromise) as
    | (User & { collection: "users" })
    | null;
  const deviceSessions = use(deviceSessionsPromise);
  const [open, setOpen] = useState(false);
  const router = useTransitionRouter();

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          data-expanded={open}
          role="combobox"
          aria-expanded={open}
          aria-label="Select a user"
          className="outline-groove group flex w-[250px] items-center justify-between rounded-[12px] px-4 font-sans text-foreground shadow-sm/25 outline-1 transition-colors duration-200 ease-out-power3 hover:bg-muted-faded-foreground/10 dark:shadow-md/30"
          style={{
	          outlineColor: "oklch(from var(--muted-faded-fg) l c h/.3)"
          }}
        >
          <div className="flex items-center gap-2 px-1 py-1.5">
            {open ? "Accounts " : "Currently :"}{" "}
            <Avatar className="mr-2 h-6 w-6">
              <AvatarImage
                src={currentUser?.image || ""}
                alt={currentUser?.name ?? ""}
              />
              <AvatarFallback>{currentUser?.name?.charAt(0)}</AvatarFallback>
            </Avatar>
            <span className="truncate font-medium">{currentUser?.name}</span>
          </div>
          <div className="transition-transform duration-200 ease-out-power3 group-data-[expanded=true]:rotate-180">
            <ChevronDown className="ml-auto h-4 w-4 shrink-0 opacity-50" />
          </div>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="z-[150] w-[250px] border border-border bg-button-background-inverted p-0 font-sans text-foreground shadow-md backdrop-blur-[4px]">
        <Command>
          <CommandList>
            <CommandGroup
              heading="Current Account"
              className={"[&_[cmdk-group-heading]]:text-foreground!"}
            >
              <CommandItem
                onSelect={() => {
                  setOpen(false);
                }}
                className="w-full justify-between hover:bg-accent/50"
                key={`current-account-${currentUser?.id}`}
              >
                <div className="flex items-center">
                  <Avatar className="mr-2 h-5 w-5">
                    <AvatarImage
                      src={currentUser?.image || ""}
                      alt={currentUser?.name ?? ""}
                    />
                    <AvatarFallback className="bg-foreground/10">
                      {currentUser?.name?.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  <span className="font-medium text-foreground/80">
                    {currentUser?.name}
                  </span>
                </div>
              </CommandItem>
            </CommandGroup>
	          <CommandSeparator className={"bg-nav-foreground/30!"}/>
            <CommandGroup
              className={"[&_[cmdk-group-heading]]:text-foreground!"}
              heading="Switch Account"
            >
              {deviceSessions &&
                deviceSessions
                  .filter((session) => session.userId !== currentUser?.id)
                  .map((userSession, index) => (
                    <CommandItem
                      key={index}
                      onSelect={async () => {
                        await authClient.multiSession.setActive({
                          sessionToken: userSession.token
                        });
                        setOpen(false);
                      }}
                      className="transition-colors duration-200 hover:bg-accent hover:text-rouge-400"
                    >
                      <Avatar className="mr-2 h-5 w-5">
                        <AvatarImage src={""} alt={userSession.userId} />
                        <AvatarFallback className="bg-secondary/20">
                          {userSession.userId.charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex w-full flex-col">
                        <span className="">{userSession.userId}</span>
                        <span className="truncate">{userSession.userId}</span>
                      </div>
                    </CommandItem>
                  ))}
            </CommandGroup>
          </CommandList>
	        <CommandSeparator className={"bg-nav-button-foreground/30!"}/>
          <CommandList>
            <CommandGroup>
              <CommandItem
                onSelect={() => {
                  setOpen(false);
                  router.push("/sign-in");
                }}
                className="group transition-colors duration-200 hover:bg-rouge-400 hover:text-rouge-400"
              >
                <PlusCircle className="mr-2 h-5 w-5 text-foreground transition-colors duration-200 group-hover:text-rouge-500/80" />
                <span className="font-medium text-foreground transition-colors duration-200 group-hover:text-rouge-500/80">
                  Add Account
                </span>
              </CommandItem>
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
