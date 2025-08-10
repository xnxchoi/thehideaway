import type {Media} from '@/payload-types'

export const image2: Omit<Media, 'createdAt' | 'id' | 'updatedAt'> = {
	alt: 'Math Stuff,2',
	caption: "Photo by Image on Instagram.",


}
