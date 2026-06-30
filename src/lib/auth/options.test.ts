import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const source = readFileSync(new URL("./options.ts", import.meta.url), {
  encoding: "utf8"
});
const authProvidersSource = readFileSync(
  new URL(
    "../../app/(frontend)/(site)/(auth)/authProviders.tsx",
    import.meta.url
  ),
  {
    encoding: "utf8"
  }
);
const envSource = readFileSync(new URL("../env.ts", import.meta.url), {
  encoding: "utf8"
});
const envTypesSource = readFileSync(
  new URL("../../environment.d.ts", import.meta.url),
  {
    encoding: "utf8"
  }
);

describe("auth options", () => {
  it("derives the passkey RP ID from the configured app URL", () => {
    expect(source).toContain("const appHost = new URL(appURL).hostname");
    expect(source).toContain("rpID: appHost");
    expect(source).not.toContain('rpID: new URL("http://localhost:3000")');
  });

  it("configures Kakao as a generic OAuth provider with minimal account scopes", () => {
    expect(source).toContain('providerId: "kakao"');
    expect(source).toContain("process.env.AUTH_KAKAO_ID");
    expect(source).toContain("process.env.AUTH_KAKAO_SECRET");
    expect(source).toContain(
      'authorizationUrl: "https://kauth.kakao.com/oauth/authorize"'
    );
    expect(source).toContain('tokenUrl: "https://kauth.kakao.com/oauth/token"');
    expect(source).toContain(
      'userInfoUrl: "https://kapi.kakao.com/v2/user/me"'
    );
    expect(source).toContain('scopes: ["profile_nickname", "account_email"]');
  });

  it("requires Kakao email before mapping a social user", () => {
    expect(source).toContain("function mapKakaoProfileToUser");
    expect(source).toContain("if (!email)");
    expect(source).toContain("Kakao did not return an email address");
  });

  it("trusts Kakao for account linking", () => {
    expect(source).toContain(
      'trustedProviders: ["google", "email-password", "naver", "kakao"]'
    );
  });

  it("trusts LOSTINSEOUL auth origins by default", () => {
    expect(source).toContain('"https://lostinseoul.com"');
    expect(source).toContain('"https://www.lostinseoul.com"');
  });

  it("renders Kakao in the generic OAuth provider list", () => {
    expect(authProvidersSource).toContain("KakaoIcon");
    expect(authProvidersSource).toContain(
      '{ provider: "kakao", name: "Kakao", icon: KakaoIcon }'
    );
  });

  it("declares Kakao secrets in runtime and type env schemas", () => {
    expect(envSource).toContain("AUTH_KAKAO_ID");
    expect(envSource).toContain("AUTH_KAKAO_SECRET");
    expect(envTypesSource).toContain('import { envSchema } from "./lib/env";');
    expect(envTypesSource).toContain(
      "interface ProcessEnv extends z.infer<Env>"
    );
  });
});
