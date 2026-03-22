import { z } from 'zod';

// ─── Per-step schemas (used by parseValuesWithSchema in validators) ──────────

// Identity is required — both fields must be ≥ 2 chars
export const identitySchema = z.object({
  identity: z.object({
    firstName: z.string().min(2, { message: 'First name must be at least 2 characters.' }),
    lastName: z.string().min(2, { message: 'Last name must be at least 2 characters.' }),
  })
});

// Bio is optional — empty string is accepted, but if provided must be ≥ 10 chars
export const bioSchema = z.object({
  bio: z.object({
    content: z.union([
      z.literal(''),
      z.string().min(10, { message: 'Bio must be at least 10 characters.' }),
    ]),
  })
});

// Details are optional — empty strings accepted, but if provided must meet criteria
export const detailsSchema = z.object({
  details: z.object({
    location: z.union([
      z.literal(''),
      z.string().min(2, { message: 'Location must be at least 2 characters.' }),
    ]),
    link: z.union([
      z.literal(''),
      z.url({ message: 'Link must be a valid URL.' }),
    ]),
  })
});

// ─── Combined schema ────────────────────────────────────────────────────────

export const FormSchema = z.object({
  step: z.enum(['welcome', 'identity', 'bio', 'details', 'complete']),
  ...identitySchema.shape,
  ...bioSchema.shape,
  ...detailsSchema.shape,
});
export type FormValues = z.infer<typeof FormSchema>;

// Canonical form value type used across the tour
export type ProfileFormValues = {
  step: 'welcome' | 'identity' | 'bio' | 'details' | 'complete';
  identity: { firstName: string; lastName: string };
  bio: { content: string };
  details: { location: string; link: string };
};