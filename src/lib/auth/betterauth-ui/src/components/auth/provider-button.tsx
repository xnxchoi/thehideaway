import type { SocialProvider } from "better-auth/social-providers";
import { useCallback, useContext } from "react";

import { AuthUIContext } from "../../lib/auth-ui-provider";
import type { Provider } from "../../lib/social-providers";
import { cn, getLocalizedError, getSearchParam } from "../../lib/utils";
import type { AuthLocalization } from "../../localization/auth-localization";
import { Button } from "../ui/button";
import type { AuthViewClassNames } from "./auth-view";
import { Loader2 } from "lucide-react";

interface ProviderButtonProps {
  className?: string;
  classNames?: AuthViewClassNames;
  callbackURL?: string;
  isSubmitting: boolean;
  localization: Partial<AuthLocalization>;
  other?: boolean;
  provider: Provider;
  redirectTo?: string;
  socialLayout: "auto" | "horizontal" | "grid" | "vertical";
  setIsSubmitting: (isSubmitting: boolean) => void;
}

export function ProviderButton({
  className,
  classNames,
  callbackURL: callbackURLProp,
  isSubmitting,
  localization,
  other,
  provider,
  redirectTo: redirectToProp,
  socialLayout,
  setIsSubmitting
}: ProviderButtonProps) {
  const {
    authClient,
    basePath,
    baseURL,
    persistClient,
    redirectTo: contextRedirectTo,
    viewPaths,
    social,
    genericOAuth,
    toast
  } = useContext(AuthUIContext);

  const getRedirectTo = useCallback(
    () => redirectToProp || getSearchParam("redirectTo") || contextRedirectTo,
    [redirectToProp, contextRedirectTo]
  );

  const getCallbackURL = useCallback(
    () =>
      `${baseURL}${
        callbackURLProp ||
        (persistClient
          ? `${basePath}/${viewPaths.CALLBACK}?redirectTo=${getRedirectTo()}`
          : getRedirectTo())
      }`,
    [
      callbackURLProp,
      persistClient,
      basePath,
      viewPaths,
      baseURL,
      getRedirectTo
    ]
  );

  const doSignInSocial = async () => {
    setIsSubmitting(true);

    try {
      if (other) {
        const oauth2Params = {
          providerId: provider.provider,
          callbackURL: getCallbackURL(),
          fetchOptions: { throw: true }
        };

        if (genericOAuth?.signIn) {
          await genericOAuth.signIn(oauth2Params);

          setTimeout(() => {
            setIsSubmitting(false);
          }, 10000);
        } else {
          await authClient.signIn.oauth2(oauth2Params);
        }
      } else {
        const socialParams = {
          provider: provider.provider as SocialProvider,
          callbackURL: getCallbackURL(),
          fetchOptions: { throw: true }
        };

        if (social?.signIn) {
          await social.signIn(socialParams);

          setTimeout(() => {
            setIsSubmitting(false);
          }, 10000);
        } else {
          await authClient.signIn.social(socialParams);
        }
      }
    } catch (error) {
      toast({
        variant: "error",
        message: getLocalizedError({ error, localization })
      });

      setIsSubmitting(false);
    }
  };

  return (
    <Button
      variant="outline"
      className="*:ease text-md ease inline-flex h-14 min-h-[35px] w-full items-center justify-center gap-[8px] rounded-md border border-faded-foreground/65)] bg-off-background/30 px-4 py-3 font-medium whitespace-nowrap text-foreground shadow-sm transition-colors duration-300 *:transition-colors *:duration-300 hover:bg-faded-background/65 hover:*:text-off-foreground focus-visible:ring-1 focus-visible:ring-ring focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-6 [&_svg]:shrink-0"
      disabled={isSubmitting}
      onClick={doSignInSocial}
      data-themed={"background-color,color"}
    >
      {isSubmitting && <Loader2 className="animate-spin" />}
      {!isSubmitting && provider.icon && (
        <provider.icon className={classNames?.form?.icon} />
      )}
      {!isSubmitting && socialLayout === "grid" && provider.name}
      {!isSubmitting &&
        socialLayout === "vertical" &&
        `${localization.SIGN_IN_WITH} ${provider.name}`}
    </Button>
  );
}
