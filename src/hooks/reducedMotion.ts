'use client'
import {useEffect, useState} from 'react'


import {useWindowResize} from '@/utilities/use_window_resize'

export const getIsReducedMotion = () => {
	const l = !0 === window.matchMedia('(prefers-reduced-motion: reduce)').matches
	return l
}
export const useIsReducedMotion = () => {
	const l = useWindowResize()
	const [isReducedMotion, setIsReducedMotion] = useState<boolean>(false)
	useEffect(() => {
		setIsReducedMotion(getIsReducedMotion())
	}, [l])
	return {
		isReducedMotion,
	}
}
