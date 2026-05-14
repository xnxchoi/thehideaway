// import { openAPI } from "better-auth/plugins/open-api";
import { BetterAuthEmailService } from "@/lib/email/better-auth-integration";
import { formatUserHandle } from "@/payload/fields/handle/formatUserHandle";
import { generateName } from "@/utilities/names";
import { passkey } from "@better-auth/passkey";
import type { PayloadAuthOptions } from "@payload-auth/index";
import type { BetterAuthOptions as BetterAuthOptionsType } from "better-auth";
import { emailHarmony } from "better-auth-harmony";
import { nextCookies } from "better-auth/next-js";
import { admin as adminPlugin } from "better-auth/plugins/admin";
import { emailOTP } from "better-auth/plugins/email-otp";
import { genericOAuth } from "better-auth/plugins/generic-oauth";
import { magicLink } from "better-auth/plugins/magic-link";
import { multiSession } from "better-auth/plugins/multi-session";
import { organization } from "better-auth/plugins/organization";
import { twoFactor } from "better-auth/plugins/two-factor";
import { username } from "better-auth/plugins/username";

const emailService = new BetterAuthEmailService();

const appURL = process.env.NEXT_PUBLIC_BETTER_AUTH_URL!;
const trustedOrigins = [appURL];
if (process.env.NEXT_PUBLIC_PRODUCTION_URL) {
  trustedOrigins.push(process.env.NEXT_PUBLIC_PRODUCTION_URL);
}

const options: BetterAuthOptionsType = {
  appName: "hideaway-validator",
  // Drives whether Better Auth issues the `__Secure-` prefixed cookie
  // (only when baseURL is https). Hardcoding localhost shipped the
  // production session cookie without the `Secure` flag, meaning the
  // browser would transmit it over plain HTTP — defence-in-depth
  // failure even if all upstream traffic is TLS-terminated. Read from
  // the same env var the trusted-origins list uses.
  baseURL: appURL,
  trustedOrigins,
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: true,
    async sendResetPassword({ user, url }) {
      try {
        await emailService.sendPasswordReset(user.email, url);
      } catch (error) {
        console.error("Failed to send password reset email:", error);
      }
    }
  },
  socialProviders: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID as string,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
      mapProfileToUser: async (profile) => {
        const {
          email,
          name,
          given_name,
          family_name,
          picture,
          email_verified
        } = profile;
        const username = profile.email.split("@")[0];
        return {
          email,
          name,
          username,
          onboarded: false,
          displayUsername: name,
          emailVerified: email_verified,
          firstName: given_name,
          slug: formatUserHandle(username),
          lastName: family_name,
          image: picture,
          banned: false
        };
      }
    },
    naver: {
      clientId: process.env.AUTH_NAVER_ID!,
      clientSecret: process.env.AUTH_NAVER_SECRET!,
      mapProfileToUser: async (profile) => {
        // Naver user info is nested under profile.response
        const p = profile.response || profile;
        const email = p.email || "";
        const username = email.split("@")[0] || p.nickname || p.id;
        return {
          email,
          name: p.name || p.nickname || username,
          username,
          displayUsername: p.nickname || p.name || username,
          emailVerified: true,
          slug: formatUserHandle(username),
          firstName: p.name.split(" ")[0],
          lastName: p.name.split(" ")[1] || generateName("last"),
          image: p.profile_image,
          banned: false,
          onboarded: false
        };
      }
    }
  },
  emailVerification: {
    sendOnSignUp: true,
    autoSignInAfterVerification: true,
    async sendVerificationEmail({ user, url }) {
      try {
        // Better Auth passes the full URL; OTP is the token in the URL
        const otp = url.split("=").pop() || "";
        await emailService.sendOTP(user.email, otp, "email-verification");
      } catch (error) {
        console.error("Failed to send verification email:", error);
      }
    }
  },

  user: {
    changeEmail: {
      enabled: true,
      sendChangeEmailVerification: async ({ user, newEmail, url, token }) => {
        try {
          await emailService.sendOTP(newEmail, token, "email-verification");
        } catch (error) {
          console.error("Failed to send change email verification:", error);
        }
      }
    },
    deleteUser: {
      enabled: true,
      sendDeleteAccountVerification: async ({ user, url, token }) => {
        // Send delete account verification
      },
      beforeDelete: async (user) => {
        // Perform actions before user deletion
      },
      afterDelete: async (user) => {
        // Perform cleanup after user deletion
      }
    },
    additionalFields: {
      role: {
        type: "string",
        defaultValue: "author",
        input: false
      }
    }
  },
  session: {
    cookieCache: {
      enabled: true,
      maxAge: 5 * 60 // Cache duration in seconds
    }
  },
  account: {
    accountLinking: {
      enabled: true,
      trustedProviders: ["google", "email-password", "naver"]
    }
  },

  advanced: {
    database: {
      generateId: "uuid"
    }
  }
} satisfies BetterAuthOptionsType;
export const betterAuthPlugins = [
  username(),
  emailHarmony(),
  twoFactor({
    issuer: "hideaway-validator",
    otpOptions: {
      async sendOTP({ user, otp }) {
        try {
          const userEmail = (user as any).email || "";
          await emailService.send2FACode(userEmail, otp);
        } catch (error) {
          console.error("Failed to send 2FA OTP:", error);
        }
      }
    }
  }),
  magicLink({
    sendMagicLink: async ({ email, token, url }, _request) => {
      try {
        await emailService.sendMagicLink(email, token, url);
      } catch (error) {
        console.error("Failed to send magic link:", error);
      }
    }
  }),
  emailOTP({
    async sendVerificationOTP({ email, otp, type }) {
      try {
        await emailService.sendOTP(
          email,
          otp,
          type as "sign-in" | "email-verification"
        );
      } catch (error) {
        console.error("Failed to send verification OTP:", error);
      }
    }
  }),
  passkey({
    rpID: new URL('http://localhost:3000').hostname,
    rpName: "The Hideaway",
    origin: appURL
  }),

  adminPlugin(),

  organization({
    teams: {
      enabled: true
    },
    async sendInvitationEmail(data) {
      const inviteLink = `${appURL}/accept-invitation/${data.id}`;
      // TODO(orgs): wire to BetterAuthEmailService when organization
      // invites ship. Logging the invite link to stdout would leak a
      // join token — silently no-op for now.
      void inviteLink;
    }
  }),
  multiSession(),
  genericOAuth({
    config: [
      {
        providerId: "naver",
        clientId: process.env.AUTH_NAVER_ID!,
        clientSecret: process.env.AUTH_NAVER_SECRET!,
        authorizationUrl: "https://nid.naver.com/oauth2.0/authorize",
        tokenUrl: "https://nid.naver.com/oauth2.0/token",
        userInfoUrl: "https://openapi.naver.com/v1/nid/me",
        scopes: ["profile", "email"],
        mapProfileToUser: async (profile) => {
          // Naver user info is nested under profile.response
          const p = (profile as any).response || profile;
          const email = p.email || "";
          const username = email.split("@")[0] || p.nickname || p.id;
          return {
            email,
            name: p.name || p.nickname || username,
            username,
            displayUsername: p.nickname || p.name || username,
            emailVerified: true,
            slug: formatUserHandle(username),
            firstName: p.name?.split(" ")[0],
            image: p.profile_image,
            banned: false,
            onboarded: false
          };
        }
      }
    ]
  }),
  // openAPI(),
  nextCookies()
] satisfies BetterAuthOptionsType["plugins"];

