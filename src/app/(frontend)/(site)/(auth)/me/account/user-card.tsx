"use client";

import { useCursorHandlers } from "@/components/core/cursorWrapper";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button, RP_Btn } from "@/components/core/Button";
import { Checkbox } from "@/components/ui/checkbox";
import CopyButton from "@/components/ui/copy-button";
import {
  DialogRoot,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PasswordInput } from "@/components/ui/password-input";
import { authClient as client, signOut } from "@/lib/auth/client";
import { useBetterAuth } from "@/lib/auth/context";
import { User, type UserMedia } from "@payload-types";
import { getClientSideURL } from "@/utilities/getURL";
import { ChevronRightIcon, MobileIcon } from "@radix-ui/react-icons";
import {
  Edit,
  Fingerprint,
  Laptop,
  Loader2,
  LogOut,
  Plus,
  QrCode,
  ShieldCheck,
  Trash
} from "lucide-react";
import { AnimatePresence } from "motion/react";
import Image from "next/image";
import { useTransitionRouter } from "next-transition-router";
import {
  type ChangeEventHandler,
  type ClipboardEventHandler,
  type DragEventHandler,
  type MouseEventHandler,
  use,
  useCallback,
  useEffect,
  useState
} from "react";
import QRCode from "react-qr-code";
import { toast } from "sonner";
import { UAParser } from "ua-parser-js";
import * as m from "motion/react-m";
import { cn } from "@/lib/utils";
import { errorToast, successToast } from "@/components/ui/sonner";
import { useRPSession } from "@/lib/auth/session/RP_SessionProvider";
import { useFormatter, useNow } from "next-intl";

