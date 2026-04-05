"use client";
import { AuthUIProvider } from "@/lib/auth/betterauth-ui/src";
import { authClient } from "@/lib/auth/client";
import { Link } from "@/components/core/Link/Link";
import { useTransitionRouter } from "next-transition-router";
import { NaverIcon } from "@/lib/auth/betterauth-ui/src/components/provider-icons";

export const Providers = ({ children }: { children: React.ReactNode }) => {
  const router = useTransitionRouter();

  return (
    <AuthUIProvider
      authClient={authClient}
      navigate={router.push}
      replace={router.replace}
      onSessionChange={router.refresh}
      signUp={{
        fields: ["name", "email", "password", "location", "bio", "link"]
      }}
      passkey={true}
      credentials={{
        forgotPassword: true,
        confirmPassword: false,
        username: true
      }}
      account={{
        viewPaths: {
          SETTINGS: "settings"
        }
      }}
      social={{ providers: ["google"] }}
      genericOAuth={{
        providers: [{ provider: "naver", name: "Naver", icon: NaverIcon }]
      }}
      basePath="/"
      Link={Link}
      viewPaths={{
        SIGN_IN: "sign-in",
        SIGN_UP: "sign-up",
        FORGOT_PASSWORD: "forgot-password",
        RESET_PASSWORD: "reset-password",
        TWO_FACTOR: "two-factor"
      }}
      additionalFields={{
        location: {
          type: "string",
          label: "Location",
          placeholder: "Seoul, South Korea",
          required: false,
          description: "Where are you from?"
        },
        bio: {
          type: "string",
          label: "Bio",
          placeholder: "I am an artist...",
          required: false,
          description: "Tell us about yourself"
        },
        link: {
          type: "string",
          label: "Link",
          placeholder: "",
          required: false,
          description: "Your website or social media link"
        }
      }}
    >
      {children}
    </AuthUIProvider>
  );
};
