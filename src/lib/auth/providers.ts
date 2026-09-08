import {
  GoogleIcon,
  KakaoIcon,
  NaverIcon,
  type ProviderIcon
} from "@/components/auth/icons";

export type AuthProviderKind = "social" | "generic";

export type AuthProvider = {
  id: string;
  name: string;
  icon: ProviderIcon;
  kind: AuthProviderKind;
};

export const AUTH_PROVIDERS: AuthProvider[] = [
  { id: "google", name: "Google", icon: GoogleIcon, kind: "social" },
  { id: "naver", name: "Naver", icon: NaverIcon, kind: "social" },
  { id: "kakao", name: "Kakao", icon: KakaoIcon, kind: "social" }
];

export const SOCIAL_AUTH_PROVIDERS = AUTH_PROVIDERS.filter(
  (provider) => provider.kind === "social"
);