export function UserCard() {
  const router = useTransitionRouter();
  const {
    sessionPromise,
    userAccountsPromise,
    deviceSessionsPromise,
    currentUserPromise
  } = useBetterAuth();
  const session = use(sessionPromise);
  const accounts = use(userAccountsPromise);
  const sessions = use(deviceSessionsPromise);
  const currentUser = use(currentUserPromise) as
    | (User & {
        collection: "users";
      })
    | null;
  const [isTerminating, setIsTerminating] = useState<string | undefined>(
    undefined
  );
  const [isPendingTwoFa, setIsPendingTwoFa] = useState<boolean>(false);
  const [twoFaPassword, setTwoFaPassword] = useState<string>("");
  const [twoFactorDialog, setTwoFactorDialog] = useState<boolean>(false);
  const [twoFactorVerifyURI, setTwoFactorVerifyURI] = useState<string>("");
  const [isSignOut, setIsSignOut] = useState<boolean>(false);
  const [emailVerificationPending, setEmailVerificationPending] =
    useState<boolean>(false);

  return (
    <section className="flex w-full flex-col gap-10 rounded-sm border border-border/20 bg-card p-6 xl:p-8">
      <header className="flex items-start justify-between gap-6 border-b border-border/20 pb-6">
        <div className="flex items-center gap-4">
          <Avatar className="hidden h-11 w-11 sm:flex">
            {currentUser?.image ? (
              <AvatarImage
                src={currentUser?.image || "#"}
                alt="Avatar"
                className="object-cover"
              />
            ) : (
              <AvatarFallback className="bg-foreground/10 font-mono text-sm">
                {currentUser?.name?.charAt(0)}
              </AvatarFallback>
            )}
          </Avatar>
          <div className="flex flex-col gap-1">
            <p className="font-mono text-[10px] tracking-[0.2em] text-muted-foreground/60 uppercase">
              Signed in as
            </p>
            <p className="text-lg font-light tracking-tight">
              {currentUser?.name}
            </p>
            <p className="font-mono text-[11px] text-muted-foreground/70">
              {currentUser?.email}
            </p>
          </div>
        </div>
        <EditUserDialog />
      </header>
      <div className="grid grid-cols-1 gap-10 text-foreground">
        {currentUser?.emailVerified ? null : (
          <Alert className="flex flex-col gap-3 rounded-sm border border-border/30 bg-muted/20 p-5">
            <div className="flex flex-col gap-1.5">
              <AlertTitle className="font-mono text-[10px] tracking-[0.2em] text-muted-foreground/60 uppercase">
                Email unverified
              </AlertTitle>
              <AlertDescription className="text-sm font-light tracking-tight text-foreground/80">
                Please verify your email address. Check your inbox for the
                verification email.
              </AlertDescription>
            </div>
            <div className="flex justify-start">
              <Button
                className="w-full border border-border/40 px-5 py-2.5 font-mono text-[11px] tracking-widest text-foreground/80 uppercase transition-colors hover:border-border hover:text-foreground sm:w-auto"
                disabled={emailVerificationPending}
                onClick={async () => {
                  await client.sendVerificationEmail(
                    {
                      email: currentUser?.email || ""
                    },
                    {
                      onRequest() {
                        setEmailVerificationPending(true);
                      },
                      onError(context) {
                        toast.error(context.error.message);
                        setEmailVerificationPending(false);
                      },
                      onSuccess() {
                        toast.success("Verification email sent successfully");
                        setEmailVerificationPending(false);
                      }
                    }
                  );
                }}
              >
                {emailVerificationPending ? (
                  <div className="flex items-center gap-2">
                    <Loader2 size={14} className="animate-spin" />
                    <span>Sending...</span>
                  </div>
                ) : (
                  "Resend Verification Email"
                )}
              </Button>
            </div>
          </Alert>
        )}
        {sessions && sessions.length > 0 && (
          <div className="flex w-full flex-col gap-4">
            <div className="flex items-baseline gap-2.5">
              <p className="font-mono text-[10px] tracking-[0.2em] text-muted-foreground/60 uppercase">
                Active Sessions
              </p>
              <span className="font-mono text-[11px] text-muted-foreground/50 tabular-nums">
                {sessions.filter((s) => s?.userAgent).length}
              </span>
            </div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {sessions
                .filter((sessionData) => sessionData?.userAgent)
                .map((sessionData) => {
                  return (
                    <div
                      className="group flex items-center justify-between gap-4 rounded-sm border border-border/20 bg-transparent px-4 py-3 text-foreground transition-colors hover:border-border/50"
                      key={sessionData.id}
                    >
                      <span className="flex items-center gap-3 text-sm font-light tracking-tight text-inherit">
                        {new UAParser(sessionData.userAgent || "").getDevice()
                          .type === "mobile" ? (
                          <MobileIcon
                            stroke={"currentColor"}
                            className="size-4"
                            strokeWidth={1}
                          />
                        ) : (
                          <Laptop
                            stroke={"currentColor"}
                            strokeWidth={1}
                            size={14}
                          />
                        )}
                        <span className="truncate">
                          {
                            new UAParser(sessionData.userAgent || "").getOS()
                              .name
                          }
                          {", "}
                          {
                            new UAParser(
                              sessionData.userAgent || ""
                            ).getBrowser().name
                          }
                        </span>
                      </span>
                      {(session?.session.id === sessionData.id && (
                        <div className="font-mono text-[9px] tracking-widest text-foreground/70 uppercase">
                          Current
                        </div>
                      )) || (
                        <Button
                          className="border border-border/40 px-2.5 py-1 font-mono text-[9px] tracking-widest text-foreground/70 uppercase transition-colors hover:border-border hover:text-foreground"
                          onClick={async () => {
                            setIsTerminating(sessionData.id);
                            const res = await client.revokeSession({
                              token: sessionData.token
                            });

                            if (res.error) {
                              errorToast(
                                res.error.message ||
                                  "Failed to terminate session"
                              );
                            } else {
                              successToast("Session terminated successfully");
                            }
                            router.refresh();
                            setIsTerminating(undefined);
                          }}
                        >
                          {isTerminating === sessionData.id ? (
                            <Loader2 size={15} className="animate-spin" />
                          ) : sessionData.id === session?.session.id ? (
                            "Sign Out"
                          ) : (
                            "Terminate"
                          )}
                        </Button>
                      )}
                    </div>
                  );
                })}
            </div>
          </div>
        )}
        <div className="grid grid-cols-1 gap-8 border-t border-border/20 pt-8 md:grid-cols-2 md:gap-10">
          <div className="flex flex-col gap-4">
            <p className="font-mono text-[10px] tracking-[0.2em] text-muted-foreground/60 uppercase">
              Passkeys
            </p>
            <div className="flex items-center gap-3">
              <ListPasskeys />
              <AddPasskey />
            </div>
          </div>
          <div className="flex flex-col gap-4">
            <p className="font-mono text-[10px] tracking-[0.2em] text-muted-foreground/60 uppercase">
              Two Factor
            </p>
            <div className="flex items-center gap-2">
              {currentUser && !!currentUser.twoFactorEnabled && (
                <DialogRoot>
                  <DialogTrigger
                    nativeButton={true}
                    render={() => (
                      <Button className="flex items-center gap-2 border border-border/40 px-4 py-2 font-mono text-[11px] tracking-widest uppercase transition-colors hover:border-border">
                        <QrCode size={14} />
                        <span>Scan QR</span>
                      </Button>
                    )}
                  />
                  <DialogContent className="w-11/12 rounded-sm sm:max-w-[425px]">
                    <DialogHeader>
                      <p className="font-mono text-[10px] tracking-[0.2em] text-muted-foreground/60 uppercase">
                        Security
                      </p>
                      <DialogTitle className="mt-0.5 text-2xl font-light tracking-tight">
                        Scan QR Code
                      </DialogTitle>
                      <DialogDescription className="mt-1 text-sm font-light text-foreground/70">
                        Scan the QR code with your TOTP app
                      </DialogDescription>
                    </DialogHeader>
                    {twoFactorVerifyURI ? (
                      <div className="mt-4 flex flex-col gap-4">
                        <div className="flex items-center justify-center">
                          <QRCode value={twoFactorVerifyURI} />
                        </div>
                        <div className="flex items-center justify-center gap-2">
                          <p className="font-mono text-[11px] text-muted-foreground/70">
                            Copy URI to clipboard
                          </p>
                          <CopyButton textToCopy={twoFactorVerifyURI} />
                        </div>
                      </div>
                    ) : (
                      <div className="mt-4 flex flex-col gap-4">
                        <PasswordInput
                          value={twoFaPassword}
                          onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                            setTwoFaPassword(e.target.value)
                          }
                          placeholder="Enter Password"
                          className="border-0 border-b border-border/30 bg-transparent px-0 text-sm font-light tracking-tight placeholder:text-muted-foreground/40 focus:border-foreground/40 focus:outline-none focus-visible:ring-0"
                        />
                        <Button
                          className="border border-border/40 px-5 py-2.5 font-mono text-[11px] tracking-widest text-foreground/80 uppercase transition-colors hover:border-border hover:bg-transparent hover:text-foreground"
                          onClick={async () => {
                            if (twoFaPassword.length < 8) {
                              toast.error(
                                "Password must be at least 8 characters"
                              );
                              return;
                            }
                            await client.twoFactor.getTotpUri(
                              {
                                password: twoFaPassword
                              },
                              {
                                onSuccess(context) {
                                  console.log(context);
                                  setTwoFactorVerifyURI(context.data.totpURI);
                                }
                              }
                            );
                            setTwoFaPassword("");
                          }}
                        >
                          Show QR Code
                        </Button>
                      </div>
                    )}
                  </DialogContent>
                </DialogRoot>
              )}
              <DialogRoot
                open={twoFactorDialog}
                onOpenChange={setTwoFactorDialog}
              >
                <DialogTrigger
                  nativeButton={true}
                  render={() => (
                    <Button
                      className={cn(
                        "flex items-center justify-center gap-2 border px-4 py-2 font-mono text-[11px] tracking-widest uppercase transition-colors",
                        currentUser?.twoFactorEnabled
                          ? "border-border text-foreground hover:border-foreground"
                          : "border-border/40 text-foreground/70 hover:border-border hover:text-foreground"
                      )}
                    >
                      {currentUser?.twoFactorEnabled ? (
                        <ShieldCheck size={16} />
                      ) : (
                        <ChevronRightIcon className="h-4 w-4" />
                      )}
                      <span className="text-xs md:text-sm">
                        {currentUser?.twoFactorEnabled
                          ? "2FA is Enabled."
                          : "Set up 2FA"}
                      </span>
                    </Button>
                  )}
                />
                <DialogContent className="w-11/12 rounded-sm sm:max-w-[425px]">
                  <DialogHeader>
                    <p className="font-mono text-[10px] tracking-[0.2em] text-muted-foreground/60 uppercase">
                      Security
                    </p>
                    <DialogTitle className="mt-0.5 text-2xl font-light tracking-tight">
                      {currentUser?.twoFactorEnabled
                        ? "Disable 2FA"
                        : "Enable 2FA"}
                    </DialogTitle>
                    <DialogDescription className="mt-1 text-sm font-light text-foreground/70">
                      {currentUser?.twoFactorEnabled
                        ? "Disable the second factor authentication from your account"
                        : "Enable 2FA to secure your account"}
                    </DialogDescription>
                  </DialogHeader>
                  {twoFactorVerifyURI ? (
                    <div className="mt-4 flex flex-col gap-4">
                      <div className="flex items-center justify-center">
                        <QRCode value={twoFactorVerifyURI} />
                      </div>
                      <div className="flex flex-col gap-2">
                        <Label
                          htmlFor="password"
                          className="font-mono text-[10px] tracking-[0.2em] text-muted-foreground/60 uppercase"
                        >
                          Scan the QR code with your TOTP app
                        </Label>
                        <Input
                          value={twoFaPassword}
                          onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                            setTwoFaPassword(e.target.value)
                          }
                          placeholder="Enter OTP"
                          className="border-0 border-b border-border/30 bg-transparent px-0 text-sm font-light tracking-tight placeholder:text-muted-foreground/40 focus:border-foreground/40 focus:outline-none focus-visible:ring-0"
                        />
                      </div>
                    </div>
                  ) : (
                    <div className="mt-4 flex flex-col gap-2">
                      <Label
                        htmlFor="password"
                        className="font-mono text-[10px] tracking-[0.2em] text-muted-foreground/60 uppercase"
                      >
                        Password
                      </Label>
                      <PasswordInput
                        id="password"
                        placeholder="Password"
                        value={twoFaPassword}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                          setTwoFaPassword(e.target.value)
                        }
                        className="border-0 border-b border-border/30 bg-transparent px-0 text-sm font-light tracking-tight placeholder:text-muted-foreground/40 focus:border-foreground/40 focus:outline-none focus-visible:ring-0"
                      />
                    </div>
                  )}
                  <DialogFooter className="mt-6">
                    <Button
                      className="border border-border/40 px-5 py-2.5 font-mono text-[11px] tracking-widest text-foreground/80 uppercase transition-colors hover:border-border hover:bg-transparent hover:text-foreground disabled:opacity-40"
                      disabled={isPendingTwoFa}
                      onClick={async () => {
                        if (twoFaPassword.length < 8 && !twoFactorVerifyURI) {
                          toast.error("Password must be at least 8 characters");
                          return;
                        }
                        setIsPendingTwoFa(true);
                        if (currentUser?.twoFactorEnabled) {
                          const res = await client.twoFactor.disable({
                            //@ts-ignore
                            password: twoFaPassword,
                            fetchOptions: {
                              onError(context) {
                                toast.error(context.error.message);
                              },
                              onSuccess() {
                                toast("2FA disabled successfully");
                                setTwoFactorDialog(false);
                              }
                            }
                          });
                        } else {
                          if (twoFactorVerifyURI) {
                            await client.twoFactor.verifyTotp({
                              code: twoFaPassword,
                              fetchOptions: {
                                onError(context) {
                                  setIsPendingTwoFa(false);
                                  setTwoFaPassword("");
                                  toast.error(context.error.message);
                                },
                                onSuccess() {
                                  toast("2FA enabled successfully");
                                  setTwoFactorVerifyURI("");
                                  setIsPendingTwoFa(false);
                                  setTwoFaPassword("");
                                  setTwoFactorDialog(false);
                                }
                              }
                            });
                            return;
                          }
                          const res = await client.twoFactor.enable({
                            password: twoFaPassword,
                            fetchOptions: {
                              onError(context) {
                                toast.error(context.error.message);
                              },
                              onSuccess(ctx) {
                                setTwoFactorVerifyURI(ctx.data.totpURI);
                                // toast.success("2FA enabled successfully");
                                // setTwoFactorDialog(false);
                              }
                            }
                          });
                        }
                        setIsPendingTwoFa(false);
                        setTwoFaPassword("");
                      }}
                    >
                      {isPendingTwoFa ? (
                        <Loader2 size={15} className="animate-spin" />
                      ) : currentUser?.twoFactorEnabled ? (
                        "Disable 2FA"
                      ) : (
                        "Enable 2FA"
                      )}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </DialogRoot>
            </div>
          </div>
        </div>
      </div>
      <footer className="flex items-center justify-between gap-3 border-t border-border/20 pt-6">
        {accounts &&
          accounts.some((account) => {
            return account.scopes.includes("credential");
          }) && <ChangePassword />}
        <Button
          className="ml-auto flex items-center gap-2 border border-border/40 px-5 py-2.5 font-mono text-[11px] tracking-widest text-foreground/80 uppercase transition-colors hover:border-border hover:text-foreground"
          onClick={async () => {
            setIsSignOut(true);
            await signOut({
              fetchOptions: {
                onSuccess() {
                  router.push("/");
                }
              }
            });
            setIsSignOut(false);
          }}
          disabled={isSignOut}
        >
          {isSignOut ? (
            <Loader2 size={13} className="animate-spin" />
          ) : (
            <>
              <LogOut size={13} />
              <span>Sign Out</span>
            </>
          )}
        </Button>
      </footer>
    </section>
  );
}

