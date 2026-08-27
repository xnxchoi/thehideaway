"use client";
import { AuthUIProvider } from "@betterauth-ui";
import { authClient } from "@/lib/auth/client";
import { Link } from "@/components/core/Link/Link";
import { useRouter } from "next/navigation";
import { KakaoIcon, NaverIcon } from "@betterauth-ui/components/provider-icons";

export const Providers = ({ children }: { children: React.ReactNode }) => {
  const router = useRouter();
  const hidePasskeys =
    typeof window !== "undefined" &&
    ["lostinseoul.com", "www.lostinseoul.com"].includes(
      window.location.hostname
    );

  return (
    <AuthUIProvider
      authClient={authClient}
      navigate={router.push}
      replace={router.replace}
      signUp={{
        fields: ["name", "location", "bio", "link"]
      }}
      passkey={!hidePasskeys}
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
        providers: [
          { provider: "naver", name: "Naver", icon: NaverIcon },
          { provider: "kakao", name: "Kakao", icon: KakaoIcon }
        ]
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
