"use client";
import {
  LinkedCommandItem,
  LinkedItem
} from "@/components/UX/CommandKey/Commando";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  Command as Commands
} from "@/components/ui/command";
import { DialogTitle } from "@/components/ui/dialog";
import { useCursorStore, useRPStore, useSearchBar } from "@/providers/RP_Pro";
import "@/styles/__searchBar.scss";
import { Command, Command as CommandPrimitive } from "cmdk";
import {
  ComponentPropsWithoutRef,
  ComponentPropsWithRef,
  ReactNode,
  RefObject,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState
} from "react";

import { SvgIco } from "@/components/UX/svgIco";
import { RPTooltip } from "@/components/UX/tooltip";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useIsMobile } from "@/providers/MiddleMan";
import { useTheme } from "@/providers/Theme";

import {
  Popover,
  PopoverContent,
  PopoverTrigger
} from "@/components/ui/popover";
import { useRPSession } from "@/lib/auth/session/RP_SessionProvider";
import { useDebounce } from "@/utilities/useDebounce";
import {
  LockOpen2Icon as LockOpen2,
  ReaderIcon,
  RocketIcon
} from "@radix-ui/react-icons";
import { CreditCard, Settings, User } from "lucide-react";
import { nanoid } from "nanoid";
import { useTransitionRouter } from "next-transition-router";
import type { CollectionSlug } from "payload";