async function convertImageToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function ChangePassword() {
  const [currentPassword, setCurrentPassword] = useState<string>("");
  const [newPassword, setNewPassword] = useState<string>("");
  const [confirmPassword, setConfirmPassword] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const [open, setOpen] = useState<boolean>(false);
  const [signOutDevices, setSignOutDevices] = useState<boolean>(false);
  return (
    <DialogRoot open={open} onOpenChange={setOpen}>
      <DialogTrigger
        nativeButton={true}
        render={() => (
          <Button className="flex items-center gap-2 border border-border/40 px-5 py-2.5 font-mono text-[11px] tracking-widest text-foreground/80 uppercase transition-colors hover:border-border hover:text-foreground">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="0.85em"
              height="0.85em"
              viewBox="0 0 24 24"
            >
              <path
                fill="currentColor"
                d="M2.5 18.5v-1h19v1zm.535-5.973l-.762-.442l.965-1.693h-1.93v-.884h1.93l-.965-1.642l.762-.443L4 9.066l.966-1.643l.761.443l-.965 1.642h1.93v.884h-1.93l.965 1.693l-.762.442L4 10.835zm8 0l-.762-.442l.966-1.693H9.308v-.884h1.93l-.965-1.642l.762-.443L12 9.066l.966-1.643l.761.443l-.965 1.642h1.93v.884h-1.93l.965 1.693l-.762.442L12 10.835zm8 0l-.762-.442l.966-1.693h-1.931v-.884h1.93l-.965-1.642l.762-.443L20 9.066l.966-1.643l.761.443l-.965 1.642h1.93v.884h-1.93l.965 1.693l-.762.442L20 10.835z"
              ></path>
            </svg>
            <span>Change Password</span>
          </Button>
        )}
      />
      <DialogContent className="w-11/12 rounded-sm sm:max-w-[425px]">
        <DialogHeader>
          <p className="font-mono text-[10px] tracking-[0.2em] text-muted-foreground/60 uppercase">
            Security
          </p>
          <DialogTitle className="mt-0.5 text-2xl font-light tracking-tight">
            Change Password
          </DialogTitle>
          <DialogDescription className="mt-1 text-sm font-light text-foreground/70">
            Update the password you use to sign in.
          </DialogDescription>
        </DialogHeader>
        <div className="mt-4 flex flex-col gap-6">
          <div className="flex flex-col gap-2">
            <Label
              htmlFor="current-password"
              className="font-mono text-[10px] tracking-[0.2em] text-muted-foreground/60 uppercase"
            >
              Current Password
            </Label>
            <PasswordInput
              id="current-password"
              value={currentPassword}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                setCurrentPassword(e.target.value)
              }
              autoComplete="new-password"
              placeholder="Password"
              className="border-0 border-b border-border/30 bg-transparent px-0 text-sm font-light tracking-tight placeholder:text-muted-foreground/40 focus:border-foreground/40 focus:outline-none focus-visible:ring-0"
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label
              htmlFor="new-password"
              className="font-mono text-[10px] tracking-[0.2em] text-muted-foreground/60 uppercase"
            >
              New Password
            </Label>
            <PasswordInput
              value={newPassword}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                setNewPassword(e.target.value)
              }
              autoComplete="new-password"
              placeholder="New Password"
              className="border-0 border-b border-border/30 bg-transparent px-0 text-sm font-light tracking-tight placeholder:text-muted-foreground/40 focus:border-foreground/40 focus:outline-none focus-visible:ring-0"
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label
              htmlFor="password"
              className="font-mono text-[10px] tracking-[0.2em] text-muted-foreground/60 uppercase"
            >
              Confirm Password
            </Label>
            <PasswordInput
              value={confirmPassword}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                setConfirmPassword(e.target.value)
              }
              autoComplete="new-password"
              placeholder="Confirm Password"
              className="border-0 border-b border-border/30 bg-transparent px-0 text-sm font-light tracking-tight placeholder:text-muted-foreground/40 focus:border-foreground/40 focus:outline-none focus-visible:ring-0"
            />
          </div>
          <label className="flex cursor-pointer items-center gap-3 pt-2">
            <Checkbox
              onCheckedChange={(checked) =>
                checked ? setSignOutDevices(true) : setSignOutDevices(false)
              }
            />
            <span className="font-mono text-[11px] tracking-wide text-foreground/80 uppercase">
              Sign out from other devices
            </span>
          </label>
        </div>
        <DialogFooter className="mt-6">
          <Button
            className="border border-border/40 px-5 py-2.5 font-mono text-[11px] tracking-widest text-foreground/80 uppercase transition-colors hover:border-border hover:bg-transparent hover:text-foreground disabled:opacity-40"
            onClick={async () => {
              if (newPassword !== confirmPassword) {
                toast.error("Passwords do not match");
                return;
              }
              if (newPassword.length < 8) {
                toast.error("Password must be at least 8 characters");
                return;
              }
              setLoading(true);
              const res = await client.changePassword({
                newPassword: newPassword,
                currentPassword: currentPassword,
                revokeOtherSessions: signOutDevices
              });
              setLoading(false);
              if (res.error) {
                toast.error(
                  res.error.message ||
                    "Couldn't change your password! Make sure it's correct"
                );
              } else {
                setOpen(false);
                toast.success("Password changed successfully");
                setCurrentPassword("");
                setNewPassword("");
                setConfirmPassword("");
              }
            }}
          >
            {loading ? (
              <Loader2 size={13} className="animate-spin" />
            ) : (
              "Change Password"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </DialogRoot>
  );
}

