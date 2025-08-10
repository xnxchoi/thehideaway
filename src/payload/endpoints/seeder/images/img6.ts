import type {Media} from '@/payload-types'

export const image6: Omit<Media, 'createdAt' | 'id' | 'updatedAt'> = {
	alt: 'Math Stuff,6',
	caption: "Photo by Image on Instagram.",
}