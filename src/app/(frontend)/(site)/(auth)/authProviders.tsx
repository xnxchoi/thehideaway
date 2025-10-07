"use client";
import { AuthUIProvider } from "@/lib/auth/betterauth-ui/src";
import { authClient } from "@/lib/auth/client";
import { Link } from "@/components/UX/Link/Link";
import { useTransitionRouter } from "next-transition-router";

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
        forgotPassword: false,
        confirmPassword: false,
        username: true
      }}
      account={{
        viewPaths: {
          SETTINGS: "settings"
        }
      }}
      social={{ providers: ["google"] }}
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
          placeholder: "https://hideawayseoul.com/",
          required: false,
          description: "Your website or social media link"
        }
      }}
    >
      {children}
    </AuthUIProvider>
  );
};