export const SearchBar = (props: ComponentPropsWithRef<"button">) => {
  const { ref: toggle, ...rest } = props;
  const navIsOpen = useRPStore((store) => store.navIsOpen);
  const subMenuOpen = useSearchBar((l) => l.subMenuOpen);

  const setValue = useSearchBar((l) => l.setValue);
  const value = useSearchBar((l) => l.value);
  const toggleTheme = useTheme((store) => store.toggleTheme);
  const theme = useTheme((store) => store.theme);
  const open = useSearchBar((l) => l.open);
  const setOpen = useSearchBar((l) => l.setOpen);
  const toggleOpen = useSearchBar((l) => l.toggleOpen);
  const inputRef = useRef<HTMLInputElement>(null!);
  const listRef = useRef<HTMLUListElement>(null!);
  const setNav = useRPStore((store) => store.setNavIsOpen);
  const user = useRPSession((l) => l);

  const [loading, setLoading] = useState<boolean>(false);
  const [items, setItems] = useState<
    {
      category: any[];
      createdAt: string;
      doc: { relationTo: string; value: string };
      id: string;
      meta: {
        description: string;
        image: {
          id: string;
          alt: string;
          caption: { [x: string]: any };
          filename: string;
          mimeType: string;
        };
        title: string;
      };
      slug: string;
      title: string;
      updatedAt: string;
    }[]
  >([]);
  const [init, setInit] = useState(true);
  const debouncedValue = useDebounce(value);
  useEffect(() => {
    async function load() {
      if (open && debouncedValue.length > 0) {
        setLoading(true);
        setInit(false);
        const ite = await fetch(
          "/api/search/?q=" + encodeURIComponent(debouncedValue),
          {
            method: "GET"
          }
        );
        if (ite.ok) {
          const a = await ite.json();
          if (a.docs && a.docs.length > 0) {
            setItems(a.docs.map((doc) => doc));
          } else {
            setItems([]);
          }
        } else {
          setItems([]);
        }
        setLoading(false);
      } else {
        setItems([]);
        setInit(true);
        setLoading(false);
      }
    }

    load();
  }, [debouncedValue, open]);

  const handleClick = useCallback(() => {
    toggleOpen();
  }, [toggleOpen]);
  useEffect(() => {
    if (open) {
      setNav(false);
      inputRef?.current?.focus();
    }
  }, [open, setNav]);

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey) {
        switch (e.key) {
          case "k":
            return (e.preventDefault(), toggleOpen());
          case "h":
            return (e.preventDefault(), toggleTheme());
        }
      }
    };
    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, [toggleOpen, toggleTheme]);
  useEffect(() => {
    const ddd = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        return (e.preventDefault(), setOpen(false));
      }
      if (e.metaKey || e.ctrlKey) {
        switch (e.key) {
          case "a":
            return (
              e.preventDefault(),
              inputRef?.current?.focus(),
              inputRef?.current?.select()
            );
        }
      }
    };
    if (open) {
      document.addEventListener("keydown", ddd);
    } else {
      setItems([]);
      setValue("");
      document.removeEventListener("keydown", ddd);
    }
  }, [open, setOpen, setValue]);
  return (
    <>
      <Button
        type="button"
        ref={toggle}
        className={cn("rp_btn bt_sm has-tooltip gap-x-1", {
          hover: navIsOpen
        })}
        style={{
          paddingLeft: "12px",
          paddingRight: "12px"
        }}
        onClick={handleClick}
        data-themed={"color,background-color,fill"}
        aria-controls="h-dropdown"
        aria-label="Toggle Menu"
      >
        <SvgIco
          viewBox="0 0 24 24"
          fill="currentColor"
          data-themed={"fill"}
          width="10"
          height="10"
          paths={[
            "M17.908 14.755c3.918 0 6.092 1.654 6.092 4.745 0 2.755-1.745 4.5-4.5 4.5-3.092 0-4.745-2.173-4.745-6.092v-1.806h-5.51v1.806C9.245 21.826 7.592 24 4.5 24 1.745 24 0 22.255 0 19.5c0-3.092 2.173-4.745 6.092-4.745h1.806v-5.51H6.092C2.173 9.245 0 7.592 0 4.5 0 1.745 1.745 0 4.5 0c3.092 0 4.745 2.173 4.745 6.092v1.806h5.51V6.092C14.755 2.174 16.408 0 19.5 0 22.255 0 24 1.745 24 4.5c0 3.092-2.173 4.745-6.092 4.745h-1.806v5.51zM7.898 7.898V6.092c0-3.215-1.132-4.745-3.398-4.745-2.02 0-3.153 1.133-3.153 3.153 0 2.265 1.531 3.398 4.745 3.398zm0 8.204H6.092c-3.214 0-4.745 1.132-4.745 3.398 0 2.021 1.133 3.153 3.153 3.153 2.265 0 3.398-1.531 3.398-4.745zm1.347-1.347h5.51v-5.51h-5.51zm6.857-6.857h1.806c3.214 0 4.745-1.132 4.745-3.398 0-2.02-1.132-3.153-3.153-3.153-2.265 0-3.398 1.531-3.398 4.745zM22.653 19.5c0-2.265-1.531-3.398-4.745-3.398h-1.806v1.806c0 3.215 1.133 4.745 3.398 4.745 2.02 0 3.153-1.132 3.153-3.153",
            {
              "data-themed": "fill"
            }
          ]}
        />
        <RPTooltip className="top" label={"⌘ + K"} />
      </Button>
      <CommandDialog open={open} onOpenChange={setOpen} key={"commando-dialog"}>
        <DialogTitle></DialogTitle>
        <div
          className={cn(
            "relative z-1 flex w-full items-center p-[8px]",
            loading
          )}
          cmdk-rp-courier={""}
          data-slot="command-input-wrapper"
        >
          <CommandPrimitive.Input
            data-slot="command-input"
            ref={inputRef}
            className={
              "flex h-[32px] w-full rounded-md bg-transparent py-3 text-sm outline-hidden disabled:opacity-50"
            }
            data-themed={"color, background-color"}
            onValueChange={(value) => {
              setValue(value);
              if (value.length < 1) {
                setItems([]);
              }
            }}
            placeholder="Search for anything (we have)..."
          />
        </div>
        <CommandList>
          {value.length > 0 && (
            <CommandGroup heading="Search Results">
              {items.map((doc) => (
                <LinkedItem
                  content={null!}
                  key={doc.id + "command_doc"}
                  {...{
                    ...doc,
                    doc: {
                      relationTo: doc.doc.relationTo as Extract<
                        CollectionSlug,
                        | "tags"
                        | "categories"
                        | "users"
                        | "articles"
                        | "delta"
                        | "posts"
                        | "pages"
                      >,
                      value: doc.doc.value as string
                    }
                  }}
                ></LinkedItem>
              ))}
              {!loading && items.length === 0 && (
                <CommandEmpty>Nothing found :(</CommandEmpty>
              )}
            </CommandGroup>
          )}
          {value.length < 1 && (
            <CommandGroup heading={"Suggestions"}>
              <LinkedCommandItem
                value="posts"
                href="/essays"
                title="Latest Posts"
              >
                <ReaderIcon />
              </LinkedCommandItem>
              <LinkedCommandItem
                value="theteam"
                href="/the-team"
                title="The Team"
              >
                <RocketIcon />
              </LinkedCommandItem>
            </CommandGroup>
          )}
          {value.length < 1 &&
            ((user && (
              <CommandGroup heading="Settings">
                <LinkedCommandItem
                  value="profile"
                  href={`/@${user.slug}`}
                  title="Profile"
                >
                  <User />
                </LinkedCommandItem>
                <LinkedCommandItem
                  value="settings"
                  href={`/vault/account`}
                  title="Settings"
                >
                  <Settings />
                </LinkedCommandItem>
              </CommandGroup>
            )) || (
              <CommandGroup heading="Quick Links">
                <LinkedCommandItem
                  value="sign-up"
                  href={`/register`}
                  title="Register"
                >
                  <LockOpen2 />
                </LinkedCommandItem>
                <LinkedCommandItem value="plans" href={`/plans`} title="Plans">
                  <CreditCard />
                </LinkedCommandItem>
              </CommandGroup>
            ))}
        </CommandList>
        <div
          cmdk-raycast-footer=""
          className="absolute right-0 bottom-0 left-0 z-[56] flex w-full items-center gap-[4px] bg-[oklch(var(--faded-bg)/.3)] p-[8px]"
        >
          <SubCommand
            data-themed={"color, background-color"}
            inputRef={inputRef}
            listRef={listRef}
          />
          <CommandItem
            value={"switch theme"}
            cmdk-action-trigger=""
            data-themed={"color, background-color"}
            onClick={toggleTheme}
            onSelect={toggleTheme}
          >
            To {theme === "light" ? "Dark" : "Light"} Mode
            <kbd>⌘</kbd>
            <kbd>H</kbd>
          </CommandItem>
        </div>
      </CommandDialog>
    </>
  );
};

