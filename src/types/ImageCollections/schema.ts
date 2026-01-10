import {z} from "zod/v4";

export const BaseImageSchema = {
	caption: z.string().optional(),

}
export const ImageFormSchema =
	z.object({
		collection: z.literal(["userMedia", "media"]),

		file: z.file().mime(["image/*"]).max(3_145_728),
	})
export const ImageMetaSchema = z.object({
	...BaseImageSchema,
	alt: z.string(),
	author: z.uuidv7(),

	blurDataUrl: z.string().optional(),
	id: z.uuidv7().optional(),
	width: z.number().optional(),
	height: z.number().optional(),
	darkmode: z.boolean(),
})
export type ImageMetadata = z.infer<typeof ImageMetaSchema>

export type ImageForm = z.infer<typeof ImageFormSchema>;