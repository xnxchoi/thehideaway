"use client";

import { useCursorHandlers } from "@/components/core/cursorWrapper";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button, RP_Btn } from "@/components/core/Button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle
} from "@/components/ui/card";
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table";
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
    <Card>
      <CardHeader>
        <CardTitle className="font-sans text-lg">
          Hello, {currentUser?.name}
        </CardTitle>
      </CardHeader>
      <CardContent className="grid grid-cols-1 gap-8 bg-background text-base text-foreground">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-4">
            <Avatar className="hidden h-9 w-9 sm:flex">
              {currentUser?.image ? (
                <AvatarImage
                  src={currentUser?.image || "#"}
                  alt="Avatar"
                  className="object-cover"
                />
              ) : (
                <AvatarFallback>{currentUser?.name?.charAt(0)}</AvatarFallback>
              )}
            </Avatar>
            <div className="grid gap-1">
              <p className="text-sm leading-none font-medium">
                {currentUser?.name}
              </p>
              <p className="text-sm">{currentUser?.email}</p>
            </div>
          </div>
          <EditUserDialog />
        </div>
        {currentUser?.emailVerified ? null : (
          <Alert className="flex flex-col space-y-3">
            <div className="flex flex-col space-y-1">
              <AlertTitle className="text-base">
                Verify Your Email Address
              </AlertTitle>
              <AlertDescription className="text-warm-beige text-sm">
                Please verify your email address. Check your inbox for the
                verification email.
              </AlertDescription>
            </div>
            <div className="flex justify-start">
              <Button
                className="w-full sm:w-auto"
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
          <div className="flex w-max flex-col gap-1 border-l-2 border-muted-faded-foreground/30 px-2 pl-4 font-sans">
            <p className="text-base font-medium">Active Sessions</p>
            <div className="grid grid-cols-[repeat(4,1fr)] grid-rows-[repeat(1,1fr)] gap-[8px] py-2">
              {sessions
                .filter((sessionData) => sessionData?.userAgent)
                .map((sessionData) => {
                  return (
                    <div
                      className="outline-groove group flex items-center justify-between gap-4 rounded-[12px] bg-transparent px-4 py-1.5 text-foreground shadow-xs/20 outline-1 transition-colors duration-200 ease-out-power3 hover:bg-muted-faded-background hover:text-muted-faded-foreground md:shadow-sm/20 dark:shadow-sm/25 md:dark:shadow-md/25"
                      style={{
                        outlineColor:
                          "oklch(from var(--muted-faded-fg) l c h /.3)"
                      }}
                      key={sessionData.id}
                    >
                      <span className="flex items-center gap-3 text-sm leading-[1] font-medium tracking-wide text-inherit">
                        {new UAParser(sessionData.userAgent || "").getDevice()
                          .type === "mobile" ? (
                          <MobileIcon
                            stroke={"currentColor"}
                            className="size-6"
                            strokeWidth={1}
                          />
                        ) : (
                          <Laptop
                            stroke={"currentColor"}
                            strokeWidth={1}
                            size={16}
                          />
                        )}
                        {new UAParser(sessionData.userAgent || "").getOS().name}
                        ,{" "}
                        {
                          new UAParser(sessionData.userAgent || "").getBrowser()
                            .name
                        }
                      </span>
                      {(session?.session.id === sessionData.id && (
                        <div className="-ml-1 font-sans text-sm font-bold text-bleu-900">
                          Current{" "}
                        </div>
                      )) || (
                        <Button
                          className="rounded-[10px] border-[1px] border-rouge-600 bg-rouge-500/30 px-2 text-xs font-medium text-foreground opacity-80 shadow-xs/20 transition-colors duration-200 ease-out-power3 group-hover:bg-rouge-500/50 group-hover:text-muted-foreground group-hover:opacity-100 dark:shadow-sm/25"
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
        <div className="flex items-center justify-between gap-10 border-y border-muted-faded-foreground/30 px-0 pt-4">
          <div className="flex h-full w-full flex-col gap-4">
            <div className="flex h-6 w-full items-center font-sans text-lg">
              Passkeys
            </div>
            <div className="flex h-12 w-full items-center justify-between">
              <div className="flex h-full w-full items-center border-r border-muted-faded-foreground/30 pr-4">
                <ListPasskeys />
              </div>
              <div className="flex h-full w-full items-center pl-4">
                <AddPasskey />
              </div>
            </div>
          </div>
          <div className="flex h-full w-full flex-col gap-2">
            <div className="flex h-6 w-full items-center font-sans text-lg">
              Two Factor
            </div>
            <div className="flex items-center gap-2">
              {currentUser && !!currentUser.twoFactorEnabled && (
                <DialogRoot>
                  <DialogTrigger
                    nativeButton={true}
                    render={() => (
                      <Button className="gap-2">
                        <QrCode size={16} />
                        <span className="text-xs md:text-sm">Scan QR Code</span>
                      </Button>
                    )}
                  />
                  <DialogContent className="w-11/12 sm:max-w-[425px]">
                    <DialogHeader>
                      <DialogTitle>Scan QR Code</DialogTitle>
                      <DialogDescription>
                        Scan the QR code with your TOTP app
                      </DialogDescription>
                    </DialogHeader>
                    {twoFactorVerifyURI ? (
                      <>
                        <div className="flex items-center justify-center">
                          <QRCode value={twoFactorVerifyURI} />
                        </div>
                        <div className="flex items-center justify-center gap-2">
                          <p className="text-sm">Copy URI to clipboard</p>
                          <CopyButton textToCopy={twoFactorVerifyURI} />
                        </div>
                      </>
                    ) : (
                      <div className="flex flex-col gap-2">
                        <PasswordInput
                          value={twoFaPassword}
                          onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                            setTwoFaPassword(e.target.value)
                          }
                          placeholder="Enter Password"
                        />
                        <Button
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
                        "items-center justify-center gap-2 rounded-md font-sans text-base",
                        (currentUser?.twoFactorEnabled &&
                          "border-bleu-700 px-6 py-3 text-bleu-700") ||
                          "flex border-[1px] border-transparent px-3 py-1 text-faded-foreground"
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
                <DialogContent className="w-11/12 sm:max-w-[425px]">
                  <DialogHeader>
                    <DialogTitle>
                      {currentUser?.twoFactorEnabled
                        ? "Disable 2FA"
                        : "Enable 2FA"}
                    </DialogTitle>
                    <DialogDescription>
                      {currentUser?.twoFactorEnabled
                        ? "Disable the second factor authentication from your account"
                        : "Enable 2FA to secure your account"}
                    </DialogDescription>
                  </DialogHeader>
                  {twoFactorVerifyURI ? (
                    <div className="flex flex-col gap-2">
                      <div className="flex items-center justify-center">
                        <QRCode value={twoFactorVerifyURI} />
                      </div>
                      <Label htmlFor="password">
                        Scan the QR code with your TOTP app
                      </Label>
                      <Input
                        value={twoFaPassword}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                          setTwoFaPassword(e.target.value)
                        }
                        placeholder="Enter OTP"
                      />
                    </div>
                  ) : (
                    <div className="flex flex-col gap-2">
                      <Label htmlFor="password">Password</Label>
                      <PasswordInput
                        id="password"
                        placeholder="Password"
                        value={twoFaPassword}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                          setTwoFaPassword(e.target.value)
                        }
                      />
                    </div>
                  )}
                  <DialogFooter>
                    <Button
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
      </CardContent>
      <CardFooter className="items-center justify-between gap-2">
        {accounts &&
          accounts.some((account) => {
            return account.scopes.includes("credential");
          }) && <ChangePassword />}
        <Button
          className="z-10 gap-2"
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
          <span className="text-sm">
            {isSignOut ? (
              <Loader2 size={15} className="animate-spin" />
            ) : (
              <div className="flex items-center gap-2">
                <LogOut size={16} />
                Sign Out{" "}
              </div>
            )}
          </span>
        </Button>
      </CardFooter>
    </Card>
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
          <Button className="z-10 gap-2">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="1em"
              height="1em"
              viewBox="0 0 24 24"
            >
              <path
                fill="currentColor"
                d="M2.5 18.5v-1h19v1zm.535-5.973l-.762-.442l.965-1.693h-1.93v-.884h1.93l-.965-1.642l.762-.443L4 9.066l.966-1.643l.761.443l-.965 1.642h1.93v.884h-1.93l.965 1.693l-.762.442L4 10.835zm8 0l-.762-.442l.966-1.693H9.308v-.884h1.93l-.965-1.642l.762-.443L12 9.066l.966-1.643l.761.443l-.965 1.642h1.93v.884h-1.93l.965 1.693l-.762.442L12 10.835zm8 0l-.762-.442l.966-1.693h-1.931v-.884h1.93l-.965-1.642l.762-.443L20 9.066l.966-1.643l.761.443l-.965 1.642h1.93v.884h-1.93l.965 1.693l-.762.442L20 10.835z"
              ></path>
            </svg>
            <span className="text-sm text-muted-foreground">
              Change Password
            </span>
          </Button>
        )}
      />
      <DialogContent className="w-11/12 sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Change Password</DialogTitle>
          <DialogDescription>Change your password</DialogDescription>
        </DialogHeader>
        <div className="grid gap-2">
          <Label htmlFor="current-password">Current Password</Label>
          <PasswordInput
            id="current-password"
            value={currentPassword}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              setCurrentPassword(e.target.value)
            }
            autoComplete="new-password"
            placeholder="Password"
          />
          <Label htmlFor="new-password">New Password</Label>
          <PasswordInput
            value={newPassword}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              setNewPassword(e.target.value)
            }
            autoComplete="new-password"
            placeholder="New Password"
          />
          <Label htmlFor="password">Confirm Password</Label>
          <PasswordInput
            value={confirmPassword}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              setConfirmPassword(e.target.value)
            }
            autoComplete="new-password"
            placeholder="Confirm Password"
          />
          <div className="flex items-center gap-2">
            <Checkbox
              onCheckedChange={(checked) =>
                checked ? setSignOutDevices(true) : setSignOutDevices(false)
              }
            />
            <p className="text-sm">Sign out from other devices</p>
          </div>
        </div>
        <DialogFooter>
          <Button
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
              <Loader2 size={15} className="animate-spin" />
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
          <Button className="gap-2">
            <Edit size={13} />
            Edit User
          </Button>
        )}
      />
      <DialogContent className="w-11/12 sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="font-sans text-3xl font-bold">
            Edit Profile
          </DialogTitle>
          <DialogDescription className="mt-1 mb-4 font-sans text-sm">
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
              <div className="flex flex-col gap-3">
                <Label htmlFor="name" className="font-sans">
                  First Name
                </Label>
                <Input
                  className="font-sans placeholder:font-sans placeholder:text-muted-faded-foreground/70 placeholder:transition-all placeholder:duration-300 placeholder:ease-power3 autofill:bg-transparent autofill:font-sans autofill:text-faded-foreground"
                  id="firstName"
                  type="firstName"
                  placeholder={currentUser?.firstName ?? ""}
                  required
                  onChange={(e) => {
                    setFirstName(e.target.value);
                  }}
                />
              </div>{" "}
              <div className="flex flex-col gap-3">
                <Label htmlFor="lastName" className="font-sans">
                  Last Name
                </Label>
                <Input
                  className="font-sans placeholder:font-sans placeholder:text-muted-faded-foreground/70 placeholder:transition-all placeholder:duration-300 placeholder:ease-power3 autofill:bg-transparent autofill:font-sans autofill:text-faded-foreground"
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
            <div className="flex flex-col gap-4">
              <Label htmlFor="image" className="font-sans">
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
                          <span className="text-lg">Upload File</span>
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
        <DialogFooter>
          <Button
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
              <Loader2 size={15} className="animate-spin" />
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
          <Button className="flex items-center gap-2 text-xs md:text-sm">
            <Plus size={15} />
            Add New Passkey
          </Button>
        )}
      />
      <DialogContent className="w-11/12 sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Add New Passkey</DialogTitle>
          <DialogDescription>
            Create a new passkey to securely access your account without a
            password.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-2">
          <Label htmlFor="passkey-name">Passkey Name</Label>
          <Input
            id="passkey-name"
            value={passkeyName}
            onChange={(e) => setPasskeyName(e.target.value)}
            className="!focus-visible:border-faded-foreground/90 !border-faded-foreground/&.5)] py-2 text-base placeholder:text-base placeholder:leading-[1.5] placeholder:text-faded-foreground"
          />
        </div>
        <DialogFooter>
          <Button
            disabled={isLoading}
            type="submit"
            onClick={handleAddPasskey}
            className="flex w-full items-center justify-center gap-2"
          >
            {isLoading ? (
              <Loader2 size={15} className="animate-spin" />
            ) : (
              <>
                <Fingerprint className="mr-2 h-4 w-4" />
                Create Passkey{" "}
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
          <Button className="flex items-center gap-2 text-xs md:text-sm">
            <Fingerprint className="mr-2 h-4 w-4" />
            <span>Passkeys {data?.length ? `[${data?.length}]` : ""}</span>
          </Button>
        )}
      />
      <DialogContent className="w-11/12 sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="font-sans text-h3 font-semibold tracking-tighter">
            Passkeys
          </DialogTitle>
          <DialogDescription className="mt-4 text-sm">
            List of passkeys
          </DialogDescription>
        </DialogHeader>
        {data?.length ? (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead style={{}}>Name</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.map((passkey) => (
                <TableRow
                  key={passkey.id}
                  className="flex items-center justify-between"
                >
                  <TableCell>{passkey.name || "My Passkey"}</TableCell>
                  <TableCell className="text-right">
                    <RP_Btn
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
                        <Loader2 size={15} className="animate-spin" />
                      ) : (
                        <Trash size={15} className="text-red-600" />
                      )}
                    </RP_Btn>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : (
          <p className="my-5 text-center text-sm">No passkeys found ;/</p>
        )}
        {!data?.length && (
          <div className="flex flex-col gap-2">
            <div className="flex flex-col gap-2">
              <Label htmlFor="passkey-name" className="text-sm font-normal">
                Add new passkey
              </Label>
              <Input
                className="!focus-visible:border-faded-foreground/90 border-faded-foreground/60 py-2 pb-3 text-lg placeholder:leading-[1.5] placeholder:text-muted-foreground"
                id="passkey-name"
                value={passkeyName}
                onChange={(e) => setPasskeyName(e.target.value)}
                placeholder="My Passkey"
              />
            </div>
            <Button
              type="submit"
              onClick={handleAddPasskey}
              className="group mt-5 flex h-13 w-full items-center justify-center gap-2 rounded-md border border-muted-faded-foreground/60 bg-muted-faded-background/70 text-faded-foreground/70 transition-colors duration-300 ease-power4 hover:border-muted-faded-foreground/90 hover:bg-muted-faded-foreground/50"
            >
              {isLoading ? (
                <Loader2 size={15} className="animate-spin" />
              ) : (
                <>
                  <Fingerprint className="mr-2 h-4 w-4 transition-colors duration-300 ease-power4 group-hover:text-foreground" />
                  Create Passkey{" "}
                </>
              )}
            </Button>
          </div>
        )}
        <DialogFooter>
          <Button
            className="transition-colors duration-300 ease-power4 hover:text-rouge-400"
            onClick={() => setIsOpen(false)}
          >
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </DialogRoot>
  );
}
