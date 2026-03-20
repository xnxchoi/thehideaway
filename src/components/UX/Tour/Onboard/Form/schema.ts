import { z } from 'zod';

export const identitySchema = z.object({
  identity: z.object({
    firstName: z.string().min(2, { message: 'First name must be at least 2 characters.' }),
    lastName: z.string().min(2, { message: 'Last name must be at least 2 characters.' }),
  })
});
export const bioSchema = z.object({
  bio: z.object({
    content: z.string().min(10, { message: 'Bio must be at least 10 characters.' }),
  })
});
export const detailsSchema = z.object({
  details: z.object({
    location: z.string().min(2, { message: 'Location must be at least 2 characters.' }),
    link: z.url({ message: 'Link must be a valid URL.' }),
  })
});
export const FormSchema = z.object({
  step:z.enum(['welcome','identity', 'bio', 'details','complete']),
  ...identitySchema.shape,
  ...bioSchema.shape,
  ...detailsSchema.shape,
})
export type FormValues = z.infer<typeof FormSchema>;