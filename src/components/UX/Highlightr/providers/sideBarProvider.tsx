"use client";
import { useDomCursor } from "@/components/core/cursorWrapper";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button as UIBtn } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  DialogRoot,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from "@/components/ui/dialog";
import { GradientSeparator } from "@/components/ui/separator";
import { errorToast, successToast } from "@/components/ui/sonner";
import { Textarea } from "@/components/ui/textarea";
import {
  HighlightMenuButton,
  MenuButtonCaption
} from "@/components/UX/Highlightr/index";
import { useHighlighter } from "@/components/UX/Highlightr/providers/HighlighterProvider";
import { HighlightCreateError } from "@/components/UX/Highlightr/HighlightErrors";
import { HighlightPalette } from "@/components/UX/Highlightr/stores";
import type { HighlightedRange } from "@/components/UX/Highlightr/types";
import { Link } from "@/components/core/Link/Link";
import { AuthorOverview } from "@/types/collections/users";
import { Button } from "../../../core/Button";
import { useCharacterLimit } from "@/hooks/use-character-limit";
import { AuthUIContext, socialProviders } from "@/lib/auth/betterauth-ui/src";
import { ProviderButton } from "@/lib/auth/betterauth-ui/src/components/auth/provider-button";
import { useRPSession } from "@/lib/auth/session/RP_SessionProvider";
import { cn } from "@/lib/utils";
import { useCursor } from "@/providers/RP_Pro";
import { delay } from "@/utilities/rp_utils";
import type { RequiredAndNonNullable } from "@/utilities/typeUtilities";
import { useQueryClient } from "@tanstack/react-query";
import { Power2 } from "gsap";
import { useLenis } from "lenis/react";
import { DateTime } from "luxon";
import { AnimatePresence } from "motion/react";
import * as m from "motion/react-m";
import { useLocale, useTranslations } from "next-intl";
import { useTransitionRouter } from "next-transition-router";
import {
  ChangeEventHandler,
  ComponentProps,
  ComponentPropsWithoutRef,
  createContext,
  CSSProperties,
  MouseEventHandler,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState
} from "react";
import { toast } from "sonner";
import { Drawer } from "vaul";
import { useShallow } from "zustand/shallow";
import { useRanger } from "./RangerProvider";
import { useArticle } from "./ArticleProvider";
import { useCitations } from "./CitationProvider";
export interface HighlightSidebarProps {
  open: boolean;
  setOpen: (open: boolean) => void;
  toggle: () => void;
  setContent: (content: Omit<ResponseNode, "top"> | null) => void;
  content: Omit<ResponseNode, "top"> | null;
  writing: boolean;
  setWriting: (writing: boolean) => void;
}

