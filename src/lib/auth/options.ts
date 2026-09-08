// import { openAPI } from "better-auth/plugins/open-api";
import {
  BetterAuthEmailService,
  sendAdminInviteWithEmailService
} from "@/lib/email/better-auth-integration";
import { formatUserHandle } from "@/payload/fields/handle/handleFormat";
import { generateName } from "@/utilities/names";
import { accessControl } from "@/lib/auth/permissions";
import {
  admin,
  author,
  cofounder,
  editor,
  patron,
  resident,
  user
} from "@/lib/auth/roles";
import { passkey } from "@better-auth/passkey";
import type { PayloadAuthOptions } from "@payload-auth/index";
import { BETTER_AUTH_CONTEXT_KEY } from "@payload-auth/better-auth/adapter";
import type { BetterAuthOptions as BetterAuthOptionsType } from "better-auth";
import { emailHarmony } from "better-auth-harmony";
import { nextCookies } from "better-auth/next-js";
import { admin as adminPlugin } from "better-auth/plugins/admin";
import { emailOTP } from "better-auth/plugins/email-otp";
import { magicLink } from "better-auth/plugins/magic-link";
import { multiSession } from "better-auth/plugins/multi-session";
import { organization } from "better-auth/plugins/organization";
import { twoFactor } from "better-auth/plugins/two-factor";
import { username } from "better-auth/plugins/username";

const emailService = new BetterAuthEmailService();

const USER_MANAGER_ROLES = new Set(["cofounder", "editor"]);
const ADMIN_USER_ROLES = new Set(["admin"]);
const MANAGEABLE_USER_ROLES = ["author", "patron", "resident", "user"] as const;
const MANAGEABLE_USER_ROLE_SET = new Set<string>(MANAGEABLE_USER_ROLES);
const MANAGER_WRITABLE_USER_FIELDS = new Set([
  "name",
  "image",
  "portrait",
  "bio",
  "displayUsername",
  "slug",
  "location",
  "link",
  "firstName",
  "lastName",
  "role"
]);

const hasRole = (user: unknown, roles: ReadonlySet<string>) => {
  if (!user || typeof user !== "object" || !("role" in user)) return false;
  const role = (user as { role?: string | string[] }).role;
  const values = Array.isArray(role)
    ? role
    : typeof role === "string"
      ? role.split(",").map((value) => value.trim())
      : [];
  return values.some((value) => roles.has(value));
};

const isBanned = (user: unknown) =>
  Boolean(
    user &&
    typeof user === "object" &&
    "banned" in user &&
    (user as { banned?: boolean }).banned
  );

const isBetterAuthAdapterRequest = (req: unknown) =>
  Boolean(
    req &&
    typeof req === "object" &&
    "context" in req &&
    req.context &&
    typeof req.context === "object" &&
    BETTER_AUTH_CONTEXT_KEY in req.context
  );

const appURL = process.env.NEXT_PUBLIC_BETTER_AUTH_URL!;
const appHost = new URL(appURL).hostname;
const trustedOrigins = Array.from(
  new Set(
    [
      appURL,
      process.env.NEXT_PUBLIC_PRODUCTION_URL,
      process.env.NEXT_PUBLIC_LOSTINSEOUL_URL,
      "https://lostinseoul.com",
      "https://www.lostinseoul.com"
    ].filter((origin): origin is string => Boolean(origin))
  )
);

function mapKakaoProfileToUser(profile: any) {
  const account = profile?.kakao_account ?? {};
  const kakaoProfile = account.profile ?? {};
  const email = account.email;

  if (!email) {
    throw new Error("Kakao did not return an email address.");
  }

  const username = email.split("@")[0] || `kakao-${profile.id}`;
  const displayName =
    kakaoProfile.nickname || profile?.properties?.nickname || username;
  const nameParts = displayName.split(" ").filter(Boolean);

  return {
    email,
    name: displayName,
    username,
    displayUsername: displayName,
    emailVerified:
      account.is_email_verified === true && account.is_email_valid !== false,
    slug: formatUserHandle(username),
    firstName: nameParts[0] || displayName,
    lastName: nameParts[1] || generateName("last"),
    banned: false,
    onboarded: false
  };
}

