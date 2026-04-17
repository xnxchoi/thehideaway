"use client";

import { Link } from "@/components/core/Link/Link";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle
} from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { SettingsCardClassNames } from "@betterauth-ui";
import { ArrowLeftIcon } from "lucide-react";
import { type ReactNode, useContext, useEffect, useState } from "react";

import { useIsHydrated } from "../../hooks/use-hydrated";
import { AuthUIContext } from "../../lib/auth-ui-provider";
import { socialProviders } from "../../lib/social-providers";
import type { AuthViewPath as AuthView } from "../../lib/view-paths";
import type { AuthLocalization } from "../../localization/auth-localization";
import { AcceptInvitationCard } from "../organization/accept-invitation-card";
import { AuthCallback } from "./auth-callback";
import { AuthForm, type AuthFormClassNames } from "./auth-form";
import { EmailOTPButton } from "./email-otp-button";
import { MagicLinkButton } from "./magic-link-button";
import { OneTap } from "./one-tap";
import { PasskeyButton } from "./passkey-button";
import { ProviderButton } from "./provider-button";
import { SignOut } from "./sign-out";

export interface AuthCardClassNames {
  base?: string;
  content?: string;
  description?: string;
  footer?: string;
  footerLink?: string;
  continueWith?: string;
  form?: AuthFormClassNames;
  header?: string;
  separator?: string;
  settings?: SettingsCardClassNames;
  title?: string;
}

export interface AuthCardProps {
  className?: string;
  classNames?: AuthCardClassNames;
  callbackURL?: string;
  cardHeader?: ReactNode;
  /**
   * @default authLocalization
   * @remarks `AuthLocalization`
   */
  localization?: AuthLocalization;
  pathname?: string;
  redirectTo?: string;
  /**
   * @default "auto"
   */
  socialLayout?: "auto" | "horizontal" | "grid" | "vertical";
  /**
   * @remarks `AuthView`
   */
  view?: AuthView;
  /**
   * @default 0
   */
  otpSeparators?: 0 | 1 | 2;
}