export type BetterAuthPlugins = typeof betterAuthPlugins;

export const betterAuthOptions = {
  ...options,
  plugins: betterAuthPlugins
} satisfies BetterAuthOptionsType;
export type BetterAuthOptions = typeof betterAuthOptions;
export const betterAuthPluginOptions = {
  disabled: false,
  debug: {
    logTables: process.env.NODE_ENV !== "production",
    enableDebugLogs: false
  },
  disableDefaultPayloadAuth: true,
  hidePluginCollections: true,
  users: {
    slug: "users", // not required, this is the default anyways
    hidden: false,
    roles: ["admin", "editor", "author", "patron", "member", "user"],
    defaultRole: "user",

    adminRoles: ["admin"],
    allowedFields: [
      "name",
      "image",
      "portrait",
      "bio",
      "displayUsername",
      "slug",
      "location",
      "firstName",
      "lastName",
      "collections",
      "bookmarks"
    ],
    collectionOverrides: (options) => {
      const collection = { ...options.collection };
      collection.access = {
        ...collection.access,
        admin: ({ req }) => {
          const user = req?.user;
          if (!user) return false;
          if (user.collection === "admins") return true;
          if (
            user &&
            typeof user === "object" &&
            "banned" in user &&
            (user as any).banned
          )
            return false;
          return true;
        },

        update: ({ req }) => {
          const user = req?.user;
          if (!user) return false;
          if (user.collection === "admins") return true;
          if (user.role === "admin") {
            return true;
          }
          if (
            user &&
            typeof user === "object" &&
            "banned" in user &&
            (user as any).banned
          ) {
            return false;
          }
          return {
            id: {
              equals: user.id
            }
          };
        },
        delete: ({ req }) => {
          const user = req.user;
          if (user?.collection === "admins") return true;
          if (user && user.role === "admin") {
            return true;
          }

          return {
            id: {
              equals: user?.id
            }
          };
        }
      };
      collection.admin = {
        ...collection.admin,
        hidden: ({ user }) => {
          if (!user) return true;

          if (user?.role === "admin") return false;
          if (user?.role === "editor") return false;
          return true;
        }
      };

      return collection;
    }
  },
  accounts: {
    slug: "accounts",
    collectionOverrides: (options) => {
      options.collection.admin = {
        ...options.collection.admin,
        hidden: ({ user }) => {
          if (!user) return true;
          if (user?.role === "admin") return false;
          return true;
        }
      };
      return options.collection;
    }
  },
  sessions: {
    slug: "sessions",
    collectionOverrides: (options) => {
      options.collection.admin = {
        ...options.collection.admin,
        hidden: ({ user }) => {
          if (!user) return true;
          if (user?.role === "admin") return false;
          return true;
        }
      };

      return options.collection;
    }
  },
  verifications: {
    slug: "verifications",
    collectionOverrides: (options) => {
      options.collection.admin = {
        ...options.collection.admin,
        hidden: ({ user }) => {
          if (!user) return true;
          if (user?.role === "admin") return false;
          return true;
        }
      };
      return options.collection;
    }
  },
  adminInvitations: {
    sendInviteEmail: async ({ payload, email, url }) => {
      // TODO(admin-invites): plumb through emailService. Don't log
      // the invite URL — it's a single-use join token.
      void email;
      void url;
      void payload;
      return {
        success: true
      };
    }
  },
  betterAuthOptions
} satisfies PayloadAuthOptions;
export type ConstructedBetterAuthPluginOptions = typeof betterAuthPluginOptions;
