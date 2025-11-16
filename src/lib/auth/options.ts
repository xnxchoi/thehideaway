import type { BetterAuthOptions as BetterAuthOptionsType } from "better-auth";
import { emailHarmony } from "better-auth-harmony";
import { admin as adminPlugin } from "better-auth/plugins/admin";
import { emailOTP } from "better-auth/plugins/email-otp";
import { magicLink } from "better-auth/plugins/magic-link";
import { multiSession } from "better-auth/plugins/multi-session";
import { organization } from "better-auth/plugins/organization";
import { passkey } from "better-auth/plugins/passkey";
import { twoFactor } from "better-auth/plugins/two-factor";
import { username } from "better-auth/plugins/username";
// import { openAPI } from "better-auth/plugins/open-api";
// import { nextCookies } from "better-auth/plugins/next-cookies";
import { accessControl } from "@/lib/auth/permissions";
import { admin, author, editor, patron, user } from "@/lib/auth/roles";
import { BetterAuthEmailService } from "@/lib/email/better-auth-integration";
import { type Where } from "payload";
import type { BetterAuthPluginOptions as BetterAuthPluginOptionsType } from "payload-auth";
import { uuidv7 } from "uuidv7";
import { canCreateOrg } from "./hooks/canCreateOrg";

// Initialize email service
const emailService = new BetterAuthEmailService();

const options: BetterAuthOptionsType = {
  appName: "hideaway-validator",
  baseURL: process.env.NEXT_PUBLIC_BETTER_AUTH_URL,
  trustedOrigins: [process.env.NEXT_PUBLIC_BETTER_AUTH_URL!],
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: true,
    // autoSignIn: true,
    async sendResetPassword({ user, url }) {
      try {
        await emailService.sendPasswordReset(user.email, url);
      } catch (error) {
        console.error("Failed to send password reset email:", error);
        // Fallback to console log if email fails
        console.log("Send reset password for user: ", user.id, "at url", url);
      }
    }
  },
  socialProviders: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID as string,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
      mapProfileToUser: async (profile) => {
        return {
          email: profile.email,
          name: profile.name,
          username: profile.email.split("@")[0] || profile.name,
          onboarded: false,
          displayUsername: profile.name || profile.email.split("@")[0],
          emailVerified: true,
          slug: profile.email.split("@")[0],
          firstName: profile.given_name,
          lastName: profile.family_name,
          image: profile.picture
        };
      }
    }
  },
  emailVerification: {
    sendOnSignUp: true,
    autoSignInAfterVerification: true,
    async sendVerificationEmail({ user, url }) {
      try {
        await emailService.sendOTP(
          user.email,
          url.split("=").pop() || "",
          "email-verification"
        );
      } catch (error) {
        console.error("Failed to send verification email:", error);
        console.log("Send verification email for user: ", url);
      }
    }
  },

  user: {
    changeEmail: {
      enabled: false,
      sendChangeEmailVerification: async ({ user, newEmail, url, token }) => {
        console.log(
          "Send change email verification for user: ",
          user,
          newEmail,
          url,
          token
        );
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
      trustedProviders: ["google", "email-password"]
    }
  },

  advanced: {
    database: {
      generateId: () => uuidv7()
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
          // UserWithTwoFactor doesn't have email property directly, need to get it from the user object
          const userEmail = (user as any).email || "";
          await emailService.send2FACode(userEmail, otp);
        } catch (error) {
          console.error("Failed to send 2FA OTP:", error);
          console.log("Send OTP for user: ", user, otp);
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
        console.log("Send magic link for user: ", email, token, url);
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
        console.log("Send verification OTP for user: ", email, otp, type);
      }
    }
  }),
  passkey({
    rpID: "localhost",
    rpName: "Localhost",
    origin: "http://localhost:3000"
  }),

  adminPlugin({
    ac: accessControl,
    roles: {
      admin,
      author,
      user,
      editor,
      patron
    }
  }),

  organization({
    teams: {
      enabled: false
    },
    async sendInvitationEmail(data) {
      const inviteLink = `${process.env.NEXT_PUBLIC_BETTER_AUTH_URL}/accept-invitation/${data.id}`;
      console.log("Send invite for org: ", data, inviteLink);
    },
    allowUserToCreateOrganization: async (user) => {
      return await canCreateOrg(user);
    }
  }),
  multiSession()
  // openAPI(),
  // nextCookies(),
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
    enableDebugLogs: process.env.NODE_ENV !== "production"
  },
  disableDefaultPayloadAuth: true,
  hidePluginCollections: true,
  users: {
    slug: "users", // not required, this is the default anyways
    hidden: false,
    roles: ["admin", "author", "editor", "user", "patron"],
    defaultRole: "author",

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
          if (!req.user) return false;
          if (req.user.collection === "admins") return true;
          if (req.user?.banned) return false;
          return true;
        },
        read: ({ req }) =>
          req.user?.role === "admin" ||
          ({
            or: [
              {
                id: {
                  equals: req.user?.id
                }
              },
              {
                banned: {
                  not_equals: true
                }
              }
            ]
          } as Where),
        update: ({ req }) => {
          const user = req.user;
          if (user?.collection === "admins") return true;
          if (user && user.role === "admin") {
            return true;
          }
          if (user && user?.banned) {
            return false;
          }
          return {
            id: {
              equals: user?.id
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
          if (user?.banned) return true;
          return true;
        }
      };

      // options.collection.fields = [
      //   {
      //     type: "tabs",
      //     admin: {
      //       components: {
      //         Field: {
      //           path: "@/payload/fields/Tabs/UserTabs.tsx#TabsField",
      //           clientProps: {
      //             tabsAccess: {
      //               Collections: "author"
      //             }
      //           }
      //         }
      //       }
      //     },
      //     tabs: [
      //       {
      //         label: "Profile", fields: profileFields
      //       },
      //       {
      //         label: "Account", fields: accountFields
      //       }, {
      //         label: "Collections", fields: [

      // ]
      //       },
      //     ]
      //   }
      // ]
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
      const hr = {
        ...options.collection.hooks,
        afterDelete: [
          ...(options.collection.hooks?.afterDelete || [])
          //   afterSessionDelete
        ],
        afterChange: [
          ...(options.collection.hooks?.afterChange || [])
          //   afterSessionChange
        ]
      };
      options.collection.hooks = hr;

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
      console.log("Send admin invite: ", email, url);
      return {
        success: true
      };
    }
  },
  betterAuthOptions
} satisfies BetterAuthPluginOptionsType;
export type BetterAuthPluginOptions = typeof betterAuthPluginOptions;