function SubCommand({
  inputRef,
  listRef
}: {
  inputRef: RefObject<HTMLInputElement | null>;
  listRef: RefObject<HTMLElement | null>;
}) {
  const toggleSubMenuOpen = useSearchBar((l) => l.toggleSubMenuOpen);
  const subMenuOpen = useSearchBar((l) => l.subMenuOpen);
  const value = useSearchBar((l) => l.value);
  const setValue = useSearchBar((l) => l.setValue);
  const toggleTheme = useTheme((store) => store.toggleTheme);
  const { isMobile } = useIsMobile();
  const setCur = useCursorStore((l) => l.setCursorState);
  const focusCur = () => {
    !isMobile && setCur("FOCUS");
  };
  const nullCur = () => {
    !isMobile && setCur(null);
  };
  useEffect(() => {
    function listener(e: KeyboardEvent) {
      if (e.key === "i" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        toggleSubMenuOpen();
      }
    }

    document.addEventListener("keydown", listener);

    return () => {
      document.removeEventListener("keydown", listener);
    };
  }, [toggleSubMenuOpen]);

  useEffect(() => {
    if (!listRef.current) return;
    const el = listRef.current;

    if (subMenuOpen) {
      el.style.overflow = "hidden";
    } else {
      el.style.overflow = "";
    }
  }, [subMenuOpen, listRef]);
  const user = useRPSession((l) => l);
  const kv = useMemo(() => {
    return {
      b: `CV${nanoid()}`,
      u: `Find${nanoid()}`,
      a: `Login${nanoid()}`
    };
  }, []);
  const keys = Object.keys(kv) as (keyof typeof kv)[];
  useEffect(() => {
    const dispatcher = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey) {
        for (const key of keys) {
          if (e.key === key) {
            e.preventDefault();
            setValue(kv[key]);
          }
        }
      }
    };
    document.addEventListener("keydown", dispatcher, { capture: true });
    return () => {
      document.removeEventListener("keydown", dispatcher, { capture: true });
    };
  }, [keys, kv, setValue]);
  return (
    <Popover open={subMenuOpen} onOpenChange={toggleSubMenuOpen} modal>
      <PopoverTrigger
        cmdk-raycast-subcommand-trigger=""
        onClick={() => setValue("actions")}
        aria-expanded={subMenuOpen}
        value={"actions"}
        onSelect={toggleSubMenuOpen}
        data-themed={"color, background-color"}
        onMouseEnter={focusCur}
        onMouseLeave={nullCur}
      >
        Actions
        <kbd>⌘</kbd>
        <kbd>I</kbd>
      </PopoverTrigger>
      <PopoverContent
        side="top"
        align="start"
        className="commando-submenu z-[250] w-fit border-none bg-transparent p-0 shadow-none backdrop-blur-none outline-none"
        sideOffset={15}
        alignOffset={0}
        onCloseAutoFocus={(e) => {
          e.preventDefault();
          inputRef?.current?.focus();
        }}
      >
        <Commands>
          <CommandList>
            <CommandGroup
              heading={"Commands"}
              data-state={subMenuOpen ? "open" : "closed"}
            >
              {user && (
                <>
                  <SubItem link="/me" shortcut="⌘ B">
                    My Profile
                  </SubItem>
                  <SubItem link={`/users/@${user.slug}/cv`} shortcut="⌘ U">
                    My CV
                  </SubItem>
                  <SubItem
                    link={`/users/@${user.slug}/settings`}
                    shortcut="⌘ A"
                  >
                    Settings
                  </SubItem>
                </>
              )}
            </CommandGroup>
          </CommandList>
          <CommandInput
            cmdk-input=""
            placeholder="Search for actions..."
            className="text-[oklch(var(--off-fg)/1)] placeholder:text-[oklch(var(--faded-fg)/1)]"
          />
        </Commands>
      </PopoverContent>
    </Popover>
  );
}