const HighlightSidebarContext = createContext<HighlightSidebarProps>({
  open: false,
  setOpen: () => {},
  toggle: () => {},
  setContent: (_) => {},
  content: null,
  writing: false,
  setWriting: (_) => {}
});
export const UserBar = ({ user }: { user: AuthorOverview }) => {
  return (
    <div className={"flex justify-between"}>
      <div className={"flex items-center"}>
        <div>
          <div className={"inline-block"}>
            <div className={"outline-none"} tabIndex={-1}>
              <Link href={`/@${user.slug}`}>
                <div className={"relative block"}>
                  <Avatar>
                    {(user.image && (
                      <AvatarImage height={32} width={32} src={user.image} />
                    )) || (
                      <AvatarFallback className={"uppercase"}>
                        {user.name.at(0)}
                        {user.name.at(1)}
                      </AvatarFallback>
                    )}
                  </Avatar>
                </div>
              </Link>
            </div>
          </div>
        </div>
        <div className={"block pl-[12px]"}>
          <div className={"flex items-center"}>
            <div className={"inline-block"}>
              <div className={"outline-none"} tabIndex={-1}>
                <Link href={`/@${user.slug}`}>
                  <div className={"flex items-baseline"}>
                    <p className={"break-all"}>{user.name}</p>
                  </div>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
const CitationView = ({
  createdAt,
  updatedAt,
  author,
  quote,
  memo,
  reference,
  ...rest
}: Omit<ResponseNode, "top">) => {
  const uDate = DateTime.fromISO(updatedAt);
  const cDate = DateTime.fromISO(createdAt);
  const updateValid = uDate.isValid;
  const userImage = useRPSession(useShallow((r) => r.image));
  const userName = useRPSession(useShallow((r) => r.name));
  const userSlug = useRPSession(useShallow((r) => r.slug));
  const userId = useRPSession(useShallow((r) => r.id as string | null));
  let isEdited = false;
  if (updateValid) {
    isEdited = uDate.diff(cDate).as("hours") > 0;
  }
  const creater = useCitations((r) => r.create);

  const finalDate = updateValid ? (uDate as DateTime<true>) : cDate;
  const locale = useLocale();
  return (
    <div className={"flex flex-col"}>
      <FocusedCitation
        citation={{
          author,
          quote,
          memo,
          reference
        }}
        {...rest}
      />
      <div
        className={
          "mx-[24px] my-0 border-b-[1px] border-muted-foreground/20 pt-[24px]"
        }
      >
        <div>
          <div className={"text-[14px] leading-[20px]"}>
            <div className={"leading-[20px]"}>
              {userId && (
                <div className={"mb-[20px] block"}>
                  <div className={"mb-[12px] flex items-center"}>
                    <div className={"flex justify-between"}>
                      <div className={"flex items-center"}>
                        <div>
                          <div className={"inline-block"}>
                            <div className={"outline-none"} tabIndex={-1}>
                              <Link href={`/@${userSlug}`}>
                                <div className={"relative block"}>
                                  <Avatar>
                                    {(userImage && (
                                      <AvatarImage
                                        height={32}
                                        width={32}
                                        src={userImage}
                                      />
                                    )) || (
                                      <AvatarFallback className={"uppercase"}>
                                        {userName.at(0)}
                                        {userName.at(1)}
                                      </AvatarFallback>
                                    )}
                                  </Avatar>
                                </div>
                              </Link>
                            </div>
                          </div>
                        </div>
                        <div className={"block pl-[12px]"}>
                          <div className={"flex items-center"}>
                            <div className={"inline-block"}>
                              <div className={"outline-none"} tabIndex={-1}>
                                <Link href={`/@${userSlug}`}>
                                  <div className={"flex items-baseline"}>
                                    <p className={"break-all"}>{userName}</p>
                                  </div>
                                </Link>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  <MemoInputField />
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      <div className={"block"}>
        <div className={"block"}>
          <div className={"border-b-none mx-[24px] block"}>
            <ResponseItem
              author={author}
              updatedAt={finalDate.setLocale(locale).toRelative()!}
              memo={memo}
              isEdited={isEdited}
            />
          </div>
        </div>
      </div>
    </div>
  );
};
const ResponseItem = ({
  author,
  updatedAt,
  memo,
  isEdited
}: {
  author: AuthorOverview;
  updatedAt: string;
  memo: string;
  isEdited?: boolean;
}) => {
  const locale = useLocale();
  return (
    <div>
      <div className={"h-full w-full"}>
        <div className={"block pt-[25px] pb-[16px]"}>
          <div className={"flex justify-between"}>
            <div className={"flex items-center"}>
              <div>
                <div className={"inline-block"}>
                  <div className={"outline-none"} tabIndex={-1}>
                    <Link href={`/@${author.slug}`}>
                      <div className={"relative block"}>
                        <Avatar>
                          {(author.image && (
                            <AvatarImage
                              height={32}
                              width={32}
                              src={author.image}
                            />
                          )) || (
                            <AvatarFallback className={"uppercase"}>
                              {author.name.at(0)}
                              {author.name.at(1)}
                            </AvatarFallback>
                          )}
                        </Avatar>
                      </div>
                    </Link>
                  </div>
                </div>
              </div>
              <div className={"block pl-[12px]"}>
                <div className={"flex items-center"}>
                  <div className={"inline-block"}>
                    <div className={"outline-none"}>
                      <Link href={`/@${author.slug}`}>
                        <div className={"flex items-baseline"}>
                          <p className={"break-all"}>{author.name}</p>
                        </div>
                      </Link>
                    </div>
                  </div>
                </div>
                <div>
                  <span>
                    {}
                    {isEdited && (
                      <>&nbsp;{locale === "ko" ? "(수정)" : "(edited)"}</>
                    )}
                  </span>
                </div>
              </div>
            </div>
          </div>
          <div className={"break-word mt-[5px] block"}>
            <p className={"font-suit text-base"}>{memo}</p>
          </div>
        </div>
      </div>
    </div>
  );
};
const MemoInputField = () => {
  const user = useRPSession(useShallow((r) => r.id as string | null));
  const memoVal = useRef(" ");
  const writing = useHighlightSidebar("writing");
  const setIsWriting = useHighlightSidebar("setWriting");
  const [value, setValue] = useState("");
  const setCursorState = useCursor((r) => r.setCursorState);
  const cInputWrapperRef = useRef<HTMLDivElement>(null!);
  const targetContainer = useHighlighter(useShallow((r) => r.targetContainer));
  const focusedHighlight = useHighlighter(
    useShallow((r) => r.focusedHighlight)
  );
  const fc = useRef(focusedHighlight);
  useEffect(() => {
    fc.current = focusedHighlight;
  }, [focusedHighlight]);
  const commentInputRef = useRef<HTMLTextAreaElement>(null!);
  const [saving, setSaving] = useState(false);
  useEffect(() => {
    if (saving) {
      memoVal.current = value;
    }
  }, [value, saving]);
  const creater = useCitations((r) => r.create);
  useEffect(() => {
    const ci = cInputWrapperRef.current;
    const input = commentInputRef.current;
    if (ci) {
      if (writing) {
        input && input.focus();
      }
    }
  }, [writing]);
  const [disabled, setDisabled] = useState(value.length === 0);
  useEffect(() => {
    setDisabled(value.length === 0);
  }, [value]);
  const { onMouseEnter, onMouseLeave } = useDomCursor({});
  const setWritinge = useCallback(
    (e: { stopPropagation: () => void; preventDefault: () => void }) => {
      e.stopPropagation();
      e.preventDefault();
      setIsWriting(true);
    },
    [setIsWriting]
  );
  useEffect(() => {
    const ci = cInputWrapperRef.current;
    const input = commentInputRef.current;
    if (ci) {
      if (writing) {
        input && input.focus();
      }
    }
  }, [writing]);
  return (
    <div
      className={
        "group flex flex-col rounded-[6px] bg-muted-faded-background/50 pb-0 transition-[background-color,padding-bottom] duration-400 ease-in-out-2"
      }
      data-active={writing}
    >
      <div className={"relative flex flex-col"}>
        {user ? (
          <AnimatePresence>
            <m.div
              ref={cInputWrapperRef}
              variants={{
                true: {
                  minHeight: "100px",
                  paddingTop: "12px",
                  paddingBottom: "12px"
                },
                false: {
                  minHeight: "15px",
                  paddingTop: "8px",
                  paddingBottom: "8px"
                }
              }}
              initial={`${writing}`}
              animate={`${writing}`}
              transition={{
                duration: 0.4,
                ease: Power2.easeIn
              }}
              className={"flex flex-col justify-between px-[12px] py-[8px]"}
            >
              {(writing && (
                <>
                  <textarea
                    data-slot="textarea"
                    className={cn(
                      "flex field-sizing-content min-h-16 w-full rounded-md border border-input bg-transparent px-3 py-2 text-base shadow-xs transition-[color,box-shadow] outline-none placeholder:text-muted-foreground focus-visible:border-none focus-visible:ring-[0px] focus-visible:ring-ring/0 disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40",
                      "relative field-sizing-content min-h-[24px] w-full resize-none whitespace-nowrap"
                    )}
                    ref={commentInputRef}
                    value={value}
                    onChange={(e) => setValue(e.target.value)}
                    style={{
                      overflowWrap: "break-word"
                    }}
                  />
                  <div
                    className={
                      "ml-[10px] flex max-h-[100px] items-center justify-between gap-4 opacity-100 transition-[opacity] duration-400 ease-in-out-2"
                    }
                  >
                    <div></div>
                    <div
                      className={
                        "flex max-h-[100px] gap-6 self-end px-[8px] py-0"
                      }
                    >
                      <Button
                        className={"text-xs"}
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          setCursorState(null);
                          setIsWriting(false);
                          setValue("");
                        }}
                      >
                        Cancel
                      </Button>
                      <Button
                        className={cn(
                          "disabled:fg-muted-background rounded-[20px] px-[8px] py-[4px] text-base transition-colors duration-400 ease-in-out-2 disabled:bg-muted-foreground",
                          saving
                            ? "pointer-events-none animate-pulse"
                            : "pointer-events-auto"
                        )}
                        disabled={disabled}
                        onClick={async (e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          setCursorState(null);
                          setSaving(true);
                          const mamu = memoVal.current;
                          try {
                            if (!mamu) {
                              throw new HighlightCreateError(
                                "params",
                                "invalid"
                              );
                            } else if (mamu.length < 1) {
                              throw new HighlightCreateError("memo", "empty");
                            }
                            const y = await creater({
                              params: { memo: memoVal.current, private: false },
                              container: targetContainer.current
                            });
                            if (!y)
                              throw new HighlightCreateError(
                                "unknown",
                                "unknown"
                              );
                            setSaving(false);
                            setValue("");
                            setCursorState(null);
                          } catch (e) {
                            if (e instanceof HighlightCreateError) {
                            }
                          }
                        }}
                        style={{
                          opacity: disabled ? "0.5" : "1",
                          color: disabled
                            ? "var(--muted-faded-background)"
                            : "var(--faded-background)",
                          backgroundColor: disabled
                            ? "var(--muted-faded-foreground)"
                            : "var(--faded-foreground)"
                        }}
                      >
                        Respond
                      </Button>
                    </div>
                  </div>
                </>
              )) || (
                <div
                  className={"h-full w-full"}
                  onMouseLeave={onMouseLeave}
                  onMouseEnter={onMouseEnter}
                  onClick={setWritinge}
                >
                  <span className={"text-base text-muted-foreground"}>
                    Share your thoughts here...
                  </span>
                </div>
              )}
            </m.div>
          </AnimatePresence>
        ) : (
          <SignInTriggerButton />
        )}
      </div>
    </div>
  );
};
export const SideBarProvider = ({ children }: { children: ReactNode }) => {
  const [open, setOpen] = useState(false);
  const lenis = useLenis();
  const [content, setContent] = useState<Omit<ResponseNode, "top"> | null>(
    null
  );
  const [writing, setWriting] = useState(false);
  useEffect(() => {
    lenis && lenis[open ? "stop" : "start"]();
  }, [open, lenis]);
  const currentColor = useHighlighter(useShallow((r) => r.currentColor));
  useEffect(() => {
    if (!open) {
      setContent(null);
    }
  }, [open]);
  return (
    <HighlightSidebarContext.Provider
      value={{
        writing,
        setWriting,
        open,
        setOpen,
        toggle: () => setOpen((o) => !o),
        setContent,
        content
      }}
    >
      {children}
      <Drawer.Root
        open={open}
        onOpenChange={setOpen}
        defaultOpen={false}
        autoFocus={true}
        direction={"right"}
      >
        <Drawer.Portal>
          <Drawer.Overlay className="fixed inset-0 z-[249] bg-black/40" />
          <Drawer.Content
            className="fixed top-2 right-2 bottom-2 z-[250] flex w-[400px] flex-col gap-4 bg-background p-4"
            style={
              {
                "--initial-transform": "calc(100% + 8px)",
                "--currentHighlight": HighlightPalette[currentColor]
              } as CSSProperties
            }
          >
            <Drawer.Title className="px-5 py-3 text-lg font-semibold">
              Response
            </Drawer.Title>
            <Drawer.Description className="hidden text-sm text-muted-foreground">
              Response.
            </Drawer.Description>
            {content && <CitationView {...content} />}
          </Drawer.Content>
        </Drawer.Portal>
      </Drawer.Root>
    </HighlightSidebarContext.Provider>
  );
};
const FocusedCitation = ({
  citation
}: {
  citation: Partial<HighlightedRange> & {
    quote: string;
    author: AuthorOverview;
    reference: string;
  };
}) => {
  return (
    <div className={"block p-[6px_10px_24px]"}>
      <div
        className={
          "m-[10px_14px_0px] rounded-[3px] bg-background px-[16px] py-[20px] shadow-lg"
        }
      >
        <p
          className={
            "mt-[-0.44em] mb-[-0.46em] text-[18px] leading-[28px] font-medium text-foreground"
          }
        >
          <span className={"highlighted"}>{citation.quote}</span>
        </p>
      </div>
    </div>
  );
};
export const useHighlightSidebar = <T extends keyof HighlightSidebarProps>(
  selector: T
): HighlightSidebarProps[T] => {
  const context = useContext(HighlightSidebarContext);
  if (!context)
    throw new Error(
      "useHighlightSidebar must be used within a HighlightSidebarProvider"
    );
  return context[selector];
};
type ResponseNode = {
  top: number;
} & RequiredAndNonNullable<
  Pick<
    HighlightedRange,
    "reference" | "memo" | "quote" | "author" | "updatedAt" | "createdAt"
  >
>;
export const SignInCard = (
  props: ComponentPropsWithoutRef<"div"> & {
    onSignInClick: MouseEventHandler<HTMLButtonElement>;
  }
) => {
  const { onSignInClick, ...rest } = props;
  const { localization, social } = useContext(AuthUIContext);
  //   const providers = social?.providers;
  const [isSubmitting, setIsSubmitting] = useState(false);
  const t = useTranslations("UI.SignIn");
  useEffect(() => {
    const handlePageHide = () => {
      setIsSubmitting(false);
    };

    window.addEventListener("pagehide", handlePageHide);

    return () => {
      setIsSubmitting(false);
      window.removeEventListener("pagehide", handlePageHide);
    };
  }, []);
  const router = useTransitionRouter();
  const onClick: MouseEventHandler<HTMLButtonElement> = useCallback(
    (e) => {
      e.preventDefault();
      if ((e.target as HTMLButtonElement).disabled) return;
      setIsSubmitting(true);
      delay(50).then(async () => {
        await delay(50).then(() => {
          router.push("/sign-in");
        });
        onSignInClick(e);
      });
    },
    [onSignInClick, router]
  );
  const lyt =
    social?.providers && social.providers.length > 2
      ? "horizontal"
      : "vertical";

  return (
    <div className={cn("flex flex-col gap-9")}>
      <Card className="bg-faded-background/50">
        <CardContent className={cn("grid gap-9")}>
          <div className="grid gap-4">
            <div
              className={cn(
                "flex w-full items-center justify-between gap-4",
                lyt === "horizontal" ? "flex-wrap" : "flex-col"
              )}
            >
              {social?.providers?.map((provider) => {
                const socialProvider = socialProviders.find(
                  (socialProvider) => socialProvider.provider === provider
                );
                if (!socialProvider) return null;

                return (
                  <ProviderButton
                    key={provider}
                    isSubmitting={isSubmitting}
                    localization={localization}
                    provider={socialProvider}
                    setIsSubmitting={setIsSubmitting}
                    socialLayout={lyt}
                  />
                );
              })}
            </div>
            <GradientSeparator caption={t("separator")} />
            <UIBtn
              variant="outline"
              onClick={onClick}
              className="*:ease text-md ease border-faded-foreground/&.65)] inline-flex h-14 min-h-[35px] w-full items-center justify-center gap-[8px] rounded-md border bg-off-background/30 px-4 py-3 font-medium whitespace-nowrap text-foreground shadow-sm transition-colors duration-300 *:transition-colors *:duration-300 hover:bg-faded-background/65 hover:*:text-off-foreground focus-visible:ring-1 focus-visible:ring-ring focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-6 [&_svg]:shrink-0"
              disabled={isSubmitting}
            >
              <span className="">{t("providers")}</span>
            </UIBtn>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
const SignInTriggerButton = () => {
  const [isOpen, setOpen] = useState(false);
  return (
    <DialogRoot open={isOpen} onOpenChange={setOpen}>
      <DialogTrigger></DialogTrigger>
      <DialogContent onClick={(e) => e.stopPropagation()}>
        <DialogHeader>
          <DialogTitle>Check In</DialogTitle>
        </DialogHeader>
        <div className="grid gap-3">
          <SignInCard onSignInClick={() => {}} />
        </div>
      </DialogContent>
    </DialogRoot>
  );
};
export const MemoInput = (
  props: Omit<ComponentProps<"textarea">, "onChange"> & {
    onChange: (value: string) => void;
  }
) => {
  const { maxLength = 200, onChange, placeholder, disabled } = props;
  const id = useId();
  const {
    value,
    characterCount,
    handleChange,
    maxLength: limit
  } = useCharacterLimit({ maxLength, initialValue: `${props.value || ""}` });
  const oC: ChangeEventHandler<HTMLTextAreaElement> = useCallback(
    (e) => {
      handleChange(e);
    },
    [handleChange]
  );
  useEffect(() => {
    onChange(value);
  }, [onChange, value]);
  return (
    <div className={"*:not-first:mt-2"}>
      <Textarea
        placeholder={placeholder}
        className={"min-h-[120px]"}
        value={value}
        onChange={oC}
        maxLength={maxLength}
        id={id}
        disabled={disabled}
      />
      <p
        id="«r2q»-description"
        className="mt-2 text-right text-xs text-off-foreground"
        role="status"
        aria-live="polite"
      >
        <span className="tabular-nums">{characterCount}</span>/
        <span className={"tabular-nums"}>{limit}</span>
      </p>
    </div>
  );
};
export const MemoButton = ({
  className,
  documentHandler
}: {
  documentHandler: (e: Event) => void;
  className?: string;
}) => {
  const user = useRPSession((r) => r.id as string | null);
  const userRef = useRef(user);
  useEffect(() => {
    userRef.current = user;
  }, [user]);
  const savedSelectionRef = useRef<rangy.savedSelection | null>(null);
  const focusedHighlight = useHighlighter(
    useShallow((r) => r.focusedHighlight)
  );
  const fc = useRef(focusedHighlight);
  useEffect(() => {
    fc.current = focusedHighlight;
  }, [focusedHighlight]);
  const [open, setOpen] = useState(false);
  const postid = useArticle(useShallow((r) => r.id));
  const slug = useArticle(useShallow((r) => r.slug));
  const postref = useRef(postid);
  const slugref = useRef(slug);
  useEffect(() => {
    postref.current = postid;
  }, [postid]);
  useEffect(() => {
    slugref.current = slug;
  }, [slug]);
  const [view, setView] = useState<"memo" | "signin">(user ? "memo" : "signin");
  const createCallback = useCitations((c) => c.create);
  const saveCallback = useCitations((c) => c.update);
  const [memo, setMemo] = useState<string>(fc.current?.memo ?? "");
  const memoVal = useRef(memo);
  useEffect(() => {
    memoVal.current = memo;
  }, [memo]);
  const initialValue = useRef(memo);
  const qc = useQueryClient();
  const [saving, setSaving] = useState(false);
  const tg = useRanger((r) => r.targetContainer);
  const ctRef = useRef(tg);
  useEffect(() => {
    ctRef.current = tg;
  }, [tg]);
  const t = useTranslations();
  const ranger = useRanger((r) => r.ranger);
  useEffect(() => {
    if (open) {
      setView(user ? "memo" : "signin");
      setMemo(fc.current?.memo ?? "");
      document.body.removeEventListener("click", documentHandler);
    } else {
      setMemo("");
      document.body.addEventListener("click", documentHandler);
    }
  }, [open, user, documentHandler]);
  const [dirty, setDirty] = useState<boolean>(false);
  const setMemoValue = useCallback((e: string) => {
    if (initialValue.current !== e) {
      setDirty(true);
      initialValue.current = e;
    }
    setMemo(e);
  }, []);
  const onSave = useCallback(async () => {
    const mamu = memoVal.current;
    const userId = userRef.current;
    if (!userId) {
      setView("signin");
      toast(t("Highlights.error.save.signin"));
      return setSaving(false);
    }
    if (!mamu) {
      errorToast(t("Highlights.error.save.empty"));
      return setSaving(false);
    }
    if (mamu.trim().length === 0) {
      errorToast(t("Highlights.error.save.empty"));
      return setSaving(false);
    }

    const focus = fc.current;
    const container = ctRef.current;
    if (!container) return;
    if (!focus) {
      if (savedSelectionRef.current) {
        setSaving(true);
        ranger.restoreSelection(savedSelectionRef.current);
        ranger.removeMarkers(savedSelectionRef.current);
        savedSelectionRef.current = null;
        await createCallback({ params: { memo: mamu }, container }).then(
          (r) => {
            if (r) {
              successToast(t("Highlights.saved"));
            } else {
              errorToast(t("Highlights.error.save.select"));
            }
            qc.invalidateQueries({
              queryKey: [
                "savedHighlights",
                { value: postref.current, slug: slugref.current, userId }
              ]
            });
            setOpen(false);
            setDirty(false);
          }
        );
      }
      savedSelectionRef.current &&
        (ranger.removeMarkers(savedSelectionRef.current),
        (savedSelectionRef.current = null));
      setSaving(false);

      return;
    }
    try {
      setSaving(true);
      // const where: Where = {
      // 	reference: {equals: focusedHighlight.reference},
      // };
      const body = {
        ...focus,
        memo: mamu
      } satisfies HighlightedRange;
      await saveCallback(body);
      setOpen(false);
      qc.invalidateQueries({
        queryKey: [
          "savedHighlights",
          { value: postref.current, slug: slugref.current, userId }
        ]
      });
      successToast(t("Highlights.saved"));
    } catch (e) {
      console.log(e);
      errorToast(t("Highlights.error.save.default"));
    } finally {
      savedSelectionRef.current &&
        (ranger.removeMarkers(savedSelectionRef.current),
        (savedSelectionRef.current = null));
      setSaving(false);
    }
  }, [createCallback, qc, ranger, saveCallback, t]);

  const closeOnClick: MouseEventHandler<HTMLButtonElement> = useCallback(
    (e) => {
      e.stopPropagation();
      setOpen(true);
      setDirty(false);
    },
    [setOpen]
  );

  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    if (open) {
      savedSelectionRef.current = ranger.saveSelection();
      setIsOpen(true);
    } else {
      savedSelectionRef.current = null;
      setIsOpen(false);
    }
  }, [open, ranger]);
  return (
    <>
      <DialogRoot open={isOpen} onOpenChange={setOpen}>
        <DialogTrigger
          nativeButton={true}
          render={() => (
            <HighlightMenuButton className={className} onClick={closeOnClick}>
              {focusedHighlight && focusedHighlight.memo ? "Edit" : "Memo"}
              <MenuButtonCaption>
                <svg
                  width="8"
                  height="8"
                  viewBox="0 0 12 12"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path d="M2 2h8v8H2z" fill="currentColor" />
                  <path
                    d="M4 4h4v1H4zM4 6h4v1H4zM4 8h3v1H4z"
                    fill="var(--faded-bg)"
                  />
                </svg>
              </MenuButtonCaption>
            </HighlightMenuButton>
          )}
        />
        <DialogContent onClick={(e) => e.stopPropagation()}>
          <DialogHeader>
            <DialogTitle>{view === "memo" ? "Memo" : "Sign in"}</DialogTitle>
          </DialogHeader>
          {(view === "memo" && (
            <div className="grid gap-3">
              <MemoInput
                value={memo}
                onChange={setMemoValue}
                placeholder="Write a short note…"
                maxLength={200}
                className=""
              />
            </div>
          )) || (
            <div className="grid gap-3">
              <SignInCard onSignInClick={closeOnClick} />
            </div>
          )}
          <DialogFooter>
            <div className="ml-auto flex items-center gap-2">
              <Button className={"rp_btn"} onClick={closeOnClick}>
                {memo.length > 0 ? "Cancel" : "Close"}
              </Button>
              {view === "memo" && (
                <Button
                  className={"rp_btn"}
                  onClick={(e) => {
                    e.stopPropagation();
                    void onSave();
                  }}
                  disabled={saving || !user || !dirty || memo.length < 1}
                >
                  {saving ? "Saving…" : "Save"}
                </Button>
              )}
            </div>
          </DialogFooter>
        </DialogContent>
      </DialogRoot>
    </>
  );
};
