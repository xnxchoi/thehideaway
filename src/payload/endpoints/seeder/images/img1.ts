import type {Media} from '@/payload-types'

export const image1: Omit<Media, 'createdAt' | 'id' | 'updatedAt'> = {
	alt: 'Math Stuff,1', caption: "Photo by Image on Instagram.",

}
