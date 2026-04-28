import { z } from "zod/v4";

// Type-only mirror of the runtime schema in src/lib/env.ts. Update both
// together; src/lib/env.ts is the authoritative validator at boot.
const envSchema = z.object({
	PAYLOAD_SECRET: z.string(),
	BETTER_AUTH_SECRET: z.string(),
	PREVIEW_SECRET: z.string(),
	CRON_SECRET: z.string(),
	DATABASE_URI: z.string(),
	GOOGLE_CLIENT_ID: z.string(),
	GOOGLE_CLIENT_SECRET: z.string(),
	AUTH_NAVER_ID: z.string(),
	AUTH_NAVER_SECRET: z.string(),
	EXCHANGE_RATE_API_KEY: z.string(),
	HOLIDAY_API_KEY: z.string(),
	NEXT_PUBLIC_SERVER_URL: z.string(),
	NEXT_PUBLIC_BETTER_AUTH_URL: z.string(),
	NEXT_PUBLIC_IMAGE_MAX_FILE_SIZE: z.number(),
	NEXT_PUBLIC_VIDEO_MAX_FILE_SIZE: z.number(),
	NEXT_PUBLIC_EXCHANGE_RATE_URL: z.string(),
	NEXT_PUBLIC_HOLIDAY_API_URL: z.string(),
	NEXT_PUBLIC_BANK_ACCOUNT: z.string().optional(),
	BREVO_SMTP_USER: z.string().optional(),
	BREVO_SMTP_PASS: z.string().optional(),
	EMAIL_FROM: z.string().optional(),
	EMAIL_FROM_NAME: z.string().optional(),
	ADMIN_EMAIL: z.string().optional(),
	COOKIE_DOMAIN: z.string().optional(),
	VERCEL_PROJECT_PRODUCTION_URL: z.string().optional(),
});
declare global {
	namespace NodeJS {
		interface ProcessEnv extends z.infer<typeof envSchema> {
		}
	}
}

// If this file has no import/export statements (i.e. is a script)
// convert it into a module by adding an empty export statement.