function EditUserDialog() {
  const { currentUserPromise } = useBetterAuth();
  const currentUser = use(currentUserPromise);
  const [name, setName] = useState<string>();
  const [firstName, setFirstName] = useState<string>();
  const [lastName, setLastName] = useState<string>();
  const router = useTransitionRouter();
  const [image, setImage] = useState<File | null>(null);
  const [isUploadedImage, setIsUploadedImage] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);
  const [inserted, setInserted] = useState<boolean>(Boolean(image));
  const [hover, setHover] = useState<boolean>(false);
  const [removeImage, setRemoveImage] = useState(false);
  const clientUrl = getClientSideURL();
  const user = use(currentUserPromise);
  const setPortrait = useRPSession((r) => r.setPortrait);
  useEffect(() => {
    if (firstName && lastName) {
      setName(`${firstName} ${lastName}`);
    } else if (firstName || lastName) {
      if (firstName) {
        const last = (name && name.split(" ")[1]) || "";
        setName(`${firstName} ${last}`);
      } else {
        const first = (name && name.split(" ")[0]) || "";
        setName(`${first} ${lastName}`);
      }
    }
  }, [firstName, lastName]);
  useEffect(() => {
    if (currentUser) {
      if ("image" in currentUser) {
        const imageProp = currentUser.image;
        if (imageProp) {
          if (imageProp.startsWith("/") || imageProp.includes(clientUrl)) {
            setIsUploadedImage(true);
          } else {
            setIsUploadedImage(false);
          }
        }
        imageProp && (setImagePreview(imageProp), setInserted(true));
      }
      if (currentUser.firstName) {
        setFirstName(currentUser.firstName);
      } else {
        if (currentUser.name) {
          const first = currentUser.name.split(" ")[0] || "";
          setFirstName(first);
        }
      }
      if (currentUser.lastName) {
        setLastName(currentUser.lastName);
      } else {
        if (currentUser.name) {
          const last = currentUser.name.split(" ")[1] || "";
          setLastName(last);
        }
      }
    }
  }, []);

  const url = getClientSideURL();
  const onLocalFileSelection = useCallback(
    (fileList?: FileList | null) => {
      if (fileList && fileList.length > 0) {
        const file = fileList[0];

        if (file && file.type.startsWith("image/")) {
          if (file.size > Number(process.env.NEXT_PUBLIC_IMAGE_MAX_FILE_SIZE)) {
            toast.error("Image is too large, select a file with 1mb or less");
            return;
          }

          setImage(file);
          setImagePreview(URL.createObjectURL(file));
          setIsUploadedImage(false);
          setRemoveImage(false);
        } else {
          toast.error("File is not an image");
        }
      }
    },
    [setImage]
  );
  const doUpload = useCallback(
    async (file: File) => {
      const formD = new FormData();
      formD.append("file", file);
      formD.append(
        "_payload",
        JSON.stringify({
          alt: "",
          caption: `${currentUser?.name}'s profile image`,
          _status: "published"
        })
      );
      try {
        const response = await fetch(`${url}/api/userMedia`, {
          method: "POST",
          body: formD,
          credentials: "include"
        });
        if (response.ok) {
          const json = await response.json();
          console.log("imageUploadedDoc", json);
          return json.doc as Partial<UserMedia> &
            Required<Pick<UserMedia, "id" | "thumbnailURL" | "url">>;
        }
        return null;
      } catch (e) {
        toast.error("Welp, something went wrong. Try again?");
        console.log(e);
        return null;
      }
    },
    [currentUser, url]
  );
  const handleImageChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const fileList = e.target.files;
      onLocalFileSelection(fileList);
    },
    [onLocalFileSelection]
  );
  const handleDragEnter: DragEventHandler<HTMLDivElement> = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragging(true);
  }, []);

  const handleDragLeave: DragEventHandler<HTMLDivElement> = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragging(false);
  }, []);
  const handleDrop: DragEventHandler<HTMLDivElement> = useCallback(
    (e) => {
      e.preventDefault();
      e.stopPropagation();
      setDragging(false);
      if (e.dataTransfer) {
        if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
          onLocalFileSelection(e.dataTransfer.files);
          setDragging(false);

          e.dataTransfer.clearData();
        }
      }
    },
    [onLocalFileSelection]
  );
  const { onMouseEnter, onMouseLeave } = useCursorHandlers("dom");
  const handleDragOver: DragEventHandler<HTMLDivElement> = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);
  const handlePaste: ClipboardEventHandler<HTMLDivElement> = useCallback(
    (e) => {
      e.preventDefault();
      e.stopPropagation();

      if (e.clipboardData?.files && e.clipboardData.files.length > 0) {
        onLocalFileSelection(e.clipboardData.files);
      }
    },
    [onLocalFileSelection]
  );

  useEffect(() => {
    if (removeImage) {
      setImage(null);
      setImagePreview(null);
    }
  }, [removeImage]);

  const onChange: ChangeEventHandler<HTMLInputElement> = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);
  const onClickRemove: MouseEventHandler = useCallback((e) => {
    e.preventDefault();
    setRemoveImage((r) => !r);
  }, []);
  const [open, setOpen] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  return (
    <DialogRoot open={open} onOpenChange={setOpen}>
      <DialogTrigger
        nativeButton={true}
        render={() => (
          <Button className="flex items-center gap-2 border border-border/40 px-4 py-2 font-mono text-[11px] tracking-widest text-foreground/80 uppercase transition-colors hover:border-border hover:text-foreground">
            <Edit size={12} />
            <span>Edit</span>
          </Button>
        )}
      />
      <DialogContent className="w-11/12 rounded-sm sm:max-w-[425px]">
        <DialogHeader>
          <p className="font-mono text-[10px] tracking-[0.2em] text-muted-foreground/60 uppercase">
            Your Account
          </p>
          <DialogTitle className="mt-0.5 text-2xl font-light tracking-tight">
            Edit Profile
          </DialogTitle>
          <DialogDescription className="mt-1 mb-4 text-sm font-light text-foreground/70">
            Edit your profile information.
          </DialogDescription>
        </DialogHeader>
        <div
          className="flex h-full w-full flex-col overflow-y-auto"
          data-lenis-prevent
        >
          <div className="my-4 grid gap-10">
            <div className="flex gap-4">
              {" "}
              <div className="flex flex-col gap-2">
                <Label
                  htmlFor="firstName"
                  className="font-mono text-[10px] tracking-[0.2em] text-muted-foreground/60 uppercase"
                >
                  First Name
                </Label>
                <Input
                  className="border-0 border-b border-border/30 bg-transparent px-0 text-sm font-light tracking-tight placeholder:text-muted-foreground/40 focus:border-foreground/40 focus:outline-none focus-visible:ring-0"
                  id="firstName"
                  type="firstName"
                  placeholder={currentUser?.firstName ?? ""}
                  required
                  onChange={(e) => {
                    setFirstName(e.target.value);
                  }}
                />
              </div>
              <div className="flex flex-col gap-2">
                <Label
                  htmlFor="lastName"
                  className="font-mono text-[10px] tracking-[0.2em] text-muted-foreground/60 uppercase"
                >
                  Last Name
                </Label>
                <Input
                  className="border-0 border-b border-border/30 bg-transparent px-0 text-sm font-light tracking-tight placeholder:text-muted-foreground/40 focus:border-foreground/40 focus:outline-none focus-visible:ring-0"
                  id="lastName"
                  type="lastName"
                  placeholder={currentUser?.lastName ?? ""}
                  required
                  onChange={(e) => {
                    setLastName(e.target.value);
                  }}
                />
              </div>
            </div>
            <div className="flex flex-col gap-3">
              <Label
                htmlFor="image"
                className="font-mono text-[10px] tracking-[0.2em] text-muted-foreground/60 uppercase"
              >
                Profile Image
              </Label>
              <div className="flex items-end gap-4">
                <div className="flex w-full items-center gap-2">
                  <div className="relative my-10 flex w-full flex-col items-center">
                    <div
                      className={
                        "relative flex aspect-[3/2] w-full items-center justify-center overflow-hidden rounded-lg border border-faded-foreground/60 bg-transparent transition-all duration-300"
                      }
                      onDragEnter={handleDragEnter}
                      onDragOver={handleDragOver}
                      onDragLeave={handleDragLeave}
                      onDrop={handleDrop}
                      onMouseEnter={() => setHover(true)}
                      onMouseLeave={() => setHover(false)}
                      onPaste={handlePaste}
                    >
                      <input
                        type="checkbox"
                        name="removeImage"
                        className="hidden outline-none"
                        checked={removeImage}
                        onChange={onChange}
                      />
                      <div
                        className="ease relative rounded-xl border-[1px] border-solid border-faded-foreground p-5 px-3.5 py-1 text-center leading-[1.5] transition-[z-index,opacity,border-color,background-color,color] duration-200 hover:border-faded-foreground hover:bg-muted-faded-foreground hover:text-faded-background data-[visible=false]:z-[-1] data-[visible=false]:opacity-0 data-[visible=true]:z-[10] data-[visible=true]:opacity-100"
                        data-visible={hover}
                        onMouseEnter={onMouseEnter}
                        onMouseLeave={onMouseLeave}
                      >
                        <input
                          id={"user_settings_photo_file"}
                          name={"user_settings[photo][file]"}
                          className={cn(
                            "absolute inset-0 z-[10] h-full w-full cursor-none overflow-hidden opacity-0",
                            { hidden: inserted }
                          )}
                          onChange={handleImageChange}
                          accept="image/*"
                          type={"file"}
                        />
                        <label
                          className={"flex items-center gap-2 px-2 py-1"}
                          htmlFor="user_settings_photo_file"
                        >
                          <span className="text-base">Upload File</span>
                          <svg
                            className="relative inline-block h-auto bg-transparent transition-colors duration-300 outline-none"
                            viewBox="0 0 20 20"
                            width="25"
                          >
                            <path
                              xmlns="http://www.w3.org/2000/svg"
                              d="M16.3,8.2C15.9,5.3,13.2,3,10,3C7.4,3,5.2,4.5,4.2,6.6C1.8,7.2,0,9.2,0,11.7c0,3,2.5,5.3,5.5,5.3 c0.6,0,1-0.4,1-1c0-0.6-0.4-1-1-1c-2,0-3.5-1.5-3.5-3.3c0-1.6,1.3-3,3-3.2c0.4,0,0.7-0.3,0.8-0.6C6.4,6.2,8,5,10,5 c2.5,0,4.4,1.9,4.4,4.1c0,0.6,0.4,1,1,1c1.5,0,2.6,1.1,2.6,2.4c0,1.3-1.1,2.4-2.6,2.4c-0.6,0-1,0.4-1,1c0,0.6,0.4,1,1,1 c2.5,0,4.6-1.9,4.6-4.4C20,10.4,18.4,8.7,16.3,8.2z"
                              fill={"currentColor"}
                            />
                          </svg>
                        </label>
                      </div>
                      <AnimatePresence initial={false} mode={"sync"}>
                        {imagePreview && (
                          <m.div
                            initial={{
                              visibility: "hidden",
                              opacity: 0
                            }}
                            animate={{
                              visibility: "visible",
                              opacity: 1,
                              transition: {
                                duration: 0.2,
                                ease: "easeIn"
                              }
                            }}
                            exit={{
                              visibility: "hidden",
                              opacity: 0,
                              transition: {
                                duration: 0.2,
                                ease: "easeOut"
                              }
                            }}
                            className="absolute inset-0 z-[1]"
                          >
                            <Image
                              className="h-full w-full object-cover"
                              src={imagePreview || ""}
                              height={400}
                              width={400}
                              alt=""
                            />
                          </m.div>
                        )}
                      </AnimatePresence>
                      {imagePreview && (
                        <div
                          className={cn(
                            "absolute inset-0 flex items-center justify-center gap-[8px] bg-off-black/30 backdrop-blur-lg transition-all duration-300 data-[visible=false]:z-[0] data-[visible=false]:opacity-0 data-[visible=true]:z-[55] data-[visible=true]:opacity-100"
                          )}
                          data-visible={hover}
                        >
                          <span
                            onMouseEnter={onMouseEnter}
                            onMouseLeave={onMouseLeave}
                            className="relative z-[5] inline-flex h-[42px] min-w-[42px] cursor-none items-center justify-center rounded-xl px-[20px] py-0 text-center leading-[42px] transition-colors duration-300 hover:bg-off-background/50 hover:text-rouge-700"
                            onClick={onClickRemove}
                          >
                            <svg
                              className="relative mr-[.5em] inline-block h-auto w-[21px] cursor-none border-none bg-transparent fill-current align-middle transition-[fill] duration-300 outline-none"
                              viewBox="0 0 20 20"
                              width="16"
                            >
                              <path
                                xmlns="http://www.w3.org/2000/svg"
                                d="M12.4,0H7.6v2h4.8V0z M20,3.1H0v2h20V3.1z M8,6.9H6v9.3h2V6.9z M12,6.9h2v9.3h-2V6.9z M16.8,18 c0.6,0,1.2-0.5,1.2-1.2V7.1l2,0.6v9.1c0,1.7-1.4,3.2-3.2,3.2H3.2C1.4,20,0,18.6,0,16.8V7.8l2-0.6v9.7C2,17.5,2.5,18,3.2,18H16.8z"
                              />
                            </svg>

                            <span>Remove</span>
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        <DialogFooter className="mt-6">
          <Button
            className="border border-border/40 px-5 py-2.5 font-mono text-[11px] tracking-widest text-foreground/80 uppercase transition-colors hover:border-border hover:bg-transparent hover:text-foreground disabled:opacity-40"
            disabled={isLoading}
            onClick={async () => {
              setIsLoading(true);
              let imageURL: string | null = null;
              let portraitURL: string | null = null;
              if (
                user &&
                isUploadedImage &&
                removeImage &&
                (user as User).portrait
              ) {
                await fetch(
                  `${clientUrl}/api/userMedia/${(user as User).portrait}`,
                  {
                    method: "DELETE",
                    credentials: "include"
                  }
                );
                setPortrait(null);
              }

              if (image) {
                const imageDoc = await doUpload(image);
                if (imageDoc) {
                  imageURL = imageDoc.url || imageDoc.thumbnailURL || null;
                  portraitURL = imageDoc.id || null;
                  if (portraitURL) {
                    setPortrait(portraitURL);
                  }
                }
              }

              await client
                .updateUser({
                  image: imageURL ? imageURL : undefined,
                  portrait: portraitURL ? portraitURL : undefined,
                  name: name ? name : undefined,
                  firstName: firstName ? firstName : undefined,
                  lastName: lastName ? lastName : undefined,
                  fetchOptions: {
                    onSuccess: () => {
                      setOpen(false);
                      successToast("Updated successfully!");
                    },
                    onError: (error) => {
                      errorToast(
                        error.error.message || "Failed to update user"
                      );
                    }
                  }
                })
                .finally(() => {
                  setFirstName("");
                  setLastName("");
                  setImage(null);
                  setRemoveImage(false);
                  setImagePreview(null);
                  setIsLoading(false);
                  router.refresh();
                });
            }}
          >
            {isLoading ? (
              <Loader2 size={13} className="animate-spin" />
            ) : (
              "Update"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </DialogRoot>
  );
}

function AddPasskey() {
  const [isOpen, setIsOpen] = useState(false);
  const [passkeyName, setPasskeyName] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleAddPasskey = async () => {
    if (!passkeyName) {
      errorToast("Passkey name is required");
      return;
    }
    setIsLoading(true);
    const res = await client.passkey.addPasskey({
      name: passkeyName
    });
    if (res?.error) {
      errorToast(res?.error.message || "Failed to add passkey");
    } else {
      setIsOpen(false);
      successToast("Passkey added successfully. You can now use it to login.");
    }
    setIsLoading(false);
  };
  return (
    <DialogRoot open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger
        nativeButton={true}
        render={() => (
          <Button className="flex items-center gap-2 border border-border/40 px-4 py-2 font-mono text-[11px] tracking-widest text-foreground/80 uppercase transition-colors hover:border-border hover:text-foreground">
            <Plus size={13} />
            <span>Add Passkey</span>
          </Button>
        )}
      />
      <DialogContent className="w-11/12 rounded-sm sm:max-w-[425px]">
        <DialogHeader>
          <p className="font-mono text-[10px] tracking-[0.2em] text-muted-foreground/60 uppercase">
            Security
          </p>
          <DialogTitle className="mt-0.5 text-2xl font-light tracking-tight">
            Add New Passkey
          </DialogTitle>
          <DialogDescription className="text-sm font-light text-foreground/70">
            Create a new passkey to securely access your account without a
            password.
          </DialogDescription>
        </DialogHeader>
        <div className="mt-4 flex flex-col gap-2">
          <Label
            htmlFor="passkey-name"
            className="font-mono text-[10px] tracking-[0.2em] text-muted-foreground/60 uppercase"
          >
            Passkey Name
          </Label>
          <Input
            id="passkey-name"
            value={passkeyName}
            onChange={(e) => setPasskeyName(e.target.value)}
            className="border-0 border-b border-border/30 bg-transparent px-0 text-sm font-light tracking-tight placeholder:text-muted-foreground/40 focus:border-foreground/40 focus:outline-none focus-visible:ring-0"
          />
        </div>
        <DialogFooter className="mt-6">
          <Button
            disabled={isLoading}
            type="submit"
            onClick={handleAddPasskey}
            className="flex w-full items-center justify-center gap-2 border border-border/40 px-5 py-2.5 font-mono text-[11px] tracking-widest text-foreground/80 uppercase transition-colors hover:border-border hover:bg-transparent hover:text-foreground disabled:opacity-40"
          >
            {isLoading ? (
              <Loader2 size={13} className="animate-spin" />
            ) : (
              <>
                <Fingerprint size={13} />
                Create Passkey
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </DialogRoot>
  );
}

function ListPasskeys() {
  const { data } = client.useListPasskeys();
  const [isOpen, setIsOpen] = useState(false);
  const [passkeyName, setPasskeyName] = useState("");

  const handleAddPasskey = async () => {
    if (!passkeyName) {
      errorToast("Passkey name is required");
      return;
    }
    setIsLoading(true);
    const res = await client.passkey.addPasskey({
      name: passkeyName
    });
    setIsLoading(false);
    if (res?.error) {
      errorToast(res?.error.message || "Failed to add passkey");
    } else {
      successToast("Passkey added successfully. You can now use it to login.");
    }
  };
  const [isLoading, setIsLoading] = useState(false);
  const [isDeletePasskey, setIsDeletePasskey] = useState<boolean>(false);
  return (
    <DialogRoot open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger
        nativeButton={true}
        render={() => (
          <Button className="flex items-center gap-2 border border-border/40 px-4 py-2 font-mono text-[11px] tracking-widest text-foreground/80 uppercase transition-colors hover:border-border hover:text-foreground">
            <Fingerprint size={13} />
            <span className="flex items-center gap-1.5">
              Passkeys
              {data?.length ? (
                <span className="font-mono text-[10px] text-muted-foreground/60 tabular-nums">
                  {data?.length}
                </span>
              ) : null}
            </span>
          </Button>
        )}
      />
      <DialogContent className="w-11/12 rounded-sm sm:max-w-[425px]">
        <DialogHeader>
          <p className="font-mono text-[10px] tracking-[0.2em] text-muted-foreground/60 uppercase">
            Security
          </p>
          <DialogTitle className="mt-0.5 text-2xl font-light tracking-tight">
            Passkeys
          </DialogTitle>
          <DialogDescription className="mt-1 text-sm font-light text-foreground/70">
            Registered passkeys for this account
          </DialogDescription>
        </DialogHeader>
        {data?.length ? (
          <ul className="mt-4 flex flex-col divide-y divide-border/20 border-y border-border/20">
            {data.map((passkey) => (
              <li
                key={passkey.id}
                className="flex items-center justify-between py-3"
              >
                <span className="text-sm font-light tracking-tight">
                  {passkey.name || "My Passkey"}
                </span>
                <RP_Btn
                  className="p-1 text-muted-foreground/60 transition-colors hover:text-foreground"
                  onClick={async () => {
                    const res = await client.passkey.deletePasskey({
                      id: passkey.id,
                      fetchOptions: {
                        onRequest: () => {
                          setIsDeletePasskey(true);
                        },
                        onSuccess: () => {
                          successToast("Passkey deleted successfully");
                          setIsDeletePasskey(false);
                        },
                        onError: (error) => {
                          errorToast(error.error.message);
                          setIsDeletePasskey(false);
                        }
                      }
                    });
                  }}
                >
                  {isDeletePasskey ? (
                    <Loader2 size={13} className="animate-spin" />
                  ) : (
                    <Trash size={13} />
                  )}
                </RP_Btn>
              </li>
            ))}
          </ul>
        ) : (
          <p className="my-6 text-center font-mono text-[11px] text-muted-foreground/60">
            No passkeys found
          </p>
        )}
        {!data?.length && (
          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <Label
                htmlFor="passkey-name"
                className="font-mono text-[10px] tracking-[0.2em] text-muted-foreground/60 uppercase"
              >
                Add new passkey
              </Label>
              <Input
                className="border-0 border-b border-border/30 bg-transparent px-0 text-sm font-light tracking-tight placeholder:text-muted-foreground/40 focus:border-foreground/40 focus:outline-none focus-visible:ring-0"
                id="passkey-name"
                value={passkeyName}
                onChange={(e) => setPasskeyName(e.target.value)}
                placeholder="My Passkey"
              />
            </div>
            <Button
              type="submit"
              onClick={handleAddPasskey}
              className="flex w-full items-center justify-center gap-2 border border-border/40 px-5 py-2.5 font-mono text-[11px] tracking-widest text-foreground/80 uppercase transition-colors hover:border-border hover:bg-transparent hover:text-foreground disabled:opacity-40"
            >
              {isLoading ? (
                <Loader2 size={13} className="animate-spin" />
              ) : (
                <>
                  <Fingerprint size={13} />
                  Create Passkey
                </>
              )}
            </Button>
          </div>
        )}
        <DialogFooter className="mt-6">
          <Button
            className="border border-border/40 px-5 py-2.5 font-mono text-[11px] tracking-widest text-foreground/80 uppercase transition-colors hover:border-border hover:bg-transparent hover:text-foreground"
            onClick={() => setIsOpen(false)}
          >
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </DialogRoot>
  );
}