const options = {
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
          emailVerified: false,
          slug: formatUserHandle(username),
          firstName: p.name.split(" ")[0],
          lastName: p.name.split(" ")[1] || generateName("last"),
          image: p.profile_image,
          banned: false,
          onboarded: false
        };
      }
    },
    kakao: {
      clientId: process.env.AUTH_KAKAO_ID!,
      clientSecret: process.env.AUTH_KAKAO_SECRET!,
      disableDefaultScope: true,
      scope: ["profile_nickname", "account_email"],
      mapProfileToUser: mapKakaoProfileToUser
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
      sendChangeEmailConfirmation: async ({ user, newEmail, url }) => {
        try {
          await emailService.sendEmailChangeConfirmation(
            user.email,
            newEmail,
            url
          );
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
        defaultValue: "user",
        input: false
      },
      firstName: {
        type: "string",
        required: false
      },
      lastName: {
        type: "string",
        required: false
      },
      bio: {
        type: "string",
        required: false
      },
      location: {
        type: "string",
        required: false
      },
      link: {
        type: "string",
        required: false
      },
      portrait: {
        type: "string",
        required: false
      },
      slug: {
        type: "string",
        required: false
      },
      onboarded: {
        type: "boolean",
        required: true,
        defaultValue: false,
        input: false
      },
      verified: {
        type: "boolean",
        required: true,
        defaultValue: false,
        input: false
      }
    }
  },
  session: {
    cookieCache: {
      // Better Auth's compact session cache stores freshness metadata outside
      // `session.session.updatedAt`, but `freshSessionMiddleware` checks that
      // nested field. Passkey enrollment uses that middleware, so relying on
      // the cache makes newly signed-in sessions look stale. Keep freshness
      // checks database-backed instead of disabling the freshness requirement.
      enabled: false,
      maxAge: 5 * 60 // Cache duration in seconds
    }
  },
  account: {
    accountLinking: {
      enabled: false
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
    rpID: appHost,
    rpName: "The Hideaway",
    origin: appURL
  }),

  adminPlugin({
    ac: accessControl,
    roles: { admin, author, cofounder, editor, patron, resident, user }
  }),

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
    roles: [
      "admin",
      "cofounder",
      "editor",
      "author",
      "patron",
      "resident",
      "user"
    ],
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
      "link",
      "firstName",
      "lastName",
      "collections",
      "bookmarks"
    ],
    collectionOverrides: (options) => {
      const collection = { ...options.collection };
      const createAccess = collection.access?.create;
      const readAccess = collection.access?.read;
      const updateAccess = collection.access?.update;
      collection.access = {
        ...collection.access,
        admin: ({ req }) => {
          const user = req?.user;
          if (!user) return false;
          if (user.collection === "admins") return true;
          if (isBanned(user)) return false;
          return true;
        },
        create: (args) => {
          const user = args.req?.user;
          if (!user || isBanned(user)) return false;
          if (user.collection === "admins") return true;
          return typeof createAccess === "function"
            ? createAccess(args)
            : (createAccess ?? false);
        },
        read: (args) => {
          const user = args.req?.user;
          if (!user || isBanned(user)) return false;
          if (user.collection === "admins") return true;
          if (hasRole(user, USER_MANAGER_ROLES)) {
            return {
              or: [
                { id: { equals: user.id } },
                { role: { in: [...MANAGEABLE_USER_ROLES] } }
              ]
            };
          }
          return typeof readAccess === "function"
            ? readAccess(args)
            : (readAccess ?? false);
        },
        update: (args) => {
          const user = args.req?.user;
          if (!user) return false;
          if (isBanned(user)) return false;
          if (user.collection === "admins") return true;

          if (hasRole(user, USER_MANAGER_ROLES) && args.id !== user.id) {
            if (!args.id || !args.data) return false;
            const dataKeys = Object.keys(args.data);
            if (
              dataKeys.some((key) => !MANAGER_WRITABLE_USER_FIELDS.has(key))
            ) {
              return false;
            }
            if (
              "role" in args.data &&
              (typeof args.data.role !== "string" ||
                !MANAGEABLE_USER_ROLE_SET.has(args.data.role))
            ) {
              return false;
            }

            return {
              and: [
                { id: { equals: args.id } },
                { role: { in: [...MANAGEABLE_USER_ROLES] } }
              ]
            };
          }

          return typeof updateAccess === "function"
            ? updateAccess(args)
            : (updateAccess ?? false);
        },
        delete: (args) => {
          if (isBetterAuthAdapterRequest(args.req)) return true;
          const user = args.req?.user;
          if (!user) return false;
          if (isBanned(user)) return false;
          if (user.collection === "admins") return true;
          return hasRole(user, ADMIN_USER_ROLES);
        }
      };
      collection.admin = {
        ...collection.admin,
        hidden: ({ user }) => {
          if (!user) return true;

          if (user?.role === "admin") return false;
          if (user?.role === "editor") return false;
          if (user?.role === "cofounder") return false;
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
    sendInviteEmail: sendAdminInviteWithEmailService
  },
  betterAuthOptions
} satisfies PayloadAuthOptions;
export type ConstructedBetterAuthPluginOptions = typeof betterAuthPluginOptions;