export function AuthCard({
  className,
  classNames,
  callbackURL,
  cardHeader,
  localization,
  pathname,
  redirectTo,
  socialLayout = "auto",
  view,
  otpSeparators = 0
}: AuthCardProps) {
  const isHydrated = useIsHydrated();

  const {
    basePath,
    credentials,
    localization: contextLocalization,
    magicLink,
    emailOTP,
    oneTap,
    passkey,
    account,
    signUp,
    social,
    genericOAuth,
    viewPaths,
    replace,
    Link
  } = useContext(AuthUIContext);

  localization = { ...contextLocalization, ...localization };

  if (socialLayout === "auto") {
    socialLayout = !credentials
      ? "vertical"
      : social?.providers && social.providers.length > 2
        ? "horizontal"
        : "vertical";
  }

  view = view || "SIGN_IN";

  const [isSubmitting, setIsSubmitting] = useState(false);

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

  if (view === "CALLBACK") return <AuthCallback redirectTo={redirectTo} />;
  if (view === "SIGN_OUT") return <SignOut />;

  if (view === "ACCEPT_INVITATION")
    return (
      <AcceptInvitationCard
        className={className}
        classNames={classNames}
        localization={localization}
      />
    );

  const description =
    !credentials && !magicLink && !emailOTP
      ? localization.DISABLED_CREDENTIALS_DESCRIPTION
      : localization[`${view}_DESCRIPTION` as keyof typeof localization];

  return (
    <div className={cn("flex flex-col gap-9")}>
      <Card className="bg-faded-background/50">
        <CardHeader className={cn("gap-0 text-center", classNames?.header)}>
          {cardHeader ? (
            cardHeader
          ) : (
            <>
              <CardTitle
                className={cn(
                  "mb-2 font-sans text-4xl font-medium tracking-tight text-off-foreground",
                  classNames?.title
                )}
              >
                {localization[view as keyof typeof localization]}
              </CardTitle>
              {description && (
                <CardDescription
                  className={cn(
                    "font-sans text-xs md:text-sm",
                    classNames?.description
                  )}
                >
                  {description}
                </CardDescription>
              )}
            </>
          )}
        </CardHeader>
        <CardContent className={cn("grid gap-9", classNames?.content)}>
          {oneTap &&
            view &&
            (
              ["SIGN_IN", "SIGN_UP", "MAGIC_LINK", "EMAIL_OTP"] as AuthView[]
            ).includes(view) && (
              <OneTap localization={localization} redirectTo={redirectTo} />
            )}
          {(credentials || magicLink || emailOTP) && ( // <div className="grid gap-4">
            <div className="flex flex-col gap-7">
              <AuthForm
                classNames={classNames?.form}
                callbackURL={callbackURL}
                isSubmitting={isSubmitting}
                localization={localization}
                otpSeparators={otpSeparators}
                pathname={pathname}
                redirectTo={redirectTo}
                setIsSubmitting={setIsSubmitting}
              />
              {view &&
                magicLink &&
                ((credentials &&
                  [
                    "FORGOT_PASSWORD",
                    "SIGN_UP",
                    "SIGN_IN",
                    "MAGIC_LINK",
                    "EMAIL_OTP"
                  ].includes(view)) ||
                  (emailOTP && view === "EMAIL_OTP")) && (
                  <MagicLinkButton
                    classNames={classNames}
                    localization={localization}
                    view={view}
                    isSubmitting={isSubmitting}
                  />
                )}
              {view &&
                emailOTP &&
                ((credentials &&
                  [
                    "FORGOT_PASSWORD",
                    "SIGN_UP",
                    "SIGN_IN",
                    "MAGIC_LINK",
                    "EMAIL_OTP"
                  ].includes(view)) ||
                  (magicLink && ["SIGN_IN", "MAGIC_LINK"].includes(view))) && (
                  <EmailOTPButton
                    classNames={classNames}
                    localization={localization}
                    view={view}
                    isSubmitting={isSubmitting}
                  />
                )}
            </div>
          )}
          {view !== "RESET_PASSWORD" &&
            (social?.providers?.length ||
              genericOAuth?.providers?.length ||
              (view === "SIGN_IN" && passkey)) && (
              <>
                {(credentials || magicLink || emailOTP) && (
                  <div
                    className={cn(
                      // "flex items-center gap-2",
                      "relative flex h-[3px] w-full items-center justify-center gap-[1px] bg-transparent",
                      classNames?.continueWith
                    )}
                  >
                    <div
                      className={
                        "relative -left-1 h-[1px] flex-[1_1_35%] bg-linear-to-r from-transparent to-foreground/70"
                      }
                    ></div>
                    <div className={"px-[1px] text-center text-[12px]"}>
                      {localization.OR_CONTINUE_WITH}
                    </div>
                    <div
                      className={
                        "relative -right-1 h-[1px] flex-[1_1_35%] bg-linear-to-r from-foreground/70 to-transparent"
                      }
                    ></div>
                  </div>
                )}
                <div className="grid gap-4">
                  {(social?.providers?.length ||
                    genericOAuth?.providers?.length) && (
                    <div
                      className={cn(
                        "flex w-full items-center justify-between gap-4",
                        socialLayout === "horizontal" && "flex-wrap",
                        socialLayout === "vertical" && "flex-col",
                        socialLayout === "grid" && "grid grid-cols-2"
                      )}
                    >
                      {social?.providers?.map((provider) => {
                        const socialProvider = socialProviders.find(
                          (socialProvider) =>
                            socialProvider.provider === provider
                        );
                        if (!socialProvider) return null;

                        return (
                          <ProviderButton
                            key={provider}
                            classNames={classNames}
                            callbackURL={callbackURL}
                            isSubmitting={isSubmitting}
                            localization={localization}
                            provider={socialProvider}
                            redirectTo={redirectTo}
                            setIsSubmitting={setIsSubmitting}
                            socialLayout={socialLayout}
                          />
                        );
                      })}
                      {genericOAuth?.providers?.map((provider) => (
                        <ProviderButton
                          key={provider.provider}
                          classNames={classNames}
                          callbackURL={callbackURL}
                          isSubmitting={isSubmitting}
                          localization={localization}
                          provider={provider}
                          redirectTo={redirectTo}
                          setIsSubmitting={setIsSubmitting}
                          socialLayout={socialLayout}
                          other
                        />
                      ))}
                    </div>
                  )}
                  {passkey &&
                    view &&
                    [
                      "SIGN_IN",
                      "MAGIC_LINK",
                      "EMAIL_OTP",
                      "RECOVER_ACCOUNT",
                      "TWO_FACTOR",
                      "FORGOT_PASSWORD"
                    ].includes(view) && (
                      <PasskeyButton
                        classNames={classNames}
                        isSubmitting={isSubmitting}
                        localization={localization}
                        redirectTo={redirectTo}
                        setIsSubmitting={setIsSubmitting}
                      />
                    )}
                </div>
              </>
            )}
        </CardContent>
        {credentials && signUp && (
          <CardFooter
            className={cn(
              "justify-center gap-1.5 text-sm text-muted-faded-foreground",
              classNames?.footer
            )}
          >
            {view === "SIGN_IN" ||
            view === "MAGIC_LINK" ||
            view === "EMAIL_OTP" ? (
              localization.DONT_HAVE_AN_ACCOUNT
            ) : view === "SIGN_UP" ? (
              localization.ALREADY_HAVE_AN_ACCOUNT
            ) : (
              <ArrowLeftIcon className="size-3" />
            )}
            {view === "SIGN_IN" ||
            view === "MAGIC_LINK" ||
            view === "EMAIL_OTP" ||
            view === "SIGN_UP" ? (
              <Link
                className={cn(
                  "text-foreground underline",
                  classNames?.footerLink
                )}
                href={`${basePath}/${viewPaths[view === "SIGN_IN" || view === "MAGIC_LINK" || view === "EMAIL_OTP" ? "SIGN_UP" : "SIGN_IN"]}${isHydrated ? window.location.search : ""}`}
              >
                <Button
                  variant="link"
                  size="sm"
                  className={cn(
                    "px-0 text-foreground underline",
                    classNames?.footerLink
                  )}
                >
                  {view === "SIGN_IN" ||
                  view === "MAGIC_LINK" ||
                  view === "EMAIL_OTP"
                    ? localization.SIGN_UP
                    : localization.SIGN_IN}
                </Button>
              </Link>
            ) : (
              <Button
                variant="link"
                size="sm"
                className={cn(
                  "px-0 text-foreground underline",
                  classNames?.footerLink
                )}
                onClick={() => window.history.back()}
              >
                {localization.GO_BACK}
              </Button>
            )}
          </CardFooter>
        )}
      </Card>
      <div className="text-center text-sm text-balance text-muted-faded-foreground *:[a]:underline *:[a]:underline-offset-4 *:[a]:hover:text-primary">
        By clicking continue, you agree to our
        <span className="group relative mx-1 inline-flex items-center justify-center p-0">
          <Link
            href="/terms-of-service"
            className="ease no-underline decoration-0 transition-colors duration-200 hover:text-foreground"
          >
            Terms of Service
          </Link>
          <span className="ease absolute bottom-[.5px] left-0 z-0 h-[1px] w-full origin-left scale-x-0 bg-foreground/80 transition-transform duration-300 group-hover:scale-x-100"></span>
          <span className="ease absolute bottom-[.5px] left-0 z-0 h-[1px] w-full origin-right scale-x-100 bg-muted-faded-background/80 transition-transform duration-300 group-hover:scale-x-0"></span>
        </span>
        and{" "}
        <span className="group relative mx-1 inline-flex items-center justify-center p-0">
          <Link
            href="/policy"
            className="ease no-underline decoration-0 transition-colors duration-200 hover:text-foreground"
          >
            Privacy Policy
          </Link>
          <span className="ease absolute bottom-[.5px] left-0 z-0 h-[1px] w-full origin-left scale-x-0 bg-foreground/80 transition-transform duration-300 group-hover:scale-x-100"></span>
          <span className="ease absolute bottom-[.5px] left-0 z-0 h-[1px] w-full origin-right scale-x-100 bg-muted-faded-background/80 transition-transform duration-300 group-hover:scale-x-0"></span>
        </span>
        .
      </div>
    </div>
  );
}
