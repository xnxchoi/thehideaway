'use client'
import {useParams, usePathname} from 'next/navigation'

import {getPageTypeFromUrl} from '@/utilities/Helpers'

export const useGetPageType = () => {
	const c = getPageTypeFromUrl(constructURLAuto())
	return {
		pageType: c,
	}
}
export const orderedSlugs = () => {
	const params = useParams()
	let para = Object.keys(params)
	let k: string[] = []
	if (para.length > 0) {
		k = [
			...para.flatMap((item) => {
				let b = params[item]
				if (!b) return []
				if (typeof b === 'string') {
					return b
				}
				return b.flatMap((item) => item)
			}),
		]
	}
	return k
}
export const constructURLAuto = () => {
	return usePathname()
}
export const constructURL = (pathName: string, slugs: string[]) => {
	return pathName
}