function SubItem({
  children,
  shortcut,
  link,
  ...props
}: {
  children: ReactNode;
  shortcut: string;
  link?: string;
} & ComponentPropsWithoutRef<typeof Command.Item>) {
  if (link) {
    return (
      <LinkedSubItem shortcut={shortcut} link={link} {...props}>
        {children}
      </LinkedSubItem>
    );
  }

  return (
    <CommandItem {...props}>
      {children}
      <div cmdk-raycast-submenu-shortcuts="">
        {shortcut.split(" ").map((key) => {
          return <kbd key={key}>{key}</kbd>;
        })}
      </div>
    </CommandItem>
  );
}

const LinkedSubItem = (
  props: {
    children: ReactNode;
    shortcut: string;
    link: string;
  } & ComponentPropsWithoutRef<typeof Command.Item>
) => {
  const { link, shortcut, children, ...rest } = props;
  const href = link;
  const router = useTransitionRouter();
  const selectCallback = useCallback(() => router.push(href), [href, router]);

  return (
    <CommandItem value={href} onSelect={selectCallback} {...rest}>
      {children}
      <div cmdk-raycast-submenu-shortcuts="">
        {shortcut.split(" ").map((key) => {
          return <kbd key={key}>{key}</kbd>;
        })}
      </div>
    </CommandItem>
  );
};
